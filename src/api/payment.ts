import { Request , Response} from 'express'
import { db } from '../config/dbconfig';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { paymentInLushaieduPayment } from '../models/schema';
import { eq } from 'drizzle-orm';



const razorpay = new Razorpay({
    key_id: process.env.razorpay_key_id,
    key_secret: process.env.razorpay_key_secret,
});

export async function createPayment(req: Request, res: Response) {
    const { amount, description } = req.body; // description is from your schema, though not used in options yet

    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount provided.' });
    }

    const options = {
        amount: amount, // amount in the smallest currency unit (paisa)
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`, // Unique receipt ID
        payment_capture: 1 // 1 for automatic capture, 0 for manual capture
    };

    try {
        const order = await razorpay.orders.create(options);
        console.log('Order created:', order);

        // Save order details to the database using your schema
        await db.insert(paymentInLushaieduPayment).values({
            razorpayOrderId: order.id,
            amount: Number(order.amount),
            currency: order.currency,
            status: 'created', // Initial status
            description: description || null, // Save description if provided
            createdAt: new Date().toISOString(), // Ensure ISO string for 'string' mode timestamp
        });
        console.log('Order saved to database:', order.id);

        res.status(200).json(order);
    } catch (error: any) {
        console.error('Error creating Razorpay order or saving to DB:', error);
        res.status(500).json({ error: error.message || 'Failed to create order.' });
    }
}



export async function verifyPayment(req: Request, res: Response) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment verification details.' });
    }

    // Create the string to be hashed using the Razorpay Key Secret
    const generated_signature = crypto
        .createHmac('sha256', process.env.razorpay_key_secret as string) // Use process.env.razorpay_key_secret
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

    let verificationSuccess = false;
    if (generated_signature === razorpay_signature) {
        verificationSuccess = true;
        console.log('Payment verified successfully!');
    } else {
        console.warn('Payment verification failed: Signature mismatch.');
    }

    // Update payment status in the database using your schema
    try {
        await db.update(paymentInLushaieduPayment)
            .set({
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature, // Save the signature
                status: verificationSuccess ? 'paid' : 'failed',
                updatedAt: new Date().toISOString(), // Use ISO string for 'string' mode timestamp
            })
            .where(eq(paymentInLushaieduPayment.razorpayOrderId, razorpay_order_id)); // Use eq for where clause
        console.log(`Payment record for order ${razorpay_order_id} updated in DB.`);
    } catch (dbError: any) {
        console.error('Error updating payment in database:', dbError);
        // Do not return here, as the payment might still be valid even if DB update fails
    }

    if (verificationSuccess) {
        res.status(200).json({ success: true, message: 'Payment verified successfully!' });
    } else {
        res.status(400).json({ success: false, error: 'Payment verification failed: Signature mismatch.' });
    }
}
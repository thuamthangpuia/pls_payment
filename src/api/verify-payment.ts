import { Request , Response} from 'express'
import Razorpay from 'razorpay';
import crypto from 'crypto';

import { eq } from 'drizzle-orm';
import { db } from '../config/dbconfig.ts';
import { sendReceiptEmail } from './emailService.ts';
import { paymentInLushaieduPayment } from '../models/schema.ts';




const razorpay = new Razorpay({
    key_id: process.env.razorpay_key_id,
    key_secret: process.env.razorpay_key_secret,
});

export async function verifyPayment(req: Request, res: Response) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment verification details.' });
    }

   
    const generated_signature = crypto
        .createHmac('sha256', process.env.razorpay_key_secret as string) 
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

    let verificationSuccess = false;
    let paymentMethod : string | undefined ;
    if (generated_signature === razorpay_signature) {
        verificationSuccess = true;
        console.log('Payment verified successfully!');
    } else {
        console.warn('Payment verification failed: Signature mismatch.');
    }

    const paymentEntity = await razorpay.payments.fetch(razorpay_payment_id);
    
    try{
            
            paymentMethod = paymentEntity.method; 
            console.log('Payment method fetched from Razorpay API:', paymentMethod);
        } catch (fetchError: any) {
            console.error('Error fetching payment details from Razorpay API:', fetchError);
           
            paymentMethod = undefined;
        }
    

    // Update payment status in the database using your schema
    try {
        await db.update(paymentInLushaieduPayment)
            .set({
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature, // Save the signature
                status: verificationSuccess ? 'paid' : 'failed',
                updatedAt: new Date().toISOString(),
                method:paymentMethod, // Use ISO string for 'string' mode timestamp
            })
            .where(eq(paymentInLushaieduPayment.razorpayOrderId, razorpay_order_id)); 
        console.log(`Payment record for order ${razorpay_order_id} updated in DB.`);
    } catch (dbError: any) {
        console.error('Error updating payment in database:', dbError);
        // Do not return here, as the payment might still be valid even if DB update fails
    }

    let description: string;
    if (paymentEntity.description === undefined) {
        description = "Customer";
    } else {
        description = paymentEntity.description;
    }

    const ReceiptData = {
        recipientEmail: paymentEntity.email,
        customerName: req.body.name,
        amount: (Number(paymentEntity.amount) / 100) ,
        description : paymentEntity.description,
        currency: paymentEntity.currency,
        orderId: paymentEntity.order_id,
        paymentId: paymentEntity.id,
        transactionDate: paymentEntity.created_at ? new Date(paymentEntity.created_at * 1000).toISOString() : "" 
    }

    sendReceiptEmail(ReceiptData)

    
    

    if (verificationSuccess) {
        res.status(200).json({ success: true, message: 'Payment verified successfully!' });


    } else {
        res.status(400).json({ success: false, error: 'Payment verification failed: Signature mismatch.' });
    }
}
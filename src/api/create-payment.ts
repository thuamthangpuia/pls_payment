import {Request,Response} from 'express'
import Razorpay from 'razorpay';
import { db } from '../config/dbconfig.ts';
import { paymentInLushaieduPayment } from '../models/schema.ts';
import 'dotenv/config';

const razorpay = new Razorpay({
    key_id: process.env.razorpay_key_id,
    key_secret: process.env.razorpay_key_secret,
});

export async function createPayment(req: Request, res: Response) {
    if(!req.body.amount){
        res.status(400).json({error:"amount not given"})
    }
    const {description,name}=req.body
    const amount=parseInt(req.body.amount,10)
    if (!amount || typeof amount !== 'number' || amount <= 0) {
         res.status(400).json({ error: 'Invalid amount provided.' });
         return
    }

    console.log("amoupkppkpnt-->",amount)
    const options = {
        amount: amount, 
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`, 
        payment_capture: 1 
    };
    console.log('options---->',options)

    try {
        const order = await razorpay.orders.create(options);
        console.log('Order created:', order);

        await db.insert(paymentInLushaieduPayment).values({
            razorpayOrderId: order.id,
            amount: Number(order.amount),
            currency: order.currency,
            name:name,
            status: 'created', 
            description: description || null, 
            createdAt: new Date().toISOString(), 
        });
        console.log('Order saved to database:', order.id);

        res.status(200).json(order);
    } catch (error: any) {
        console.error('Error creating Razorpay order or saving to DB:', error);
        res.status(500).json({ error: error.message || 'Failed to create order.' });
    }
}

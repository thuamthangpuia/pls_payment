import { Request, Response } from "express";
import { db } from "../config/dbconfig.ts";
import { and, between, eq } from "drizzle-orm";
import { paymentInLushaieduPayment } from "../models/schema.ts";


export async function getPayments(req: Request, res: Response) {
    console.log(req.session)

    if(!req.session.user){
        res.status(401).json("Unauthorized")
        return
    }
    const { rangeStart: rangeStartParam, rangeEnd: rangeEndParam,  } = req.query;

   

    if (rangeStartParam || rangeEndParam) {
        const rangeStart = new Date(rangeStartParam as string);
        const rangeEnd = new Date(rangeEndParam as string);

        if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
            return res.status(400).json({
                error: 'Invalid date range provided. Please use a valid date format (e.g., YYYY-MM-DD).'
            });
        }

        try {
            const formattedRangeStart = rangeStart.toISOString().split('T')[0];
            const formattedRangeEnd = rangeEnd.toISOString().split('T')[0];

            const paymentsData = await db.query.paymentInLushaieduPayment.findMany({
                where: and(
                    between(paymentInLushaieduPayment.createdAt, formattedRangeStart, formattedRangeEnd),
                    eq(paymentInLushaieduPayment.status, "paid")
                ),

            });

            return res.status(200).json(paymentsData);
        } catch (error) {
            console.error('Error fetching payments:', error);
            return res.status(500).json({ error: 'Failed to fetch payments.' });
        }
    } else {
        try {
            const allPayments = await db.query.paymentInLushaieduPayment.findMany({
                where: (eq(paymentInLushaieduPayment.status,"paid"))
            });
            return res.status(200).json(allPayments);
        } catch (error) {
            console.error('Error fetching all payments:', error);
            return res.status(500).json({ error: 'Failed to fetch all payments.' });
        }
    }
}

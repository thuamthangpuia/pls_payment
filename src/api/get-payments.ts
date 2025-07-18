import { Request, Response } from "express";
import { db } from "../config/dbconfig.ts";
import { between } from "drizzle-orm";
import { paymentInLushaieduPayment } from "../models/schema.ts";


export async function getPayments(req: Request, res: Response) {
    // Use req.query for filtering parameters, as it's more standard for ranges
    const { rangeStart: rangeStartParam, rangeEnd: rangeEndParam } = req.query;

    if (rangeStartParam || rangeEndParam) {
        // Ensure params are strings before creating Date objects
        const rangeStart = new Date(rangeStartParam as string);
        const rangeEnd = new Date(rangeEndParam as string);

        if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
            return res.status(400).json({ error: 'Invalid date range provided. Please use a valid date format (e.g., YYYY-MM-DD).' });
        }

        try {
            const formattedRangeStart = rangeStart.toISOString().split('T')[0]; // Gets 'YYYY-MM-DD'
            const formattedRangeEnd = rangeEnd.toISOString().split('T')[0];     // Gets 'YYYY-MM-DD'

            // Drizzle ORM's `between` function is used directly inside the `where` clause
            const paymentsData = await db.query.paymentInLushaieduPayment.findMany({
                where: between(paymentInLushaieduPayment.createdAt, formattedRangeStart, formattedRangeEnd),
            });

            res.status(200).json(paymentsData);
        } catch (error) {
            console.error('Error fetching payments:', error);
            res.status(500).json({ error: 'Failed to fetch payments.' });
        }
    } else {
        // If no date range is provided, you might want to return all payments
        // or a default recent range, or require the range.
        // For now, I'll assume you want to return an error or all payments.
        try {
            const allPayments = await db.query.paymentInLushaieduPayment.findMany();
            res.status(200).json(allPayments);
        } catch (error) {
            console.error('Error fetching all payments:', error);
            res.status(500).json({ error: 'Failed to fetch all payments.' });
        }
        // Or, if range is mandatory:
        // return res.status(400).json({ error: 'Date range (rangeStart and rangeEnd) is required.' });
    }
}

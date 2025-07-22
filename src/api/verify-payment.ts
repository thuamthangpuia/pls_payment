import { Request , Response} from 'express'
import Razorpay from 'razorpay';
import crypto from 'crypto';
import * as fs from 'fs';
import { eq } from 'drizzle-orm';
import { db } from '../config/dbconfig.ts';
import { sendReceiptEmail } from './emailService.ts';
import PDFDocument from 'pdfkit';
import { paymentInLushaieduPayment } from '../models/schema.ts';
import path from 'path';




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
    console.log('Payment entity fetched from Razorpay API:', paymentEntity);
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
        amount: (Number(paymentEntity.amount))/100,
        description: paymentEntity.description,
        name:paymentEntity.notes.name,
        grade:paymentEntity.notes.grade,
        subjects: paymentEntity.notes.subjects,
        currency: paymentEntity.currency,
        orderId: paymentEntity.order_id,
        paymentId: paymentEntity.id,
        transactionDate: paymentEntity.created_at ? new Date(paymentEntity.created_at * 1000).toLocaleDateString() : "",
        method: paymentMethod, 
    };

    // Generate PDF receipt before sending email
    let pdfBuffer: Buffer | undefined = undefined;
    try {
        pdfBuffer = await generatePdfReceipt(ReceiptData);
    } catch (pdfError) {
        console.error('Failed to generate PDF receipt:', pdfError);
    }
    // console.log(pdfBuffer)  

    // Send the receipt email (with or without PDF)
    // sendReceiptEmail(ReceiptData,pdfBuffer);

    if (verificationSuccess && pdfBuffer) {
        // Set headers to prompt download and open in new tab
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=receipt_${paymentEntity.order_id}.pdf`);
        res.send(pdfBuffer);
    } else if (verificationSuccess) {
        res.status(200).json({ success: true, message: 'Payment verified successfully, but PDF could not be generated.' });
    } else {
        res.status(400).json({ success: false, error: 'Payment verification failed: Signature mismatch.' });
    }

// --- PDF generation function ---
async function generatePdfReceipt(paymentDetails: typeof ReceiptData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // --- Modern & Clean Receipt Content ---

        // Define some colors for consistency
        const primaryColor = '#4f46e5'; // Indigo-600
        const accentColor = '#6b7280'; // Gray-500
        const lightGray = '#f8f8f8';




        // --- Header Section ---
        const logoText = 'LushAIEdu Tuition';

        // Company Name/Logo (Left Aligned)
        doc.fillColor(primaryColor)
           .fontSize(20)
           .font('Helvetica-Bold')
           .text(logoText, doc.page.margins.left, 50); // Positioned at top-left margin


        // Receipt Title (Right Aligned)
        doc.fillColor('#333')
           .fontSize(18)
           .font('Helvetica-Bold')
           .text('RECEIPT', 0, 50, { align: 'right', width: doc.page.width - doc.page.margins.right });

        // Receipt Number and Date (Below title, right aligned)
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(accentColor)
           .text(`Receipt #: ${paymentDetails.orderId}`, { align: 'right' });
        doc.text(`Date: ${paymentDetails.transactionDate || new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown(2); // Add some space after header

        // Horizontal Separator Line
        doc.strokeColor(lightGray)
           .lineWidth(1)
           .moveTo(doc.page.margins.left, doc.y)
           .lineTo(doc.page.width - doc.page.margins.right, doc.y)
           .stroke();
        doc.moveDown(1.5); // Space after line

        // --- Customer Information & Billing Details ---
        const customerInfoX = doc.page.margins.left;
        const billingDetailsX = doc.page.width / 2;
        const currentY = doc.y;

        doc.fillColor('#333').fontSize(14).font('Helvetica-Bold').text('Billed To:', customerInfoX, currentY);
        doc.fillColor('#333').fontSize(14).font('Helvetica-Bold').text('Payment For:', billingDetailsX, currentY);
        doc.moveDown(0.5);

        // Billed To (left)
        doc.fillColor('#555').fontSize(12).font('Helvetica')
           .text('Name: ' + (paymentDetails.customerName ?? ''), customerInfoX, doc.y)
           .text('Email: ' + (paymentDetails.recipientEmail ?? ''), customerInfoX, doc.y)
           .text('Grade: ' + (paymentDetails.grade ?? ''), customerInfoX, doc.y)
           .text('Subjects: ' + (Array.isArray(paymentDetails.subjects) ? paymentDetails.subjects.join(', ') : (paymentDetails.subjects ?? '')), customerInfoX, doc.y);

        // Payment For (right)
        doc.fillColor('#555').fontSize(12).font('Helvetica')
           .text('Description: ' + (paymentDetails.description ?? ''), billingDetailsX, currentY + doc.currentLineHeight() + 2)
           .text('Payment Method: ' + (paymentDetails.method ?? ''), billingDetailsX, doc.y);

        doc.moveDown(3); // Space after this section

        // --- Itemized Breakdown (Simulated Table) ---
        // Table Headers
        const tableHeaders = ['DESCRIPTION', 'PAYMENT ID', 'ORDER ID', 'AMOUNT', 'METHOD'];
        const colWidths = [120, 90, 90, 80, 80]; // Adjust widths as needed
        const tableY = doc.y;
        let currentX = doc.page.margins.left;

        doc.fillColor(primaryColor)
           .rect(doc.page.margins.left, tableY, doc.page.width - doc.page.margins.left - doc.page.margins.right, 25)
           .fill(); // Header row background

        doc.fillColor('#fff').fontSize(11).font('Helvetica-Bold');
        tableHeaders.forEach((header, idx) => {
            doc.text(header, currentX, tableY + 8, { width: colWidths[idx], align: 'left' });
            currentX += colWidths[idx];
        });
        doc.moveDown(1.5);

        // Table Row (for the single payment)
        const rowY = doc.y;
        currentX = doc.page.margins.left;
        doc.fillColor('#333').fontSize(11).font('Helvetica');

        // Description
        doc.text(paymentDetails.description ?? '', currentX, rowY, { width: colWidths[0], align: 'left' });
        currentX += colWidths[0];
        // Payment ID
        doc.text(paymentDetails.paymentId ?? '', currentX, rowY, { width: colWidths[1], align: 'left' });
        currentX += colWidths[1];
        // Order ID
        doc.text(paymentDetails.orderId ?? '', currentX, rowY, { width: colWidths[2], align: 'left' });
        currentX += colWidths[2];
        // Amount
        doc.text(`${paymentDetails.currency ?? ''} ${(paymentDetails.amount)}`, currentX, rowY, { width: colWidths[3], align: 'right' });
        currentX += colWidths[3];
        // Method
        doc.text(paymentDetails.method ?? '', currentX, rowY, { width: colWidths[4], align: 'left' });
        doc.moveDown(2); // Space after table

        // --- Total Section ---
        const totalLabelX = doc.page.width - doc.page.margins.right - 150; // Align label to the right
        const totalValueX = doc.page.width - doc.page.margins.right - 50; // Align value further right

        doc.fillColor('#333').fontSize(14).font('Helvetica-Bold');
        doc.text('Total Paid:', totalLabelX, doc.y, { align: 'left' });
        doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold')
           .text(`${paymentDetails.currency} ${(paymentDetails.amount).toFixed(2)}`, totalValueX, doc.y - 4, { align: 'right' }); // Adjust Y for alignment

        doc.moveDown(3);

        // --- Footer ---
        doc.fillColor(accentColor).fontSize(10).font('Helvetica');
        doc.text('For support, visit lushaitech.com or contact us.', { align: 'center' });
        doc.moveDown(0.5);
        doc.text(`© ${new Date().getFullYear()} LushaiTech. All rights reserved.`, { align: 'center' });

        doc.end();
    });
}}
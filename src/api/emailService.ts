import transporter from "../config/emailconfig.ts";

interface ReceiptEmailData {
    recipientEmail: string;
    customerName: string;
    amount: number; // Amount in Rupees for display
    description : string | undefined;
    currency: string;
    orderId: string; // Your internal order ID or Razorpay Order ID
    paymentId: string; // Razorpay Payment ID
    transactionDate: string; // Formatted date
}

/**
 * Sends a payment receipt email to the customer.
 * @param data - Object containing all necessary data for the email.
 */
export async function sendReceiptEmail(data: ReceiptEmailData) {
    const { recipientEmail, customerName,description, amount, currency,  orderId, paymentId, transactionDate } = data;

    const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #007bff;">Payment Receipt from LushAI Tuition</h2>
            <p>Dear ${customerName || 'Customer'},</p>
            <p>Thank you for your payment!</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">Amount Paid:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${currency} ${amount.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">Description:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${description}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">Order ID:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${orderId}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">Payment ID:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${paymentId}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">Transaction Date:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${transactionDate}</td>
                </tr>
            </table>
            <p>If you have any questions, please contact us.</p>
            <p>Sincerely,<br>LushAI Tuition </p>
        </div>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER, 
        to: recipientEmail, 
        subject: `Your Payment Receipt from LushAI Tuition - Order ${orderId}`, 
        html: emailHtml, // HTML body
        // attachments: [ // Optional: Attach a PDF receipt if you generate one
        //     {
        //         filename: `receipt_${orderId}.pdf`,
        //         path: '/path/to/your/generated/receipt.pdf', // Replace with actual path
        //         contentType: 'application/pdf'
        //     }
        // ]
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Receipt email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Failed to send receipt email:', error);
        return false;
    }
}
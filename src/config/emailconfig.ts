// src/config/emailConfig.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables


const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com', 
    port: parseInt(process.env.EMAIL_PORT || '587', 10), // 587 for TLS, 465 for SSL
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        type:'OAuth2',
        user:'lushaiemailsender@gmail.com',
        clientId:process.env.OAUTH_CLIENT_ID,
        clientSecret:process.env.OAUTH_CLIENT_SECRET,
        refreshToken:process.env.OAUTH_REFRESH_TOKEN,
        
    },
    // Optional: For debugging, uncomment this
    // logger: true,
    // debug: true,
});

// Verify connection configuration (optional, but good for debugging)
transporter.verify(function (error, success) {
    if (error) {
        console.error("Email transporter configuration error:", error);
    } else {
        console.log("Email transporter is ready to send messages");
    }
});

export default transporter;
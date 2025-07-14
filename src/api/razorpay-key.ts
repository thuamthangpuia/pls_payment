import { Request, Response } from 'express';

// This endpoint returns the Razorpay Key ID to the frontend securely
export default function razorpay_key(req: Request, res: Response) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Get the key from environment variable
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    return res.status(500).json({ error: 'Razorpay Key ID not configured' });
  }
  res.json({ key: keyId });
}

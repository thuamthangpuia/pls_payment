import { Request,Response } from "express";
import express from 'express'
import { createPayment } from "../api/create-payment.ts";
import { verifyPayment } from "../api/verify-payment.ts";
import razorpay_key from "../api/razorpay-key.ts";
import { getPayments } from "../api/get-payments.ts";
import { login, logout } from "../api/login.ts";


var router = express.Router();

/* GET home page. */
router.post("/create-payment",createPayment)
router.post("/verify-payment",verifyPayment)
router.get("/razorpay-key",razorpay_key)
router.get("/get-payments",getPayments)
router.post("/login",login)
router.post("/logout",logout)

export default router
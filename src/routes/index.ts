import { Request,Response } from "express";
import express from 'express'
import { createPayment } from "../api/create-payment.ts";
import { verifyPayment } from "../api/verify-payment.ts";


var router = express.Router();

/* GET home page. */
router.post("/create-payment",createPayment)
router.post("/verify-payment",verifyPayment)


export default router
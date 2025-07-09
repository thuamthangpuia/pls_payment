import { Request,Response } from "express";
import express from 'express'
import { createPayment, verifyPayment } from "../api/payment";

var router = express.Router();

/* GET home page. */
router.get("/api/create-payment",createPayment)
router.post("/api/verify-payment",verifyPayment)

module.exports = router;

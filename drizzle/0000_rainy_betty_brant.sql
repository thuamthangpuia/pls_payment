-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE SCHEMA "lushaiedu_payment";
--> statement-breakpoint
CREATE TABLE "lushaiedu_payment"."payment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lushaiedu_payment"."lushaiedu_payment.payment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 34354354 START WITH 1 CACHE 1),
	"amount" integer NOT NULL,
	"status" varchar(50),
	"currency" varchar(5),
	"description" varchar(255),
	"method" varchar(20),
	"razorpay_order_id" varchar(255),
	"razorpay_payment_id" varchar(255),
	"razorpay_signature" varchar(255),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp
);

*/
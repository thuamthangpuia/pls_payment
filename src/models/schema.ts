import { pgTable, pgSchema, integer, varchar, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const lushaieduPayment = pgSchema("lushaiedu_payment");


export const paymentInLushaieduPayment = lushaieduPayment.table("payment", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "lushaiedu_payment.payment_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 34354354, cache: 1 }),
	amount: integer().notNull(),
	status: varchar({ length: 50 }),
	currency: varchar({ length: 5 }),
	description: varchar(),
	method: varchar({ length: 20 }),
	razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
	razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
	razorpaySignature: varchar("razorpay_signature", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	name: varchar({ length: 255 }),
	subjects: varchar().array(),
	grade: varchar({ length: 20})
});

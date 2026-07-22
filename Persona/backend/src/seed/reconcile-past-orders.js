import "dotenv/config";
import mongoose from "mongoose";
import Stripe from "stripe";
import Order from "../models/Order.js";

const testStripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const liveKey = process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const liveStripe = new Stripe(liveKey);

const reconcilePastOrders = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected!");

    const pendingOrders = await Order.find({
      $or: [
        { orderStatus: "created" },
        { "payment.status": { $ne: "paid" } }
      ],
      checkoutSessionId: { $exists: true, $ne: null }
    });

    console.log(`Found ${pendingOrders.length} pending/created orders with checkoutSessionId. Checking Stripe...`);

    let updatedCount = 0;

    for (const order of pendingOrders) {
      if (order.checkoutSessionId && order.checkoutSessionId.startsWith("cs_")) {
        try {
          const isLive = order.checkoutSessionId.startsWith("cs_live_");
          const stripeInstance = isLive ? liveStripe : testStripe;

          const session = await stripeInstance.checkout.sessions.retrieve(order.checkoutSessionId);
          if (session.payment_status === "paid") {
            order.orderStatus = "paid";
            order.payment.status = "paid";
            order.payment.paymentId = session.payment_intent || order.payment.paymentId || session.id;
            order.payment.paidAt = order.payment.paidAt || new Date(session.created * 1000);
            await order.save();

            updatedCount++;
            console.log(`✅ Reconciled order ${order.orderNumber} (£${order.totalAmount}) [${isLive ? 'LIVE' : 'TEST'}] -> PAID`);
          } else {
            console.log(`ℹ️ Order ${order.orderNumber} is still ${session.payment_status} on Stripe`);
          }
        } catch (err) {
          console.error(`❌ Error checking order ${order.orderNumber} (${order.checkoutSessionId}):`, err.message);
        }
      }
    }

    console.log(`\n🎉 Done! Updated ${updatedCount} out of ${pendingOrders.length} checked orders to PAID.`);
    process.exit(0);
  } catch (error) {
    console.error("Error reconciling orders:", error);
    process.exit(1);
  }
};

reconcilePastOrders();

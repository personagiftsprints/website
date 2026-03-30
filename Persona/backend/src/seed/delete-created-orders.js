import "dotenv/config";
import mongoose from "mongoose";
import Order from "../models/Order.js";

const deleteCreatedOrders = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected!");

        const result = await Order.deleteMany({ orderStatus: "created" });
        console.log(`Successfully deleted ${result.deletedCount} orders with status 'created'.`);

        process.exit(0);
    } catch (error) {
        console.error("Error deleting 'created' orders:", error);
        process.exit(1);
    }
};

deleteCreatedOrders();

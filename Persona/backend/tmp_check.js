import mongoose from 'mongoose';
import Product from './src/models/Product.model.js';
import dotenv from 'dotenv';
dotenv.config();

const checkTrending = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const trending = await Product.find({ isTrending: true }).select('name isActive isTrending');
        console.log('Trending Products:', JSON.stringify(trending, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkTrending();

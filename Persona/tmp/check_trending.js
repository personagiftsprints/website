import mongoose from 'mongoose';
import Product from '../models/Product.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkTrending = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const trending = await Product.find({ isTrending: true }).select('name isActive isTrending');
        console.log('Trending Products:', JSON.stringify(trending, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkTrending();


import mongoose from 'mongoose';
import Product from './backend/src/models/Product.model.js';
import Subcategory from './backend/src/models/Subcategory.js';
import Category from './backend/src/models/Category.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/persona_gifts';

async function checkData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const productCount = await Product.countDocuments();
        const subcategoryCount = await Subcategory.countDocuments();
        const categoryCount = await Category.countDocuments();

        console.log(`Products: ${productCount}`);
        console.log(`Subcategories: ${subcategoryCount}`);
        console.log(`Categories: ${categoryCount}`);

        const productsWithSubcategory = await Product.countDocuments({ subcategory: { $exists: true, $ne: null } });
        console.log(`Products with subcategory: ${productsWithSubcategory}`);

        const subcats = await Subcategory.find().limit(5);
        console.log('Sample Subcategories:', subcats.map(s => s.name));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();

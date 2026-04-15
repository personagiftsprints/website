import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = "";

async function renameViews() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");
  const db = mongoose.connection.db;

  const result = await db.collection('mugprintconfigs').updateMany(
    { 'views.center': { $exists: true } },
    { $set: { 
        'views.center.areas': [
          {
            id: "center",
            name: "Center Panel",
            max: "8 × 8 cm per panel",
            type: "single",
            slots: [],
            references: [],
            description: "Center panel design"
          }
        ]
      } 
    }
  );

  console.log("Updated documents areas:", result.modifiedCount);
  await mongoose.disconnect();
}

renameViews().catch(console.error);

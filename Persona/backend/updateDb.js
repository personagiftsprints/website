import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = "mongodb+srv://personagiftsprintsadmin:YehVfuGESb0eQYxS@personacluster.0lhs5bg.mongodb.net/persona?appName=PersonaCluster";

async function renameViews() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");
  const db = mongoose.connection.db;

  const result = await db.collection('mugprintconfigs').updateMany(
    { 'views.full_wrap': { $exists: true } },
    { $rename: { 'views.full_wrap': 'views.center' } }
  );

  console.log("Renamed documents:", result.modifiedCount);
  await mongoose.disconnect();
}

renameViews().catch(console.error);

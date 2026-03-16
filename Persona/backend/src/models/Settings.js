import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    maintenanceMode: {
      isActive: { type: Boolean, default: false },
      message: { type: String, default: "Website is under maintenance. We will be back soon!" },
      expectedEndTime: { type: Date }
    },
    siteInfo: {
      name: { type: String, default: "Persona Gifts" },
      contactEmail: { type: String },
      phone: { type: String }
    },
    shipping: {
      deliveryCharge: { type: Number, default: 5 },
      threshold: { type: Number, default: 100 }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);

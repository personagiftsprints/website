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
    }
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);

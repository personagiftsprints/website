import mongoose from "mongoose";

const designLibrarySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    productType: {
      type: String,
      required: true,
      enum: [
        'tshirt',
        'mug',
        'mobileCase',
        'hoodie',
        'poster',
        'frame',
        'sticker',
        'hat',
        'normal',
        'other'
      ],
      default: 'other'
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory'
    },
    isActive: { type: Boolean, default: true },
    metadata: {
      defaultScale: { type: Number, default: 1 },
      defaultPosition: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
      },
      tags: [String]
    }
  },
  { timestamps: true }
);

designLibrarySchema.index({ productType: 1, isActive: 1 });

export default mongoose.model("DesignLibrary", designLibrarySchema);

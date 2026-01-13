import mongoose from "mongoose"

const MobileCaseAreaSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  max: { type: String, required: true },
  type: { type: String, enum: ["text", "image", "both"], default: "both" },
  description: { type: String },
  references: { type: [String], default: [] }
}, { _id: false })

const MobileCaseViewSchema = new mongoose.Schema({
  baseImage: { type: String, required: true },
  areas: { type: [MobileCaseAreaSchema], default: [] }
}, { _id: false })

const MobileCaseModelSchema = new mongoose.Schema({
  modelName: { type: String, required: true }, // e.g., "iPhone 11", "iPhone 12"
  modelCode: { type: String, required: true }, // e.g., "iphone11", "iphone12"
  year: { type: Number, required: true }, // e.g., 2019, 2020
  displaySize: { type: String, required: true }, // e.g., "6.1 inch"
  dimensions: {
    height: { type: String, required: true }, // e.g., "150.9 mm"
    width: { type: String, required: true }, // e.g., "75.7 mm"
    thickness: { type: String, required: true } // e.g., "8.3 mm"
  },
  view: { type: MobileCaseViewSchema, required: true }
}, { _id: false })

const MobileCasePrintConfigSchema = new mongoose.Schema({
  isDefault: { type: Boolean, default: false },
  productType: { 
    type: String, 
    required: true,
    enum: ["phone_case", "tablet_case", "laptop_skin"],
    default: "phone_case"
  },
  brand: { 
    type: String, 
    required: true,
    enum: ["apple"],
    default: "apple"
  },
  caseType: {
    type: String,
    required: true,
    enum: ["hard_case", "soft_case", "bumper_case", "wallet_case", "clear_case"],
    default: "hard_case"
  },
  models: { type: [MobileCaseModelSchema], default: [] }
}, { timestamps: true })

export const DEFAULT_MOBILE_CASE_PRINT_CONFIG = {
  isDefault: true,
  productType: "phone_case",
  brand: "apple",
  caseType: "hard_case",
  models: [
    {
      modelName: "iPhone 15",
      modelCode: "iphone15",
      year: 2023,
      displaySize: "6.1 inch",
      dimensions: {
        height: "147.6 mm",
        width: "71.6 mm",
        thickness: "7.8 mm"
      },
      view: {
        baseImage: "https://example.com/cases/iphone15/front-base.png",
        areas: [
          {
            id: "center_back",
            name: "Center Back Area",
            max: "12 × 6 cm",
            type: "both",
            description: "Main design area at the center back of the case",
            references: [
              "https://images.unsplash.com/photo-1616348436168-de43ad0db179",
              "https://images.unsplash.com/photo-1605236453806-6ff36851218e",
              "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa"
            ]
          }
        ]
      }
    },
    {
      modelName: "iPhone 15 Pro",
      modelCode: "iphone15pro",
      year: 2023,
      displaySize: "6.1 inch",
      dimensions: {
        height: "146.6 mm",
        width: "70.6 mm",
        thickness: "8.25 mm"
      },
      view: {
        baseImage: "https://example.com/cases/iphone15pro/front-base.png",
        areas: [
          {
            id: "center_back",
            name: "Center Back Area",
            max: "12 × 6 cm",
            type: "both",
            description: "Main design area at the center back of the case",
            references: [
              "https://images.unsplash.com/photo-1616348436168-de43ad0db179",
              "https://images.unsplash.com/photo-1605236453806-6ff36851218e"
            ]
          }
        ]
      }
    },
    {
      modelName: "iPhone 14",
      modelCode: "iphone14",
      year: 2022,
      displaySize: "6.1 inch",
      dimensions: {
        height: "146.7 mm",
        width: "71.5 mm",
        thickness: "7.8 mm"
      },
      view: {
        baseImage: "https://example.com/cases/iphone14/front-base.png",
        areas: [
          {
            id: "center_back",
            name: "Center Back Area",
            max: "12 × 6 cm",
            type: "both",
            description: "Main design area at the center back of the case",
            references: [
              "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa"
            ]
          }
        ]
      }
    },
    {
      modelName: "iPhone 13",
      modelCode: "iphone13",
      year: 2021,
      displaySize: "6.1 inch",
      dimensions: {
        height: "146.7 mm",
        width: "71.5 mm",
        thickness: "7.65 mm"
      },
      view: {
        baseImage: "https://example.com/cases/iphone13/front-base.png",
        areas: [
          {
            id: "center_back",
            name: "Center Back Area",
            max: "11.5 × 5.8 cm",
            type: "both",
            description: "Main design area at the center back of the case",
            references: [
              "https://images.unsplash.com/photo-1600618528240-fb9fc964b853"
            ]
          }
        ]
      }
    },
    {
      modelName: "iPhone 12",
      modelCode: "iphone12",
      year: 2020,
      displaySize: "6.1 inch",
      dimensions: {
        height: "146.7 mm",
        width: "71.5 mm",
        thickness: "7.4 mm"
      },
      view: {
        baseImage: "https://example.com/cases/iphone12/front-base.png",
        areas: [
          {
            id: "center_back",
            name: "Center Back Area",
            max: "11 × 5.5 cm",
            type: "both",
            description: "Main design area at the center back of the case",
            references: [
              "https://images.unsplash.com/photo-1601972599720-36938d4ecd31"
            ]
          }
        ]
      }
    },
    {
      modelName: "iPhone 11",
      modelCode: "iphone11",
      year: 2019,
      displaySize: "6.1 inch",
      dimensions: {
        height: "150.9 mm",
        width: "75.7 mm",
        thickness: "8.3 mm"
      },
      view: {
        baseImage: "https://example.com/cases/iphone11/front-base.png",
        areas: [
          {
            id: "center_back",
            name: "Center Back Area",
            max: "12.5 × 6.5 cm",
            type: "both",
            description: "Main design area at the center back of the case",
            references: [
              "https://images.unsplash.com/photo-1573148195900-7845dcb9b127"
            ]
          }
        ]
      }
    },
    {
      modelName: "iPhone SE (3rd Gen)",
      modelCode: "iphonese3",
      year: 2022,
      displaySize: "4.7 inch",
      dimensions: {
        height: "138.4 mm",
        width: "67.3 mm",
        thickness: "7.3 mm"
      },
      view: {
        baseImage: "https://example.com/cases/iphonese3/front-base.png",
        areas: [
          {
            id: "center_back",
            name: "Center Back Area",
            max: "9 × 4.5 cm",
            type: "both",
            description: "Main design area at the center back of the case",
            references: [
              "https://images.unsplash.com/photo-1605236453806-6ff36851218e"
            ]
          }
        ]
      }
    }
  ]
}

// Sample Samsung models
export const SAMSUNG_MOBILE_CASE_PRINT_CONFIG = {
  isDefault: true,
  productType: "phone_case",
  brand: "samsung",
  caseType: "hard_case",
  models: [
    {
      modelName: "Galaxy S23",
      modelCode: "galaxys23",
      year: 2023,
      displaySize: "6.1 inch",
      dimensions: {
        height: "146.3 mm",
        width: "70.9 mm",
        thickness: "7.6 mm"
      },
      view: {
        baseImage: "https://example.com/cases/galaxys23/front-base.png",
        areas: [
          {
            id: "center_back",
            name: "Center Back Area",
            max: "12 × 6 cm",
            type: "both",
            description: "Main design area at the center back of the case",
            references: []
          }
        ]
      }
    }
  ]
}

export default mongoose.model(
  "MobileCasePrintConfig",
  MobileCasePrintConfigSchema
)
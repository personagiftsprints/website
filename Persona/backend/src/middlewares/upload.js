import multer from "multer"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import cloudinary from "../config/cloudinary.js"

const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ quality: "auto", fetch_format: "auto" }]
  }
})

const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "banner",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 8063,
        height: 2419,
        crop: "fill",
        quality: "auto",
        fetch_format: "auto"
      }
    ]
  }
})

export const productUpload = multer({
  storage: productStorage,
  limits: { files: 5 }
})

export const bannerUpload = multer({
  storage: bannerStorage,
  limits: { files: 1 }
})


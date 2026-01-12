import express from "express"
import {
  initProduct,
  createProduct,
  getProductBySlug
} from "../controllers/product.controller.js"

const router = express.Router()

router.post("/admin/products/init", initProduct)
router.post("/admin/products", createProduct)
router.get("/products/:slug", getProductBySlug)

export default router

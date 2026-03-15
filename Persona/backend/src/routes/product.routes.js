import express from 'express'
import { authMiddleware, adminOnly } from '../middlewares/auth.middleware.js'
import {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
  getProductsByType,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getProductAttributesByType,
  getLandingProducts,
  getSimilarProducts,
  getStockManagement,
  getProductBySku,
  getProductCustomization,
  getProductsByCategory
} from '../controllers/product.controller.js'
import { searchProducts } from '../controllers/product.controller.js'
const router = express.Router()


router.get('/sku/:sku', getProductBySku)
router.post('/', authMiddleware, adminOnly, createProduct)
router.get('/stock/manage', getStockManagement)
router.get('/', getAllProducts)
router.get('/search', searchProducts)
router.get('/trending-products', getLandingProducts)
router.get('/type/:type', getProductsByType)   // 👈 ADD THIS
router.get('/category/:categorySlug', getProductsByCategory)
router.get('/category/:categorySlug/:subcategorySlug', getProductsByCategory)
router.get('/slug/:slug', getProductBySlug)
router.get('/:id', getProductById)
router.get('/product-attributes/:type', getProductAttributesByType )
router.get('/similar/:type', getSimilarProducts  )
// Add this after your existing routes
router.get('/customization/:slug', getProductCustomization);

router.put('/:id', authMiddleware, adminOnly, updateProduct)
router.delete('/:id', authMiddleware, adminOnly, deleteProduct)
router.patch('/:id/status', authMiddleware, adminOnly, toggleProductStatus)


export default router

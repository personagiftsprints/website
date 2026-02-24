import express from 'express'
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
  getProductCustomization
} from '../controllers/product.controller.js'

const router = express.Router()


router.get('/sku/:sku', getProductBySku)
router.post('/', createProduct)
router.get('/stock/manage', getStockManagement)
router.get('/', getAllProducts)

router.get('/trending-products', getLandingProducts)
router.get('/type/:type', getProductsByType)   // 👈 ADD THIS
router.get('/slug/:slug', getProductBySlug)
router.get('/:id', getProductById)
router.get('/product-attributes/:type', getProductAttributesByType )
router.get('/similar/:type', getSimilarProducts  )
// Add this after your existing routes
router.get('/customization/:slug', getProductCustomization);

router.put('/:id', updateProduct)
router.delete('/:id', deleteProduct)
router.patch('/:id/status', toggleProductStatus)


export default router

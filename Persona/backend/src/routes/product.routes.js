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
  getProductAttributesByType
} from '../controllers/product.controller.js'

const router = express.Router()

router.post('/', createProduct)

router.get('/', getAllProducts)
router.get('/type/:type', getProductsByType)   // 👈 ADD THIS
router.get('/slug/:slug', getProductBySlug)
router.get('/:id', getProductById)
router.get('/product-attributes/:type', getProductAttributesByType )

router.put('/:id', updateProduct)
router.delete('/:id', deleteProduct)
router.patch('/:id/status', toggleProductStatus)


export default router

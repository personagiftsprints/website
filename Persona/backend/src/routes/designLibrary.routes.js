import express from 'express';
import {
  createDesign,
  getDesigns,
  updateDesign,
  deleteDesign,
  getDesignsByProductType,
  getDesignById
} from '../controllers/designLibrary.controller.js';

const router = express.Router();

router.post('/', createDesign);
router.get('/', getDesigns);
router.get('/:id', getDesignById);
router.get('/type/:type', getDesignsByProductType);
router.put('/:id', updateDesign);
router.delete('/:id', deleteDesign);

export default router;

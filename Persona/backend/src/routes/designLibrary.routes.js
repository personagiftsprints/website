import express from 'express';
import {
  createDesign,
  getDesigns,
  updateDesign,
  deleteDesign,
  getDesignsByProductType
} from '../controllers/designLibrary.controller.js';

const router = express.Router();

router.post('/', createDesign);
router.get('/', getDesigns);
router.get('/type/:type', getDesignsByProductType);
router.put('/:id', updateDesign);
router.delete('/:id', deleteDesign);

export default router;

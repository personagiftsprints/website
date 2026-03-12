import express from "express";
import Category from "../models/Category.js";
import Subcategory from "../models/Subcategory.js";

const router = express.Router();

// Categories
router.get("/", async (req, res) => {
  try {
    const filter = req.query.activeOnly === 'true' ? { isActive: true } : {};
    const categories = await Category.find(filter);
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, slug } = req.body;
    const category = new Category({ name, slug });
    await category.save();
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    await Subcategory.deleteMany({ category: req.params.id });
    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    
    category.isActive = !category.isActive;
    await category.save();
    
    // Optionally also disable all subcategories when disabling category
    if (!category.isActive) {
       await Subcategory.updateMany({ category: category._id }, { isActive: false });
    }
    
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Subcategories
router.get("/subcategories", async (req, res) => {
  try {
    const filter = req.query.activeOnly === 'true' ? { isActive: true } : {};
    const subcategories = await Subcategory.find(filter).populate("category");
    res.json({ success: true, data: subcategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:categoryId/subcategories", async (req, res) => {
  try {
    const filter = { category: req.params.categoryId };
    if (req.query.activeOnly === 'true') {
      filter.isActive = true;
    }
    const subcategories = await Subcategory.find(filter);
    res.json({ success: true, data: subcategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/subcategories", async (req, res) => {
  try {
    const { name, slug, category } = req.body;
    const subcategory = new Subcategory({ name, slug, category });
    await subcategory.save();
    res.json({ success: true, data: subcategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/subcategories/:id", async (req, res) => {
  try {
    await Subcategory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Subcategory deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/subcategories/:id/status", async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) return res.status(404).json({ success: false, message: "Subcategory not found" });
    
    subcategory.isActive = !subcategory.isActive;
    await subcategory.save();
    
    res.json({ success: true, data: subcategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

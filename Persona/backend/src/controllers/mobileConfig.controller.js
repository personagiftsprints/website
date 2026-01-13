// routes/mobile-case-print-config.js
import express from "express"
import MobileCasePrintConfig from "../models/MobileCasePrintConfig.js"
import { DEFAULT_MOBILE_CASE_PRINT_CONFIG } from "../models/MobileCasePrintConfig.js"

const router = express.Router()

// Get all mobile case configurations
router.get("/", async (req, res) => {
  try {
    const configs = await MobileCasePrintConfig.find()
    res.json({ success: true, data: configs })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get mobile case configuration by type/brand
router.get("/:type", async (req, res) => {
  try {
    const { type } = req.params
    const config = await MobileCasePrintConfig.findOne({ 
      productType: type,
      isDefault: true 
    })
    
    if (!config) {
      // Return default config if not found
      return res.json({ 
        success: true, 
        data: DEFAULT_MOBILE_CASE_PRINT_CONFIG 
      })
    }
    
    res.json({ success: true, data: config })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Create or update mobile case configuration
router.post("/", async (req, res) => {
  try {
    const { productType, brand, caseType } = req.body
    
    let config = await MobileCasePrintConfig.findOne({
      productType,
      brand,
      caseType
    })
    
    if (config) {
      // Update existing
      Object.assign(config, req.body)
      await config.save()
    } else {
      // Create new
      config = new MobileCasePrintConfig(req.body)
      await config.save()
    }
    
    res.json({ success: true, data: config })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Add a new model to configuration
router.post("/:id/models", async (req, res) => {
  try {
    const { id } = req.params
    const modelData = req.body
    
    const config = await MobileCasePrintConfig.findById(id)
    if (!config) {
      return res.status(404).json({ success: false, error: "Config not found" })
    }
    
    config.models.push(modelData)
    await config.save()
    
    res.json({ success: true, data: config })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Update a specific model
router.put("/:configId/models/:modelCode", async (req, res) => {
  try {
    const { configId, modelCode } = req.params
    const modelData = req.body
    
    const config = await MobileCasePrintConfig.findById(configId)
    if (!config) {
      return res.status(404).json({ success: false, error: "Config not found" })
    }
    
    const modelIndex = config.models.findIndex(m => m.modelCode === modelCode)
    if (modelIndex === -1) {
      return res.status(404).json({ success: false, error: "Model not found" })
    }
    
    config.models[modelIndex] = { ...config.models[modelIndex], ...modelData }
    await config.save()
    
    res.json({ success: true, data: config })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Initialize default mobile case configurations
router.post("/init/default", async (req, res) => {
  try {
    // Clear existing defaults
    await MobileCasePrintConfig.deleteMany({ isDefault: true })
    
    // Create iPhone default config
    const iphoneConfig = new MobileCasePrintConfig(DEFAULT_MOBILE_CASE_PRINT_CONFIG)
    await iphoneConfig.save()
    
    // Create Samsung default config
    const samsungConfig = new MobileCasePrintConfig(SAMSUNG_MOBILE_CASE_PRINT_CONFIG)
    await samsungConfig.save()
    
    res.json({ 
      success: true, 
      message: "Default mobile case configurations initialized",
      data: { iphoneConfig, samsungConfig }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
import { PRINT_MODELS } from "../config/printModels.config.js"
import mongoose from "mongoose"


export const getAvailablePrintModels = async (req, res) => {
  try {
    const data = []

    for (const item of PRINT_MODELS) {
      const doc = await item.model.findOne({ isDefault: true }).lean()
      if (!doc) continue

      if (item.type === "mobileCase") {
        data.push({
          name: item.name,
          type: item.type,
          models: doc.models
        })
      } else {
        data.push({
          name: item.name,
          type: item.type,
          views: doc.views
        })
      }
    }

    res.status(200).json({
      success: true,
      data
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch print models"
    })
  }
}


export const getConfigBySlug = async (req, res) => {
  try {
    const slug = req.params.slug

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required"
      })
    }

    const printItem = PRINT_MODELS.find(item => item.type === slug)

    if (!printItem) {
      return res.status(404).json({
        success: false,
        message: "Invalid print model type"
      })
    }

    const doc = await printItem.model
      .findOne({ isDefault: true })
      .lean()

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Default config not found"
      })
    }

    const data =
      printItem.type === "mobileCase"
        ? {
            _id: doc._id,                 // ✅ MongoDB ID
            name: printItem.name,
            type: printItem.type,
            models: doc.models
          }
        : {
            _id: doc._id,                 // ✅ MongoDB ID
            name: printItem.name,
            type: printItem.type,
            views: doc.views
          }

    res.status(200).json({
      success: true,
      data
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch print model config"
    })
  }
}


export const updatePrintConfig = async (req, res) => {
  try {
    const { slug, configId } = req.params
    const updateData = req.body

    if (!slug || !configId) {
      return res.status(400).json({
        success: false,
        message: "Slug and configId are required"
      })
    }

    if (!mongoose.Types.ObjectId.isValid(configId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid config ID"
      })
    }

    const printItem = PRINT_MODELS.find(item => item.type === slug)

    if (!printItem) {
      return res.status(404).json({
        success: false,
        message: "Invalid print model type"
      })
    }

    const updatedConfig = await printItem.model.findByIdAndUpdate(
      configId,
      {
        $set: updateData
      },
      {
        new: true,       // return updated doc
        runValidators: true
      }
    )

    if (!updatedConfig) {
      return res.status(404).json({
        success: false,
        message: "Print config not found"
      })
    }

    res.status(200).json({
      success: true,
      message: "Print config updated successfully",
      data: updatedConfig
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      message: "Failed to update print config"
    })
  }
}

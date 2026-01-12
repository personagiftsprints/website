import { PRINT_MODELS } from "../config/printModels.config.js"

export const getAvailablePrintModels = async (req, res) => {
  try {
    const data = []

    for (const item of PRINT_MODELS) {
      const doc = await item.model.findOne({ isDefault: true }).lean()
      if (!doc) continue

      data.push({
        name: item.name,
        type: item.type,
        views: doc.views
      })
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

import TshirtPrintConfig from "../models/print/TshirtPrintConfig.model.js"
import MugPrintConfigModel from "../models/print/MugPrintConfig.model.js"

export const PRINT_MODELS = [
    {
      name: "T-Shirt",
      type: "tshirt",
      model: TshirtPrintConfig
    },
    {
      name: "Mug",
      type: "mug",
      model: MugPrintConfigModel
    }
  ]

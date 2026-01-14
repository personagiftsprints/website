import TshirtPrintConfig from "../models/print/TshirtPrintConfig.model.js"
import MugPrintConfigModel from "../models/print/MugPrintConfig.model.js"
import MobileConfigModel from "../models/print/MobileCaseConfig.model.js"
import singlePrintAreaConfigModel from "../models/print/singlePrintAreaConfig.model.js"

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
    },
     {
      name: "Mobile Case",
      type: "mobileCase",
      model: MobileConfigModel
    },
    {
    name: "General Print",
    type: "general",
    model: singlePrintAreaConfigModel
  }
  ]

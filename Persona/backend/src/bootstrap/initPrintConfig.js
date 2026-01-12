import TshirtPrintConfig, {
  DEFAULT_TSHIRT_PRINT_CONFIG
} from "../models/print/TshirtPrintConfig.model.js"

import MugPrintConfig, {
  DEFAULT_MUG_PRINT_CONFIG
} from "../models/print/MugPrintConfig.model.js"

export const initPrintConfigs = async () => {
  const tshirtExists = await TshirtPrintConfig.exists({ isDefault: true })
  if (!tshirtExists) {
    await TshirtPrintConfig.create(DEFAULT_TSHIRT_PRINT_CONFIG)
    console.log("Default T-shirt print config created")
  }

  const mugExists = await MugPrintConfig.exists({ isDefault: true })
  if (!mugExists) {
    await MugPrintConfig.create(DEFAULT_MUG_PRINT_CONFIG)
    console.log("Default Mug print config created")
  }
}

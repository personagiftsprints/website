import TshirtPrintConfig, {
  DEFAULT_TSHIRT_PRINT_CONFIG
} from "../models/print/TshirtPrintConfig.model.js"

import MugPrintConfig, {
  DEFAULT_MUG_PRINT_CONFIG
} from "../models/print/MugPrintConfig.model.js"

import MobileCaseConfig, {
  DEFAULT_MOBILE_CASE_PRINT_CONFIG
} from "../models/print/MobileCaseConfig.model.js"

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

  const mobileCaseExists = await MobileCaseConfig.exists({ isDefault: true })
  if (!mobileCaseExists) {
    await MobileCaseConfig.create(DEFAULT_MOBILE_CASE_PRINT_CONFIG)
    console.log("Default Mobile Case print config created")
  }
}

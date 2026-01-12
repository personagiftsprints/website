import TshirtPrintConfig from "../models/print/TshirtPrintConfig.model.js"

export const getTshirtConfig = async (req, res) => {
  const config = await TshirtPrintConfig.findById(req.params.id)
  res.json(config)
}

export const updateTshirtConfig = async (req, res) => {
  const updated = await TshirtPrintConfig.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  )
  res.json(updated)
}

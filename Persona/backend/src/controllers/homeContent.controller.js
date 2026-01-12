import HomeContent from "../models/HomeContent.js"

export const getHomeContent = async (req, res) => {
  const content = await HomeContent.findOne()
  res.json(content)
}

export const updateHomeBanner = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Banner image is required" })
  }

  const content =
    (await HomeContent.findOne()) ||
    (await HomeContent.create({}))

  content.homeBanner = {
    imageUrl: req.file.path,
    width: 8063,
    height: 2419
  }

  await content.save()

  res.json({
    message: "Home banner updated",
    homeBanner: content.homeBanner
  })
}

export const updateDiscountBanner = async (req, res) => {
  const { enabled, messages } = req.body

  const content =
    (await HomeContent.findOne()) ||
    (await HomeContent.create({}))

  content.discountBanner = {
    enabled,
    messages
  }

  await content.save()

  res.json({
    message: "Discount banner updated",
    discountBanner: content.discountBanner
  })
}

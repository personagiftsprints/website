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

export const addHomeBanner = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Banner image is required" })
  }

  const content = await HomeContent.findOne() || await HomeContent.create({})
  if (!content.homeBanners) content.homeBanners = []

  content.homeBanners.push({
    imageUrl: req.file.path,
    width: 8063,
    height: 2419
  })

  await content.save()

  res.json({
    message: "Home banner added",
    homeBanners: content.homeBanners
  })
}

export const deleteHomeBanner = async (req, res) => {
  const { id } = req.params;
  const content = await HomeContent.findOne()
  if (!content) return res.status(404).json({ message: "Content not found" })

  content.homeBanners = content.homeBanners.filter(b => b._id.toString() !== id)
  await content.save()

  res.json({
    message: "Home banner deleted",
    homeBanners: content.homeBanners
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

import express from "express"
import Event from "../models/Event.js"
import Collection from "../models/Collection.js"

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    const filter = req.query.activeOnly === "true" ? { isActive: true } : {}
    const events = await Event.find(filter).populate("collectionRef").sort({ createdAt: -1 })
    res.json({ success: true, data: events })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.get("/:slug", async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug })
      .populate({
        path: "collectionRef",
        populate: {
          path: "productIds",
          model: "Product",
          select: "name slug images thumbnail pricing rating reviewCount customization"
        }
      })
      
    if (!event) return res.status(404).json({ success: false, message: "Event not found" })
    
    res.json({ success: true, data: event })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.post("/", async (req, res) => {
  try {
    const { title, slug, description, collectionRef, image } = req.body
    
    // Only allow one event at a time: delete any existing events
    await Event.deleteMany({})
    
    const event = new Event({ title, slug, description, collectionRef, image, isActive: true })
    await event.save()
    res.json({ success: true, data: event })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.put("/:id", async (req, res) => {
  try {
    const { title, slug, description, collectionRef, image } = req.body
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { title, slug, description, collectionRef, image },
      { new: true }
    )
    if (!event) return res.status(404).json({ success: false, message: "Event not found" })
    res.json({ success: true, data: event })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.patch("/:id/status", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ success: false, message: "Event not found" })
    
    event.isActive = !event.isActive
    
    // If we're activating this event, deactivate all others
    if (event.isActive) {
      await Event.updateMany({ _id: { $ne: event._id } }, { isActive: false })
    }
    
    await event.save()
    res.json({ success: true, data: event })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id)
    if (!event) return res.status(404).json({ success: false, message: "Event not found" })
    res.json({ success: true, message: "Event deleted" })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router

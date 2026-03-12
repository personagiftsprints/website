import express from "express"
import {
  createCollection,
  getAllCollections,
  getActiveCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  toggleCollectionStatus
} from "../controllers/collection.controller.js"

const router = express.Router()

router.post("/", createCollection)
router.get("/", getAllCollections)
router.get("/active", getActiveCollections)
router.get("/:id", getCollectionById)
router.put("/:id", updateCollection)
router.patch("/:id/status", toggleCollectionStatus)
router.delete("/:id", deleteCollection)

export default router
import express from "express"
import {
  createCollection,
  getAllCollections,
  getCollectionById,
  updateCollection,
  deleteCollection
} from "../controllers/collection.controller.js"

const router = express.Router()

router.post("/", createCollection)
router.get("/", getAllCollections)
router.get("/:id", getCollectionById)
router.put("/:id", updateCollection)
router.delete("/:id", deleteCollection)

export default router
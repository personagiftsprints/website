import express from "express"
import cors from "cors"
// import paymentRoutes from "./src/routes/payment.routes.js"
import productRoutes from "./src/routes/product.routes.js"
import homeBannerRoutes from "./src/routes/homeContent.routes.js"
import couponRoutes from "./src/routes/coupon.routes.js"
import printModelsRoutes from "./src/routes/printModels.routes.js"
import { connectDB } from "./src/config/db.js"


const app = express()

app.use(
  cors({
    origin: ["http://127.0.0.1:5173", "http://localhost:5173", "https://persona-gifts.vercel.app","https://persona-topaz-eta.vercel.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
)

app.use(express.json())

connectDB()

// app.use("/api/payment", paymentRoutes)
app.use("/api/products", productRoutes)
app.use("/api/home-content", homeBannerRoutes)
app.use("/api/coupon", couponRoutes)
app.use("/api/print-model", printModelsRoutes)


app.get("/", (req, res) => {
  res.json({ success: true, message: "API running" })
})



const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

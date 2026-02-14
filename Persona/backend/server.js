import express from "express"
import cors from "cors"

import productRoutes from "./src/routes/product.routes.js"
import homeBannerRoutes from "./src/routes/homeContent.routes.js"
import couponRoutes from "./src/routes/coupon.routes.js"
import printModelsRoutes from "./src/routes/printModels.routes.js"
import uploadsRoutes from "./src/routes/upload.routes.js"
import authRoutes from "./src/routes/auth.routes.js"
import userRoutes from "./src/routes/user.routes.js"
import adminRoutes from "./src/routes/admin.routes.js"
import paymentRoutes from "./src/routes/payment.routes.js"
import orderRoutes from "./src/routes/order.routes.js"
import { connectDB } from "./src/config/db.js"

const app = express()

/* ---------------- STRIPE WEBHOOK (RAW BODY FIRST) ---------------- */
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" })
)

/* ---------------- CORS ---------------- */
app.use(
  cors({
    origin: [
          "http://localhost:4003",
      "http://localhost:5173",
      "http://localhost:3000",
      "https://persona-gift.vercel.app",
      "https://personagifts.co.uk"
    ],
    methods: ["GET", "POST", "PUT", "PATH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
)

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/* ---------------- DB ---------------- */
connectDB()

/* ---------------- ROUTES ---------------- */
app.use("/api/products", productRoutes)
app.use("/api/uploads", uploadsRoutes)
app.use("/api/home-content", homeBannerRoutes)
app.use("/api/coupon", couponRoutes)
app.use("/api/print-model", printModelsRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/user", userRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/payment", paymentRoutes)
app.use("/api/orders", orderRoutes)

/* ---------------- HEALTH ---------------- */
app.get("/", (req, res) => {
  res.json({ success: true, message: "API running" })
})

/* ---------------- START ---------------- */
const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

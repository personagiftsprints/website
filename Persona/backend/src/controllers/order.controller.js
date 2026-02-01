import Order from "../models/Order.js"


export const createOrder = async (req, res) => {
  try {
    const isLoggedIn = !!req.user
    const body = req.body

    let uploadedPrintImages = {}

    if (req.files?.printImages) {
      for (let i = 0; i < req.files.printImages.length; i++) {
        const file = req.files.printImages[i]
        const uploaded = await uploadToCloudinary(file.path)

        uploadedPrintImages[i] = {
          imageUrl: uploaded.secure_url,
          imagePublicId: uploaded.public_id
        }
      }
    }

    const items = JSON.parse(body.items).map((item, index) => ({
      productId: item.productId,
      quantity: item.quantity,
      priceAtOrder: item.price,
      printConfig: {
        enabled: item.printConfig?.enabled || false,
        imageUrl: uploadedPrintImages[index]?.imageUrl,
        imagePublicId: uploadedPrintImages[index]?.imagePublicId,
        comment: item.printConfig?.comment || ""
      }
    }))

    const order = await Order.create({
      userId: isLoggedIn ? req.user.id : null,
      guestInfo: isLoggedIn ? null : JSON.parse(body.guestInfo),
      items,
      shippingAddress: JSON.parse(body.shippingAddress),
      totalAmount: body.totalAmount
    })

    res.status(201).json({
      success: true,
      orderId: order._id
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create order"
    })
  }
}

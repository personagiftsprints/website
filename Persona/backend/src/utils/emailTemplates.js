export const passwordResetTemplate = ({ name, resetLink }) => ({
  subject: "Reset your password",
  text: `Hi ${name},

We received a request to reset your password.

Reset link:
${resetLink}

If you did not request this, please ignore this email.`,
  html: `
    <h2>Password Reset</h2>
    <p>Hi ${name},</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetLink}">Reset Password</a></p>
    <p>If you didn’t request this, ignore this email.</p>
  `
})



export const orderPlacedTemplate = ({ name, orderId, total }) => ({
  subject: "Your order has been placed",
  text: `Hi ${name},

Your order ${orderId} has been successfully placed.

Total: $${total}

Thank you for shopping with us.`,
  html: `
    <h2>Order Confirmed</h2>
    <p>Hi ${name},</p>
    <p>Your order <b>${orderId}</b> has been placed successfully.</p>
    <p><b>Total:</b> $${total}</p>
    <p>Thank you for shopping with us.</p>
  `
})



export const deliveryStatusTemplate = ({ name, orderId, status }) => ({
  subject: `Order ${orderId} - ${status}`,
  text: `Hi ${name},

Your order ${orderId} status is now: ${status}.`,
  html: `
    <h2>Order Update</h2>
    <p>Hi ${name},</p>
    <p>Your order <b>${orderId}</b> status:</p>
    <p><b>${status}</b></p>
  `
})

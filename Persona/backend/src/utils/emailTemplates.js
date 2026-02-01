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



export const orderPlacedTemplate = ({
  name,
  orderId,
  total,
  orderLink
}) => ({
  subject: `Order Confirmation • ${orderId}`,

  text: `Hello ${name},

Thank you for shopping with Persona Gifts & Prints.

Your order (${orderId}) has been successfully placed.

Total Paid: £${total}

View your order:
${orderLink}

If you have any questions, please contact our support team.

— Persona Gifts & Prints
`,

  html: `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
              background-color:#f9fafb;
              padding:24px;">
    <div style="max-width:600px;
                margin:0 auto;
                background:#ffffff;
                border-radius:8px;
                border:1px solid #e5e7eb;
                overflow:hidden;">

      <!-- HEADER / BRAND -->
      <div style="padding:20px 24px;
                  border-bottom:1px solid #e5e7eb;
                  display:flex;
                  align-items:center;
                  gap:12px;">
        <img
          src="https://i.ibb.co/rfKSd0yj/logo.png"
          alt="Persona Gifts & Prints"
          style="height:36px;width:auto;display:block;"
        />
        <div>
          <p style="margin:0;
                    font-size:14px;
                    font-weight:600;
                    color:#111827;">
            Persona Gifts & Prints
          </p>
          <p style="margin:2px 0 0;
                    font-size:12px;
                    color:#6b7280;">
            Order Confirmation
          </p>
        </div>
      </div>

      <!-- BODY -->
      <div style="padding:24px;
                  color:#374151;
                  font-size:14px;
                  line-height:1.6;">

        <p style="margin-top:0;">Hello ${name},</p>

        <p>
          Thank you for shopping with <strong>Persona Gifts & Prints</strong>.
          We’re pleased to confirm that your order has been successfully placed.
        </p>

        <div style="background:#f9fafb;
                    border:1px solid #e5e7eb;
                    border-radius:6px;
                    padding:16px;
                    margin:20px 0;">
          <p style="margin:0 0 8px 0;">
            <strong>Order ID:</strong> ${orderId}
          </p>
          <p style="margin:0;">
            <strong>Total Paid:</strong> £${total}
          </p>
        </div>

        <p>
          You can review your order details and track its progress using the button below.
        </p>

        <p style="text-align:center; margin:24px 0;">
          <a href="${orderLink}"
             style="display:inline-block;
                    padding:12px 22px;
                    background-color:#111827;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:500;">
            View Order Details
          </a>
        </p>

        <p>
          If you have any questions or need help, simply reply to this email and our
          support team will be happy to assist you.
        </p>

        <p style="margin-bottom:0;">
          Thank you for choosing us,<br />
          <strong>Persona Gifts & Prints</strong>
        </p>
      </div>

      <!-- FOOTER -->
      <div style="padding:16px 24px;
                  background:#f9fafb;
                  border-top:1px solid #e5e7eb;
                  font-size:12px;
                  color:#6b7280;
                  text-align:center;">
        © ${new Date().getFullYear()} Persona Gifts & Prints.<br />
        This is an automated email. Please do not share sensitive information.
      </div>

    </div>
  </div>
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

export const passwordResetTemplate = ({ name, resetLink }) => ({
  subject: "Reset Your Password • Persona Gifts & Prints",

  text: `Hello ${name},

We received a request to reset your Persona Gifts & Prints account password.

Reset your password using the link below:
${resetLink}

If you did not request this, you can safely ignore this email.

— Persona Gifts & Prints
`,

  html: `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
              background-color:#f9fafb;
              padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;
                border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">

      <!-- HEADER -->
      <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;
                  display:flex;align-items:center;gap:12px;">
        <img src="https://i.ibb.co/rfKSd0yj/logo.png"
             alt="Persona Gifts & Prints"
             style="height:36px;width:auto;" />
        <div>
          <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">
            Persona Gifts & Prints
          </p>
          <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">
            Password Reset
          </p>
        </div>
      </div>

      <!-- BODY -->
      <div style="padding:24px;color:#374151;font-size:14px;line-height:1.6;">
        <p>Hello ${name},</p>

        <p>
          We received a request to reset your account password.
          Click the button below to choose a new password.
        </p>

        <p style="text-align:center;margin:24px 0;">
          <a href="${resetLink}"
             style="display:inline-block;padding:12px 22px;
                    background:#111827;color:#ffffff;
                    text-decoration:none;border-radius:6px;
                    font-weight:500;">
            Reset Password
          </a>
        </p>

        <p>
          If you didn’t request a password reset, no action is required.
          Your account remains secure.
        </p>

        <p>
          Regards,<br />
          <strong>Persona Gifts & Prints</strong>
        </p>
      </div>

      <!-- FOOTER -->
      <div style="padding:16px 24px;background:#f9fafb;
                  border-top:1px solid #e5e7eb;
                  font-size:12px;color:#6b7280;text-align:center;">
        © ${new Date().getFullYear()} Persona Gifts & Prints.<br />
        This is an automated email. Do not share your reset link.
      </div>

    </div>
  </div>
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




export const deliveryStatusTemplate = ({ name, orderId, status, orderLink }) => ({
  subject: `Order Update • ${orderId}`,

  text: `Hello ${name},

Your order (${orderId}) status has been updated.

Current Status: ${status}

View your order:
${orderLink}

— Persona Gifts & Prints
`,

  html: `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
              background-color:#f9fafb;
              padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;
                border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">

      <!-- HEADER -->
      <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;
                  display:flex;align-items:center;gap:12px;">
        <img src="https://i.ibb.co/rfKSd0yj/logo.png"
             alt="Persona Gifts & Prints"
             style="height:36px;width:auto;" />
        <div>
          <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">
            Persona Gifts & Prints
          </p>
          <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">
            Order Status Update
          </p>
        </div>
      </div>

      <!-- BODY -->
      <div style="padding:24px;color:#374151;font-size:14px;line-height:1.6;">
        <p>Hello ${name},</p>

        <p>
          Your order status has been updated. Below are the latest details:
        </p>

        <div style="background:#f9fafb;border:1px solid #e5e7eb;
                    border-radius:6px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 8px 0;">
            <strong>Order ID:</strong> ${orderId}
          </p>
          <p style="margin:0;">
            <strong>Status:</strong> ${status}
          </p>
        </div>

        <p style="text-align:center;margin:24px 0;">
          <a href="${orderLink}"
             style="display:inline-block;padding:12px 22px;
                    background:#111827;color:#ffffff;
                    text-decoration:none;border-radius:6px;
                    font-weight:500;">
            View Order
          </a>
        </p>

        <p>
          Thank you for shopping with us.<br />
          <strong>Persona Gifts & Prints</strong>
        </p>
      </div>

      <!-- FOOTER -->
      <div style="padding:16px 24px;background:#f9fafb;
                  border-top:1px solid #e5e7eb;
                  font-size:12px;color:#6b7280;text-align:center;">
        © ${new Date().getFullYear()} Persona Gifts & Prints.
      </div>

    </div>
  </div>
  `
})

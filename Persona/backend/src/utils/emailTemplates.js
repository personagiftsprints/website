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
        <img src="https://res.cloudinary.com/dx9rxauty/image/upload/v1771900510/logo_bkof2v.png"
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
export const accountCreatedTemplate = ({ name }) => ({
  subject: "Welcome to Persona Gifts & Prints 🎉",

  text: `Hello ${name},

Your account has been successfully created on Persona Gifts & Prints.

Visit our website:
https://personagifts.co.uk

You can now log in and start shopping.

If you did not create this account, please contact us immediately at:
info@personagifts.co.uk

— Persona Gifts & Prints
https://personagifts.co.uk
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
        <img src="https://res.cloudinary.com/dx9rxauty/image/upload/v1771900510/logo_bkof2v.png"
             alt="Persona Gifts & Prints"
             style="height:36px;width:auto;" />
        <div>
          <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">
            Persona Gifts & Prints
          </p>
          <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">
            Account Created
          </p>
        </div>
      </div>

      <!-- BODY -->
      <div style="padding:24px;color:#374151;font-size:14px;line-height:1.6;">
        <p>Hello ${name},</p>

        <p>
          Your account has been successfully created.
          You can now start exploring our personalised gifts and prints.
        </p>

        <p style="margin:16px 0;">
          <a href="https://personagifts.co.uk"
             style="display:inline-block;
                    padding:12px 22px;
                    background:#111827;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:500;">
            Visit Our Website
          </a>
        </p>

        <p>
          If this wasn’t you, please contact our support team at
          <a href="mailto:info@personagifts.co.uk"
             style="color:#111827;font-weight:500;text-decoration:none;">
            info@personagifts.co.uk
          </a>.
        </p>

        <p>
          Welcome aboard,<br />
          <strong>Persona Gifts & Prints</strong>
        </p>
      </div>

      <!-- FOOTER -->
      <div style="padding:16px 24px;background:#f9fafb;
                  border-top:1px solid #e5e7eb;
                  font-size:12px;color:#6b7280;text-align:center;">
        © ${new Date().getFullYear()} Persona Gifts & Prints.<br/>
        <a href="https://personagifts.co.uk"
           style="color:#6b7280;text-decoration:none;">
           https://personagifts.co.uk
        </a><br/>
        This is an automated email.
      </div>

    </div>
  </div>
  `
})


export const orderPlacedTemplate = ({
  name,
  orderId,
  total,
  orderLink,
  couponCode
}) => ({
  subject: `Order Confirmation • ${orderId}`,

  text: `Hello ${name},

Thank you for shopping with Persona Gifts & Prints.

Your order (${orderId}) has been successfully placed.

Total Paid: £${total} ${couponCode ? `(Coupon: ${couponCode})` : ''}

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
          src="https://res.cloudinary.com/dx9rxauty/image/upload/v1771900510/logo_bkof2v.png"
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
            <strong>Total Paid:</strong> £${total} ${couponCode ? `<span style="font-size:11px;background:#fee2e2;color:#ef4444;padding:2px 6px;border-radius:4px;margin-left:4px;font-weight:600;">${couponCode}</span>` : ''}
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
        <img src="https://res.cloudinary.com/dx9rxauty/image/upload/v1771900510/logo_bkof2v.png"
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

export const orderInvoiceTemplate = ({
  name,
  orderId,
  orderNumber,
  items,
  subtotal,
  discount,
  deliveryCharge,
  total,
  status,
  orderLink,
  couponCode
}) => ({
  subject: `Invoice for Order • ${orderNumber}`,

  text: `Hello ${name},

Your order (${orderNumber}) currently has the status: ${status}.

Order Summary:
${items.map(item => `- ${item.name} (x${item.quantity}): £${item.price.toFixed(2)}`).join("\n")}

Subtotal: £${subtotal.toFixed(2)}
Discount: -£${discount.toFixed(2)} ${couponCode ? `(Code: ${couponCode})` : ''}
Delivery: £${deliveryCharge.toFixed(2)}
Total: £${total.toFixed(2)}

View your order:
${orderLink}

— Persona Gifts & Prints
`,

  html: `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
              background-color:#f4f4f5;
              padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;
                border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

      <!-- HEADER -->
      <div style="padding:24px;border-bottom:1px solid #f4f4f5;
                  background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%);
                  color: white;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <img src="https://res.cloudinary.com/dx9rxauty/image/upload/v1771900510/logo_bkof2v.png"
               alt="Persona"
               style="height:40px;width:auto;filter: brightness(0) invert(1);" />
          <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:-0.025em;">
            PERSONA
          </h1>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;">
          <div>
            <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;opacity:0.8;">
              Order Number
            </p>
            <p style="margin:2px 0 0;font-size:18px;font-weight:600;">
              \${orderNumber}
            </p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;opacity:0.8;">
              Status
            </p>
            <p style="margin:2px 0 0;font-size:14px;font-weight:600;background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:4px;">
              \${status.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <!-- BODY -->
      <div style="padding:32px;color:#27272a;">
        <p style="margin-top:0;font-size:16px;">Hello <strong>\${name}</strong>,</p>
        <p style="font-size:14px;color:#71717a;line-height:1.5;">
          Here is the current status and summary of your order. You can track your order or view more details by clicking the button below.
        </p>

        <div style="margin:32px 0;border:1px solid #f4f4f5;border-radius:8px;overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead style="background:#fafafa;">
              <tr>
                <th style="padding:12px;text-align:left;border-bottom:1px solid #f4f4f5;color:#71717a;font-weight:500;">Item</th>
                <th style="padding:12px;text-align:center;border-bottom:1px solid #f4f4f5;color:#71717a;font-weight:500;">Qty</th>
                <th style="padding:12px;text-align:right;border-bottom:1px solid #f4f4f5;color:#71717a;font-weight:500;">Price</th>
              </tr>
            </thead>
            <tbody>
              \${items.map(item => \`
              <tr>
                <td style="padding:12px;border-bottom:1px solid #f4f4f5;">
                  <div style="font-weight:500;">\${item.name}</div>
                  \${item.variant ? \`<div style="font-size:12px;color:#a1a1aa;">\${item.variant}</div>\` : ''}
                </td>
                <td style="padding:12px;text-align:center;border-bottom:1px solid #f4f4f5;color:#71717a;">
                  \${item.quantity}
                </td>
                <td style="padding:12px;text-align:right;border-bottom:1px solid #f4f4f5;font-weight:500;">
                  £\${item.price.toFixed(2)}
                </td>
              </tr>
              \`).join("")}
            </tbody>
            <tfoot style="background:#fafafa;">
              <tr>
                <td colspan="2" style="padding:12px;text-align:right;color:#71717a;">Subtotal</td>
                <td style="padding:12px;text-align:right;font-weight:500;">£\${subtotal.toFixed(2)}</td>
              </tr>
              \${discount > 0 ? \`
              <tr>
                <td colspan="2" style="padding:12px;text-align:right;color:#71717a;">
                  Discount \${couponCode ? \`<span style="font-size:11px;background:#fee2e2;color:#ef4444;padding:2px 6px;border-radius:4px;margin-left:4px;font-weight:600;">\${couponCode}</span>\` : ''}
                </td>
                <td style="padding:12px;text-align:right;color:#ef4444;font-weight:500;">-£\${discount.toFixed(2)}</td>
              </tr>
              \` : ''}
              <tr>
                <td colspan="2" style="padding:12px;text-align:right;color:#71717a;">Delivery</td>
                <td style="padding:12px;text-align:right;font-weight:500;">\${deliveryCharge > 0 ? \`£\${deliveryCharge.toFixed(2)}\` : 'FREE'}</td>
              </tr>
              <tr style="font-size:16px;font-weight:700;">
                <td colspan="2" style="padding:20px 12px;text-align:right;border-top:2px solid #e4e4e7;">Total</td>
                <td style="padding:20px 12px;text-align:right;border-top:2px solid #e4e4e7;color:#18181b;">£\${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="text-align:center;margin:32px 0;">
          <a href="\${orderLink}"
             style="display:inline-block;padding:14px 32px;
                    background:#18181b;color:#ffffff;
                    text-decoration:none;border-radius:8px;
                    font-weight:600;font-size:15px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            View Order & Track Status
          </a>
        </div>

        <p style="font-size:13px;color:#a1a1aa;text-align:center;margin-top:40px;">
          If you have any questions, please contact our support team at
          <a href="mailto:info@personagifts.co.uk" style="color:#18181b;text-decoration:underline;">info@personagifts.co.uk</a>
        </p>
      </div>

      <!-- FOOTER -->
      <div style="padding:24px;background:#f9fafb;
                  border-top:1px solid #f4f4f5;
                  font-size:12px;color:#71717a;text-align:center;">
        <p style="margin:0 0 8px 0;">© ${new Date().getFullYear()} Persona Gifts & Prints. All rights reserved.</p>
        <p style="margin:0;">This is an automated transactional email.</p>
      </div>

    </div>
  </div>
  `
})

export const paymentFailedTemplate = ({ name, orderNumber, orderLink }) => ({
  subject: `Payment Issue • Order ${orderNumber}`,

  text: `Hello ${name},

We encountered a problem with your payment for order ${orderNumber}.

Your order is currently pending payment. To complete your purchase, please visit your order details page:
${orderLink}

If you have any questions, please contact us.

— Persona Gifts & Prints
`,

  html: `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
              background-color:#fff1f2;
              padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;
                border-radius:12px;border:1px solid #fecdd3;overflow:hidden;">

      <!-- HEADER -->
      <div style="padding:24px;border-bottom:1px solid #f4f4f5;
                  background: #e11d48;
                  color: white;">
        <div style="display:flex;align-items:center;gap:12px;">
          <h1 style="margin:0;font-size:20px;font-weight:700;">PAYMENT UPDATE</h1>
        </div>
      </div>

      <!-- BODY -->
      <div style="padding:32px;color:#27272a;">
        <p style="margin-top:0;font-size:16px;">Hello <strong>${name}</strong>,</p>
        <p style="font-size:14px;color:#71717a;line-height:1.5;">
          There was an issue processing the payment for your order <strong>${orderNumber}</strong>. 
          As of now, your order is marked as <strong>Pending Payment</strong>.
        </p>

        <p style="font-size:14px;color:#71717a;line-height:1.5;">
          If the payment was intentionally cancelled, you can ignore this email. 
          If you wish to complete your purchase, you can find your order in your account or contact us for assistance.
        </p>

        <div style="text-align:center;margin:32px 0;">
          <a href="${orderLink}"
             style="display:inline-block;padding:14px 32px;
                    background:#18181b;color:#ffffff;
                    text-decoration:none;border-radius:8px;
                    font-weight:600;">
            View My Order
          </a>
        </div>

        <p style="font-size:13px;color:#a1a1aa;text-align:center;margin-top:40px;">
          Need help? Reply to this email or contact 
          <a href="mailto:info@personagifts.co.uk" style="color:#18181b;text-decoration:underline;">info@personagifts.co.uk</a>
        </p>
      </div>
    </div>
  </div>
  `
})

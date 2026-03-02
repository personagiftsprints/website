import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendMail = async ({ to, subject, html, text }) => {
  try {
    // console.log("USING HARDCODED FROM")

    const response = await resend.emails.send({
      from: "Persona <noreply@personagifts.co.uk>",
      to,
      subject,
      html,
      text
    })

    console.log("FULL RESPONSE:", response)

    if (response.error) {
      console.error("Email failed:", response.error)
      return
    }

    // console.log("📧 Email sent:", response.data?.id)
  } catch (err) {
    console.error("Email failed (catch):", err)
  }
}
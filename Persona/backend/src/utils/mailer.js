import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendMail = async ({ to, subject, html, text }) => {
  try {
    // console.log("USING HARDCODED FROM")

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Persona <noreply@personagifts.co.uk>",
      to,
      subject,
      html,
      text
    })

    // console.log("FULL RESPONSE:", response)

    if (response.error) {
      console.error("❌ Email failed (Resend Error):", JSON.stringify(response.error, null, 2));
      return { success: false, error: response.error };
    }

    console.log("📧 Email sent successfully to:", to);
    return { success: true, id: response.data?.id };
  } catch (err) {
    console.error("❌ Email failed (System Catch):", err);
    return { success: false, error: err.message };
  }
}
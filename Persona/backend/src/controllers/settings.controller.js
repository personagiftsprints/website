import Settings from "../models/Settings.js";
import { sendMail } from "../utils/mailer.js";

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPublicSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      return res.json({ 
        success: true, 
        data: { 
          shipping: { deliveryCharge: 5, threshold: 100 },
          siteInfo: { name: "Persona Gifts" }
        } 
      });
    }
    res.json({ 
      success: true, 
      data: { 
        shipping: settings.shipping,
        siteInfo: settings.siteInfo,
        maintenanceMode: settings.maintenanceMode
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const testEmailService = async (req, res) => {
  try {
    const { email } = req.body;
    const recipient = email || "personagiftsprints@gmail.com";
    
    // Get current date and time formatted nicely
    const currentDateTime = new Date().toLocaleString("en-GB", {
      timeZone: "Europe/London",
      dateStyle: "full",
      timeStyle: "medium",
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f3f4f6;">
          <h2 style="color: #111827; margin: 0;">Persona - Email Service Test</h2>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Verification Status Check</p>
        </div>
        <div style="padding: 10px 0; line-height: 1.6; color: #374151;">
          <p>Hello,</p>
          <p>This is a test email sent from the <strong>Persona Admin Panel</strong> to verify that your email service is working fine.</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #15803d;">✅ Mail service is working fine!</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #166534;">
              <strong>Date & Time of Test:</strong> ${currentDateTime}
            </p>
          </div>
          <p>Without affecting the whole system, this change has been deployed and verified.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
          <p style="margin: 0;">This is an automated test email. Please do not reply directly.</p>
        </div>
      </div>
    `;

    const emailText = `Persona - Email Service Test\n\nMail service is working fine!\nDate & Time of Test: ${currentDateTime}\n\nThis is an automated test email from the Persona Admin Panel.`;

    const result = await sendMail({
      to: recipient,
      subject: `Persona - Email Service Test [${new Date().toLocaleDateString("en-GB")}]`,
      html: emailHtml,
      text: emailText
    });

    if (!result.success) {
      return res.status(500).json({ success: false, message: "Failed to send test email.", error: result.error });
    }

    res.json({ success: true, message: `Test email sent successfully to ${recipient}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

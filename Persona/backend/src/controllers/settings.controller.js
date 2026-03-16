import Settings from "../models/Settings.js";

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

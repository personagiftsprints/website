import DesignLibrary from '../models/DesignLibrary.js';

export const createDesign = async (req, res) => {
  try {
    const design = await DesignLibrary.create(req.body);
    res.status(201).json({
      success: true,
      data: design
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getDesigns = async (req, res) => {
  try {
    const { productType, isActive } = req.query;
    const filter = {};
    if (productType) filter.productType = productType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const designs = await DesignLibrary.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: designs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateDesign = async (req, res) => {
  try {
    const design = await DesignLibrary.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }
    res.json({
      success: true,
      data: design
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteDesign = async (req, res) => {
  try {
    const design = await DesignLibrary.findByIdAndDelete(req.params.id);
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }
    res.json({
      success: true,
      message: 'Design deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getDesignsByProductType = async (req, res) => {
  try {
    const { type } = req.params;
    const designs = await DesignLibrary.find({ productType: type, isActive: true });
    res.json({
      success: true,
      data: designs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

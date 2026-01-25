import cloudinary from '../config/cloudinary.js'
import { upload } from '../middlewares/multer.js'

export const uploadImages = (req, res) => {
  upload.array('images', 10)(req, res, async err => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      })
    }

    if (!req.files || !req.files.length) {
      return res.status(400).json({
        success: false,
        message: 'No images received'
      })
    }

    try {
      const uploadedImages = []

      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: 'products' }, (error, res) => {
              if (error) reject(error)
              else resolve(res)
            })
            .end(file.buffer)
        })

        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
          name: file.originalname
        })
      }

      return res.json({
        success: true,
        data: uploadedImages
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Image upload failed',
        error: error.message
      })
    }
  })
}

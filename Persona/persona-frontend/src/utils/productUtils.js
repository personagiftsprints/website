// utils/productUtils.js

export const generateSKU = (productType = '') => {
  const typeCode = productType ? productType.substring(0, 3).toUpperCase() : 'PROD'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `${typeCode}-${timestamp}-${random}`
}

export const normalizeSlug = (slug) => {
  return slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export const validateNumberInput = (value, type = 'price') => {
  if (type === 'quantity') return value.replace(/[^0-9]/g, '')
  const numericValue = value.replace(/[^0-9.]/g, '')
  const parts = numericValue.split('.')
  return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue
}

// Removed: prepareProductViews (no longer needed)
// In productUtils.js (or wherever your buildProductPayload is)
export const buildProductPayload = (formData, customizationEnabled, selectedConfig) => {
  return {
    basicInfo: {
      name: formData.name,
      slug: formData.slug,
      type: formData.type,
      description: formData.description,
      material: formData.material,
      isActive: formData.isActive,
    },
    pricing: {
      basePrice: parseFloat(formData.price) || 0,
      specialPrice: formData.specialPrice ? parseFloat(formData.specialPrice) : null
    },
    inventory: {
      manageStock: formData.manageStock,
      stockQuantity: formData.manageStock ? parseInt(formData.stockQuantity) || 0 : 0,
      sku: `SKU-${Date.now()}` // Generate a simple SKU or get from form
    },
    customization: {
      enabled: customizationEnabled,
      // Add config data if needed
      ...(customizationEnabled && selectedConfig && {
        printConfig: {
          configId: selectedConfig._id || selectedConfig.id,
          type: selectedConfig.type
        }
      })
    }
    // NOTE: Images are NOT included here - they're appended separately
  }
}
export const validateProductForm = (formData, customizationEnabled, selectedConfig) => {
  const errors = []

  if (!formData.name?.trim()) errors.push('Product name is required')
  if (!formData.slug?.trim()) errors.push('Product slug is required')
  if (!formData.type) errors.push('Product type is required')

  if (formData.price && isNaN(parseFloat(formData.price))) {
    errors.push('Price must be a valid number')
  }

  if (customizationEnabled && !selectedConfig) {
    errors.push('Please select a print configuration when customization is enabled')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
import api from './axios'

export const createProductAPI = async payload => {
  try {
    const res = await api.post('/products', payload)
    return res
  } catch (err) {
    console.error(
      'Create product error:',
      err.response?.data || err.message || err
    )
    throw err
  }
}


export const getStockManagement = async ({
  sku,
  lowStock,
  page = 1,
  limit = 20
}) => {
  const params = new URLSearchParams()

  params.append("page", page)
  params.append("limit", limit)

  if (sku) params.append("sku", sku.toLowerCase())
  if (lowStock) params.append("lowStock", "true")

  const res = await api.get("/products/stock/manage", { params })

  return res
}


export const getProductBySku = async (sku) => {
  try {
    const res = await api.get(`/products/sku/${sku.toLowerCase()}`)
    return res
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Product not found"
    )
  }
}

// Get All Products
export const getAllProducts = async (params = {}) => {
  try {
    const response = await api.get('/products', { params });
    return response;
  } catch (error) {
    console.error('Fetch products error:', error.response?.data || error.message);
    return {
      success: false,
      data: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 1 },
      message: error.response?.data?.message || 'Failed to fetch products',
    };
  }
};

// Get Single Product by ID
export const getProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response;
  } catch (error) {
    console.error('Fetch product error:', error);
    throw error;
  }
};

export const getProductAttribute = async (type) => {
  try {
    const response = await api.get(`/products/product-attributes/${type}`);
    return response;
  } catch (error) {
    console.error('Fetch product error:', error);
    throw error;
  }
};


// Get by Slug
export const getProductBySlug = async (slug) => {
  try {
    const response = await api.get(`/products/slug/${slug}`);
    return response;
  } catch (error) {
    console.error('Fetch by slug error:', error);
    throw error;
  }
};

export const updateProductAPI = async (id, updates) => {
  const res = await api.put(`/products/${id}`, updates)
  return res
}


export const deleteProductAPI = async id => {
  try {
    const res = await api.delete(`/products/${id}`)
    return res
  } catch (err) {
    console.error('Delete product error:', err)
    throw err
  }
}


export const getSimilarProducts = async (slug) => {
  const res = await api.get(`/products/similar/${slug}`)
  return res
}


export const uploadImagesAPI = async files => {
  const fd = new FormData()
  files.forEach(file => fd.append('images', file))

  const res = await api.post('/uploads/images', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

  return res.data
}


export const TrendingProducts = async ()=>{
  const res = await api.get('/products/trending-products')

  return res.data
}



export const updateProductStatus = async (id, isActive) => {
  const res = await api.patch(`/products/${id}/status`, { isActive })
  return res
}

export const getProductsByType = async (type, params = {}) => {
  const res = await api.get(`/products/type/${type}`, {
    params: {
      page: params.page || 1,
      limit: params.limit || 20
    }
  })
  return res
}

export const getProductsByCategory = async (categorySlug, subcategorySlug = null, params = {}) => {
  const url = subcategorySlug 
    ? `/products/category/${categorySlug}/${subcategorySlug}` 
    : `/products/category/${categorySlug}`
    
  const res = await api.get(url, {
    params: {
      page: params.page || 1,
      limit: params.limit || 20
    }
  })
  return res
}


export const getProductCustomization = async (slug) => {
  try {
    const response = await api.get(`/products/customization/${slug}`);
    return response;
  } catch (error) {
    console.error('Error fetching product customization:', error);
    throw error;
  }
};

export const searchProducts = async (query, type = '') => {
  const params = new URLSearchParams()
  if (query) params.append('q', query)
  if (type) params.append('type', type)

  const res = await api.get(`/products/search?${params.toString()}`)
  return res
}

export const prepareCustomFieldCartItem = (product, formData, uploadedUrls) => {
  return {
    productId: product._id,
    productSlug: product.slug,
    name: product.name,
    productType: product.type,
    image: product.thumbnail || product.images?.[0]?.url,
    price: product.pricing?.specialPrice || product.pricing?.basePrice,
    currency: product.pricing?.currency || 'GBP',
    quantity: 1,
    designData: {
      type: 'custom_fields',
      fields: product.customFields || [],
      data: formData,
      uploaded_images: uploadedUrls,
      fieldCount: {
        images: (product.customFields || []).filter(f => f.type === 'image').length,
        texts: (product.customFields || []).filter(f => f.type === 'text').length
      }
    }
  };
};
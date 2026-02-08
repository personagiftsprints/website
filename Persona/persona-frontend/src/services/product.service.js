import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
})

export const createProductAPI = async payload => {
  try {
    console.log('Payload sent:', payload)

    console.log(
      'Creating product with images count:',
      payload.images?.length || 0
    )

    const res = await api.post('/products', payload)

    return res.data
  } catch (err) {
    console.error(
      'Create product error:',
      err.response?.data || err.message || err
    )
    throw err
  }
}



// Get All Products
export const getAllProducts = async (params = {}) => {
  try {
    const response = await api.get('/products', { params });
    return response.data;
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
    return response.data;
  } catch (error) {
    console.error('Fetch product error:', error);
    throw error;
  }
};

export const getProductAttribute = async (type) => {
  try {
    const response = await api.get(`/products/product-attributes/${type}`);
    return response.data;
  } catch (error) {
    console.error('Fetch product error:', error);
    throw error;
  }
};


// Get by Slug
export const getProductBySlug = async (slug) => {
  try {
    const response = await api.get(`/products/slug/${slug}`);
    return response.data;
  } catch (error) {
    console.error('Fetch by slug error:', error);
    throw error;
  }
};

export const updateProductAPI = async (id, updates) => {
  const res = await api.put(`/products/${id}`, updates)
  return res.data
}


export const uploadImagesAPI = async files => {
  const fd = new FormData()
  files.forEach(file => fd.append('images', file))

  const res = await api.post('/uploads/images', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

  return res.data.data
}


export const TrendingProducts = async ()=>{
  const res = await api.get('/products/trending-products')

  return res.data.data
}



export const updateProductStatus = async (id, isActive) => {
  const res = await api.patch(`/products/${id}/status`, { isActive })
  return res.data
}

export const getProductsByType = async (type, params = {}) => {
  const res = await api.get(`/products/type/${type}`, {
    params: {
      page: params.page || 1,
      limit: params.limit || 20
    }
  })
  return res.data
}

import API from "./axios";

export const getCategories = async (options = {}) => {
  const params = new URLSearchParams();
  if (options.activeOnly) params.append('activeOnly', 'true');
  
  const { data } = await API.get(`/categories?${params.toString()}`);
  return data;
};

export const createCategory = async (categoryData) => {
  const { data } = await API.post("/categories", categoryData);
  return data;
};

export const deleteCategory = async (id) => {
  const { data } = await API.delete(`/categories/${id}`);
  return data;
};

export const toggleCategoryStatus = async (id) => {
  const { data } = await API.patch(`/categories/${id}/status`);
  return data;
};

export const getSubcategories = async (options = {}) => {
  const params = new URLSearchParams();
  if (options.activeOnly) params.append('activeOnly', 'true');

  const { data } = await API.get(`/categories/subcategories?${params.toString()}`);
  return data;
};

export const getSubcategoriesByCategory = async (categoryId, options = {}) => {
  const params = new URLSearchParams();
  if (options.activeOnly) params.append('activeOnly', 'true');

  const { data } = await API.get(`/categories/${categoryId}/subcategories?${params.toString()}`);
  return data;
};

export const createSubcategory = async (subcategoryData) => {
  const { data } = await API.post("/categories/subcategories", subcategoryData);
  return data;
};

export const deleteSubcategory = async (id) => {
  const { data } = await API.delete(`/categories/subcategories/${id}`);
  return data;
};

export const toggleSubcategoryStatus = async (id) => {
  const { data } = await API.patch(`/categories/subcategories/${id}/status`);
  return data;
};

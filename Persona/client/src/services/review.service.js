import api from "./axios";

export const getProductReviews = async (productId) => {
  try {
    const res = await api.get(`/reviews/${productId}`);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const checkReviewEligibility = async (productId) => {
  try {
    const res = await api.get(`/reviews/eligibility/${productId}`);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const addReview = async (productId, data) => {
  try {
    const res = await api.post(`/reviews/${productId}`, data);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

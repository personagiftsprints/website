export const generateCoupon = () =>
  "PG-" + Math.random().toString(36).substring(2, 10).toUpperCase()

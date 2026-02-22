const generateSku = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let sku = ''
  for (let i = 0; i < 6; i++) {
    sku += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return sku
}
const nextConfig = {
  reactStrictMode: true,

  allowedDevOrigins: [
    "http://10.34.156.138:4000",
    "http://192.168.1.25:3000"
  ],

  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "thebridgestore.in" },
      { protocol: "https", hostname: "static-assets-prod.fnp.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "img.freepik.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
       { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
       { protocol: "https", hostname: "i.ebayimg.com" },
       { protocol: "https", hostname: "cdn.example.com" },
        { protocol: "https", hostname: "res.cloudinary.com" },
          { protocol: "https", hostname: "images.unsplash.com" }
       
      

      
    ],
  },
}

module.exports = nextConfig

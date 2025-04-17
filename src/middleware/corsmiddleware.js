// Simple CORS middleware
export const corsMiddleware = (req, res, next) => {
    // Allow requests from your frontend origin
    res.header("Access-Control-Allow-Origin", "http://localhost:5173")
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
  
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.status(200).end()
    }
  
    next()
  }
  
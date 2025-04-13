import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { connectDB, models } from '../src/database/index.js';
import userRoutes from '../src/api/userRoute.js';
import membershipRoutes from '../src/api/membershipRoute.js';
import bookRoutes from '../src/api/admin/bookRoute.js';
import booksPublicRouter from '../src/api/bookRoute.js'; 
import membershipPlanRoutes from './api/membershipPlanRoute.js';
import rentalRoutes from './api/rentalRoutes.js'; 
import messageRoutes from './api/messageRoute.js';  

const app = express();
const PORT = process.env.PORT || 5000;

// Debug middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} from origin: ${req.headers.origin}`);
  next();
});

// Improved CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Token validation endpoint
app.get('/api/users/validate-token', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    
    // Return user data (excluding sensitive info)
    return res.status(200).json({ 
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'user'
      }
    });
  } catch (error) {
    console.error('Token validation error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// Admin Routes
const adminRoutes = express.Router();

adminRoutes.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Admin Login Body:', req.body);

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign(
      { userId: 'admin', email, role: 'admin' },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    console.log('Admin login successful, token generated');
    return res.status(200).json({
      user: { id: 'admin', email, role: 'admin' },
      token,
      message: 'Admin login successful'
    });
  }

  console.log('Admin login failed - invalid credentials');
  return res.status(401).json({ message: 'Invalid admin credentials' });
});

// Google OAuth Routes
const authRoutes = express.Router();

authRoutes.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  console.log('OAuth Callback GET Code:', code);

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/auth-callback?error=missing_code`);
  }

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const { access_token } = tokenResponse.data;
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userData = userInfoResponse.data;

    let user = await models.User.findOne({ email: userData.email });
    if (!user) {
      user = new models.User({
        email: userData.email,
        name: userData.name,
        googleId: userData.sub,
        picture: userData.picture
      });
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    return res.redirect(`${process.env.FRONTEND_URL}/auth-callback?token=${token}&userId=${user._id}`);
  } catch (error) {
    console.error('Google OAuth Error:', error.response?.data || error.message);
    return res.redirect(`${process.env.FRONTEND_URL}/auth-callback?error=authentication_failed`);
  }
});

authRoutes.post('/google/callback', async (req, res) => {
  const { code } = req.body;
  console.log('OAuth Callback POST Code:', code);

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const { access_token } = tokenResponse.data;
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userData = userInfoResponse.data;

    let user = await models.User.findOne({ email: userData.email });
    if (!user) {
      user = new models.User({
        email: userData.email,
        name: userData.name,
        googleId: userData.sub,
        picture: userData.picture
      });
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      userId: user._id,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Google OAuth Error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});
 
app.use('/api', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/membership', membershipPlanRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rentals', rentalRoutes); // Register the rental routes

// Register the book routes (both admin and public)
app.use('/api/admin/books', bookRoutes);
app.use('/api/books', booksPublicRouter); // Add the public books API route

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'An unexpected error occurred', 
    error: process.env.NODE_ENV === 'production' ? null : err.message 
  });
});

// Handle 404 - Route not found
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start Server
const startServer = async () => {
  try {
    console.log("Connecting to DB...");
    await connectDB();
    console.log("DB connected successfully.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Server ready at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error.message);
    process.exit(1);
  }
};

startServer();
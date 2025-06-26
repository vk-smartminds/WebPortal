import User from '../models/User.js';
import Admin from '../models/Admin.js';
import multer from 'multer';
import path from 'path';

// Setup multer storage (reuse from userController if needed)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'backend', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
  }
});
export const upload = multer({ storage });

// GET /api/profile - Get user profile (JWT authenticated)
export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: 'User not found' });
    let userObj = user.toObject();
    if (userObj.photo && userObj.photo.data) {
      userObj.photo = `data:${userObj.photo.contentType};base64,${userObj.photo.data.toString('base64')}`;
    } else {
      userObj.photo = null;
    }
    res.json({ user: userObj });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

// PUT /api/profile - Update user profile (JWT authenticated)
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, school, class: userClass, deletePhoto } = req.body;
    const userId = req.user._id;
    // Determine if req.user is a User or Admin
    const isAdmin = req.user.isSuperAdmin !== undefined || req.user.isAdmin;
    const update = isAdmin
      ? { name, phone } // Only update name and phone for admin
      : { name, phone, school, class: userClass };
    if (deletePhoto === true || deletePhoto === 'true') {
      update.photo = { data: undefined, contentType: undefined };
    } else if (req.file) {
      update.photo = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }
    let user;
    if (isAdmin) {
      user = await Admin.findByIdAndUpdate(
        userId,
        { $set: update },
        { new: true }
      );
    } else {
      user = await User.findByIdAndUpdate(
        userId,
        { $set: update },
        { new: true }
      );
    }
    if (!user) return res.status(404).json({ message: 'User not found' });
    let userObj = user.toObject();
    if (userObj.photo && userObj.photo.data) {
      userObj.photo = `data:${userObj.photo.contentType};base64,${userObj.photo.data.toString('base64')}`;
    } else {
      userObj.photo = null;
    }
    res.json({ message: 'Profile updated', user: userObj });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};

// GET /api/verify-token - Verify JWT token and return user profile
export const verifyToken = async (req, res) => {
  try {
    // User is already attached to req by authenticateToken middleware
    const user = req.user;
    
    // Convert photo buffer to base64 string for frontend
    let userObj = user.toObject();
    if (userObj.photo && userObj.photo.data) {
      userObj.photo = `data:${userObj.photo.contentType};base64,${userObj.photo.data.toString('base64')}`;
    } else {
      userObj.photo = null;
    }
    
    res.json({ 
      message: 'Token verified',
      user: userObj
    });
  } catch (err) {
    res.status(500).json({ message: 'Token verification failed', error: err.message });
  }
};

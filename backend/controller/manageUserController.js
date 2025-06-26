import User from '../models/User.js';
import Admin from '../models/Admin.js';

// Find a user by email (superadmin only)
export const findUserByEmail = async (req, res) => {
  try {
    const { email, requesterEmail } = req.body;
    // Check if requester is superadmin
    const requester = await Admin.findOne({ email: requesterEmail });
    if (!requester || !requester.isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden: Only superadmin can perform this action.' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('-password -__v');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Error finding user', error: err.message });
  }
};

// Delete a user by email (superadmin only)
export const deleteUserByEmail = async (req, res) => {
  try {
    const { email, requesterEmail } = req.body;
    // Check if requester is superadmin
    const requester = await Admin.findOne({ email: requesterEmail });
    if (!requester || !requester.isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden: Only superadmin can perform this action.' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    // TODO: Delete related data if any (parent/child links, etc.)
    await User.deleteOne({ email: email.trim().toLowerCase() });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
}; 
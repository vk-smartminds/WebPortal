import User from '../models/User.js';

// GET /api/parent/child-profile - Get child (student) profile for logged-in parent
export const getChildProfile = async (req, res) => {
  try {
    const parent = req.user;
    if (!parent || !parent.childEmail) {
      return res.status(404).json({ message: "No child linked to this parent." });
    }
    const child = await User.findOne({ email: parent.childEmail.trim().toLowerCase() });
    if (!child) {
      return res.status(404).json({ message: "Child (student) not found." });
    }
    let childObj = child.toObject();
    if (childObj.photo && childObj.photo.data) {
      childObj.photo = `data:${childObj.photo.contentType};base64,${childObj.photo.data.toString('base64')}`;
    } else {
      childObj.photo = null;
    }
    res.json({ user: childObj });
  } catch (err) {
    res.status(500).json({ message: "Error fetching child profile", error: err.message });
  }
};

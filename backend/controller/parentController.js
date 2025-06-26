import User from '../models/User.js';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import Admin from '../models/Admin.js'; // <-- Add this

// OTP store for child verification
const childOtpStore = {};

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/"/g, '') : '';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/parent/verify-child-email
export const verifyChildEmail = async (req, res) => {
  try {
    const { childEmail } = req.body;
    if (!childEmail) return res.status(400).json({ message: "Child email is required" });
    const cleanEmail = childEmail.trim().toLowerCase();
    // Only allow if registeredAs === 'Student'
    const child = await User.findOne({ email: cleanEmail, registeredAs: 'Student' });
    if (!child) {
      return res.status(404).json({ message: "No student is registered with this email." });
    }
    const otp = generateOtp();
    childOtpStore[cleanEmail] = { otp, expires: Date.now() + 3 * 60 * 1000 }; // 3 min

    await transporter.sendMail({
      from: emailUser,
      to: cleanEmail,
      subject: 'VK Publications Child Verification OTP',
      text: `Your OTP for child verification is: ${otp}`
    });

    res.json({ message: "Child found. OTP sent to child email for verification." });
  } catch (err) {
    res.status(500).json({ message: "Failed to verify child email", error: err.message });
  }
};

// POST /api/parent/verify-child-otp
export const verifyChildOtp = async (req, res) => {
  try {
    const { childEmail, otp } = req.body;
    if (!childEmail || !otp) return res.status(400).json({ message: "Child email and OTP are required" });
    const cleanEmail = childEmail.trim().toLowerCase();
    const record = childOtpStore[cleanEmail];
    if (!record || record.otp !== otp || record.expires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    // Optionally, delete OTP after successful verification
    delete childOtpStore[cleanEmail];
    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ message: "Failed to verify OTP", error: err.message });
  }
};

// Optionally, export childOtpStore for use in parent registration if needed
export { childOtpStore };


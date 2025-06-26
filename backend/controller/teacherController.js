import User from '../models/User.js';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import Admin from '../models/Admin.js'; // <-- Add this

const otpStore = {};

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

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    // Check if email is an admin
    const isAdmin = await Admin.findOne({ email: cleanEmail });
    if (isAdmin) {
      return res.status(409).json({ message: 'You cannot use this email. It is an admin ID. Please use a different email.' });
    }

    // Block if already registered as Teacher or Student, allow Parent
    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      if (exists.registeredAs === 'Teacher') {
        return res.status(409).json({ message: 'Teacher email already registered.' });
      } else if (exists.registeredAs === 'Student') {
        return res.status(409).json({ message: 'Email already registered as Student.' });
      }
      // Allow if registeredAs === 'Parent'
    }

    const otp = generateOtp();
    otpStore[cleanEmail] = { otp, expires: Date.now() + 3 * 60 * 1000 };
    await transporter.sendMail({
      from: emailUser,
      to: cleanEmail,
      subject: 'VK Publications Teacher Registration OTP',
      text: `Your OTP for teacher registration is: ${otp}`
    });
    res.json({ message: 'OTP sent to email.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, otp, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    // Check if email is an admin
    const isAdmin = await Admin.findOne({ email: cleanEmail });
    if (isAdmin) {
      return res.status(409).json({ message: 'You cannot use this email. It is an admin ID. Please use a different email.' });
    }

    // OTP check
    const record = otpStore[cleanEmail];
    if (!record || record.otp !== otp || record.expires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    // Block if already registered as Teacher or Student, allow Parent
    const exists = await User.findOne({ email: cleanEmail });
    if (exists && (exists.registeredAs === 'Teacher' || exists.registeredAs === 'Student')) {
      return res.status(409).json({ message: exists.registeredAs === 'Teacher'
        ? 'Teacher email already registered.'
        : 'Email already registered as Student.' });
    }
    // Allow Parent or new

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      registeredAs: 'Teacher',
      email: cleanEmail,
      password: hashedPassword,
      school: "",
      class: "", // Provide empty string for class to satisfy schema
      phone: ""
    });
    await user.save();
    delete otpStore[cleanEmail];
    res.status(201).json({ message: 'Teacher registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Teacher registration failed', error: err.message });
  }
};

export const find = async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail, registeredAs: 'Teacher' });
    if (!user) return res.status(404).json({ message: 'Teacher not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Error finding teacher', error: err.message });
  }
};

export default { sendOtp, register, find };

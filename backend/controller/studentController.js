import User from '../models/User.js';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import Admin from '../models/Admin.js'; // <-- Add this

const otpStore = {}; // { email: { otp, expires } }

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

    // Block if already registered as Student or Teacher, allow Parent
    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      if (exists.registeredAs === 'Student') {
        return res.status(409).json({ message: 'Email already registered as Student.' });
      } else if (exists.registeredAs === 'Teacher') {
        return res.status(409).json({ message: 'Email already registered as Teacher.' });
      }
      // Allow if registeredAs === 'Parent'
    }

    const otp = generateOtp();
    otpStore[cleanEmail] = { otp, expires: Date.now() + 3 * 60 * 1000 }; // 3 min
    await transporter.sendMail({
      from: emailUser,
      to: cleanEmail,
      subject: 'VK Publications Student Registration OTP',
      text: `Your OTP for student registration is: ${otp}`
    });
    res.json({ message: 'OTP sent to email.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, school, class: userClass, otp, password } = req.body;
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
    // Block if already registered as Student or Teacher, allow Parent
    const exists = await User.findOne({ email: cleanEmail });
    if (exists && (exists.registeredAs === 'Student' || exists.registeredAs === 'Teacher')) {
      return res.status(409).json({ message: exists.registeredAs === 'Student'
        ? 'Email already registered as Student.'
        : 'Email already registered as Teacher.' });
    }
    // Allow Parent or new

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      registeredAs: 'Student',
      email: cleanEmail,
      password: hashedPassword,
      school,
      class: userClass,
      phone: ""
    });
    await user.save();
    delete otpStore[cleanEmail];
    res.status(201).json({ message: 'Student registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Student registration failed', error: err.message });
  }
};

export const find = async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail, registeredAs: 'Student' });
    if (!user) return res.status(404).json({ message: 'Student not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Error finding student', error: err.message });
  }
};

export default { sendOtp, register, find };

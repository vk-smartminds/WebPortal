import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  registeredAs: {
    type: String,
    enum: ['Student', 'Teacher', 'Parent'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  school: {
    type: String
  },
  class: {
    type: String
  },
  phone: {
    type: String,
    match: [/^\d{10}$/, 'Phone number must be 10 digits'],
    default: ""
  },
  childEmail: {
    type: String,
    // Only required for Parent, so not globally required
    default: ""
  },
  photo: {
    data: Buffer,
    contentType: String
  }
});

const User = mongoose.model('User', userSchema);

export default User;

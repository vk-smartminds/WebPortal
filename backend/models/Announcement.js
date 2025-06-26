import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: 2000 * 6 // 2000 words (approx 6 chars per word)
  },
  images: [{
    data: Buffer,
    contentType: String
  }],
  createdBy: {
    type: String, // email or admin id
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement; 
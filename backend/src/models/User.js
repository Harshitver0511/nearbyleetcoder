const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  leetcodeUsername: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  problemsSolved: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 1500
  }
});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
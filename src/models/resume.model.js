const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide resume title"],
    trim: true,
    maxlength: 100
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  university: {
    type: String,
    required: [true, "Please provide university"]
  },
  engineeringField: {
    type: String,
    required: [true, "Please provide engineering field"]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Resume", ResumeSchema);

const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    originalname: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

mediaSchema.index({ userId: 1, publicId: 1 }); // for text search on publicId

const Media = mongoose.model("Media", mediaSchema);

module.exports = Media;

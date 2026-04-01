const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    urlToImage: {
      type: String,
      default: "",
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    sourceName: {
      type: String,
      default: "Unknown Source",
    },
    author: {
      type: String,
      default: "Unknown Source",
    },
    feedType: {
      type: String,
      enum: ["general", "student", "local", "search"],
      required: true,
    },
    queryKey: {
      type: String,
      default: "",
      index: true,
    },
    locationKey: {
      type: String,
      default: "",
      index: true,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

articleSchema.index({ url: 1, feedType: 1, queryKey: 1, locationKey: 1 }, { unique: true });

module.exports = mongoose.model("Article", articleSchema);
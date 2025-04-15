const mongoose = require("mongoose");

/**
 * Mongoose schema for the Product model
 * @typedef {Object} ProductSchema
 * @property {string} name - Name of the product (required)
 * @property {string} description - Detailed description of the product (required)
 * @property {string} richDescription - Enhanced HTML description of the product (default: empty string)
 * @property {string} image - Main image URL for the product (default: empty string)
 * @property {string[]} images - Array of additional image URLs for the product
 * @property {string} brand - Brand name of the product (default: empty string)
 * @property {number} price - Product price (default: 0)
 * @property {mongoose.Schema.Types.ObjectId} category - Reference to the Category model (required)
 * @property {number} countInStock - Available quantity in stock (required, between 0 and 255)
 * @property {number} rating - Product rating (default: 0)
 * @property {boolean} isFeatured - Whether the product should be featured on the front page (default: false)
 * @property {Date} dateCreated - Date when the product was created (default: current date)
 */
const productSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  richDescription: { type: String, default: "" },
  image: { type: String, default: "" },
  images: [{ type: String }],
  brand: { type: String, default: "" },
  price: { type: Number, default: 0 },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  countInStock: { type: Number, required: true, min: 0, max: 255 },
  rating: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  dateCreated: { type: Date, default: Date.now },
});

productSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
productSchema.set("toJSON", {
  virtuals: true,
});

// Prevent duplicate model compilation
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

exports.Product = Product;

const mongoose = require("mongoose");

/**
 * Mongoose schema definition for a Category.
 * @typedef {Object} CategorySchema
 * @property {String} name - The name of the category (required)
 * @property {String} [icon] - The icon representing the category (optional)
 * @property {String} [color] - The color associated with the category (optional)
 * @property {String} [image] - URL or path to the category image (optional)
 */
const categorySchema = mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String },
  color: { type: String },
  image: String,
});
categorySchema.virtual("id").get(function () {
  return this._id.toHexString();
});
categorySchema.set("toJSON", {
  virtuals: true,
});

// Prevent duplicate model compilation
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

exports.Category = Category;

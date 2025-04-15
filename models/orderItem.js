const mongoose = require("mongoose");

/**
 * Mongoose schema for order item
 * @typedef {Object} OrderItem
 * @property {number} quantity - The quantity of product in the order (required)
 * @property {mongoose.Schema.Types.ObjectId} product - Reference to the Product model (required)
 */
const orderItemSchema = mongoose.Schema({
  quantity: { type: Number, required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
});

orderItemSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

orderItemSchema.set("toJSON", {
  virtuals: true,
});

// Prevent duplicate model compilation
const OrderItem = mongoose.models.OrderItem || mongoose.model("OrderItem", orderItemSchema);

exports.OrderItem = OrderItem;

const mongoose = require("mongoose");

/**
 * Mongoose schema for representing an order in the e-commerce system.
 * @typedef {Object} Order
 * @property {Array<mongoose.Schema.Types.ObjectId>} orderItems - Array of references to OrderItem documents
 * @property {string} shippingAddress1 - Primary shipping address
 * @property {string} [shippingAddress2=""] - Secondary shipping address (optional)
 * @property {string} city - City for shipping
 * @property {string} zip - Postal/ZIP code
 * @property {string} country - Country for shipping
 * @property {string} phone - Contact phone number
 * @property {string} status - Current order status
 * @property {number} totalPrice - Total price of the order
 * @property {mongoose.Schema.Types.ObjectId} user - Reference to the User who placed the order
 * @property {Date} dateOrdered - Timestamp when the order was created
 */
const orderSchema = mongoose.Schema({
  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderItem",
      required: true,
    },
  ],
  shippingAddress1: { type: String, required: true },
  shippingAddress2: { type: String, default: "" },
  city: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true },
  status: {
    type: String,
    default: "Pending",
    enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
  },
  totalPrice: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  dateOrdered: { type: Date, default: Date.now },
});

orderSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
orderSchema.set("toJSON", {
  virtuals: true,
});

// Prevent duplicate model compilation
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

exports.Order = Order;

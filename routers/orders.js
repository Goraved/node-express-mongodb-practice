const { populate } = require("dotenv");
const { Order } = require("../models/order");
const { OrderItem } = require("../models/orderItem");

const express = require("express");
const router = express.Router();

router.get(`/`, async (req, res) => {
  const orderList = await Order.find()
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    })
    .sort({ dateOrdered: -1 });
  if (!orderList) {
    return res.status(500).json({ success: false });
  }
  res.send(orderList);
});

router.get(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    });

  if (!order) {
    res.status(404).json({ success: false, message: "Order not found" });
  }
  res.send(order);
});

router.get(`/get/count`, async (req, res) => {
  const orderCount = await Order.countDocuments();

  if (!orderCount) {
    res.status(500).json({ success: false, message: "Orders not found" });
  }
  res.send({ count: orderCount });
});

router.get(`/get/totalsales`, async (req, res) => {
  const totalSales = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$totalPrice" },
      },
    },
  ]);

  if (!totalSales) {
    res
      .status(500)
      .json({ success: false, message: "The total sales cannot be generated" });
  }
  res.send({ totalSales: totalSales });
});

router.get(`/get/status/:status`, async (req, res) => {
  const statusOrders = await Order.find({ status: req.params.status });

  if (!statusOrders) {
    res.status(500).json({
      success: false,
      message: `Orders with status ${req.params.status} not found`,
    });
  }
  res.send(statusOrders);
});

router.get(`/get/userorders/:userId`, async (req, res) => {
  const userOrders = await Order.find({ user: req.params.userId })
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    })
    .sort({ dateOrdered: -1 });

  if (!userOrders) {
    res.status(500).json({
      success: false,
      message: `Orders of user ${req.params.userId} not found`,
    });
  }
  res.send(userOrders);
});

router.post(`/`, async (req, res) => {
  // Use Promise.all to resolve all the promises from the map
  const orderItemsPromises = req.body.orderItems.map(async (orderItem) => {
    let newOrderItem = new OrderItem({
      quantity: orderItem.quantity,
      product: orderItem.product,
    });
    newOrderItem = await newOrderItem.save();
    return newOrderItem._id;
  });

  // Wait for all promises to resolve
  const orderItemIds = await Promise.all(orderItemsPromises);
  const totalPrice = await Promise.all(
    orderItemIds.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        "product",
        "price"
      );
      return orderItem.product.price * orderItem.quantity;
    })
  );
  const totalPriceSum = totalPrice.reduce((acc, price) => acc + price, 0);

  let order = new Order({
    orderItems: orderItemIds,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalPriceSum,
    user: req.body.user,
    dateOrdered: req.body.dateOrdered,
  });
  order
    .save()
    .then((createdOrder) => {
      res.status(201).json(createdOrder);
    })
    .catch((err) => {
      res.status(500).json({ error: err.message, success: false });
    });
});

router.put(`/:id`, async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true }
  );

  if (!order) {
    return res.status(400).json({ success: false, message: "Order not found" });
  }
  res.send(order);
});

router.delete("/:id", (req, res) => {
  Order.findByIdAndDelete(req.params.id)
    .then(async (order) => {
      if (order) {
        await order.orderItems.map(async (orderItem) => {
          await OrderItem.findByIdAndDelete(orderItem);
        });
        return res
          .status(200)
          .json({ success: true, message: "Order deleted successfully" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err.message });
    });
});

module.exports = router;

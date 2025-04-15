const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * @route   GET api/v1/users
 * @desc    Get all users (excluding password data)
 * @access  Private/Admin
 * @returns {Array} List of users
 */
router.get(`/`, async (req, res) => {
  const userList = await User.find().select("-passwordHash");
  if (!userList) {
    return res.status(500).json({ success: false });
  }
  res.send(userList);
});

/**
 * @route   GET api/v1/users/:id
 * @desc    Get a single user by ID
 * @access  Private/Admin
 * @param   {string} id - User ID
 * @returns {Object} User data (excluding password)
 */
router.get(`/:id`, async (req, res) => {
  User.findById(req.params.id)
    .select("-passwordHash")
    .then((user) => {
      if (user) {
        return res.status(200).json({ user });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err.message });
    });
});

/**
 * @route   GET api/v1/users/get/count
 * @desc    Get total count of users
 * @access  Private/Admin
 * @returns {Object} Count of users
 */
router.get(`/get/count`, async (req, res) => {
  const userCount = await User.countDocuments();

  if (!userCount) {
    res.status(500).json({ success: false, message: "Users not found" });
  }
  res.send({ count: userCount });
});

/**
 * @route   POST api/v1/users
 * @desc    Register a new user
 * @access  Public
 * @body    {string} name - User's name
 * @body    {string} email - User's email
 * @body    {string} password - User's password (will be hashed)
 * @body    {string} phone - User's phone number
 * @body    {string} street - Street address
 * @body    {string} apartment - Apartment/Unit number
 * @body    {string} zip - ZIP/Postal code
 * @body    {string} city - City
 * @body    {string} country - Country
 * @returns {Object} Created user
 */
router.post(`/`, async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });
  user = await user.save();
  if (!user) {
    return res.status(400).send("User cannot be created");
  }
  res.send(user);
});

/**
 * @route   POST api/v1/users/login
 * @desc    Authenticate user & get token
 * @access  Public
 * @body    {string} email - User's email
 * @body    {string} password - User's password
 * @returns {Object} User email and token
 */
router.post("/login", async (req, res) => {
  // Find user by email
  const user = await User.findOne({
    email: req.body.email,
  });

  if (!user) {
    return res.status(400).send("User not found");
  }
  
  // Check password
  if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.status(200).send({
      user: user.email,
      token: token,
    });
  } else {
    res.status(400).send("Password is incorrect");
  }
});

/**
 * @route   PUT api/v1/users/:id
 * @desc    Update a user
 * @access  Private
 * @param   {string} id - User ID
 * @body    {string} name - User's name
 * @body    {string} email - User's email
 * @body    {string} password - User's new password
 * @body    {string} phone - User's phone number
 * @body    {string} street - Street address
 * @body    {string} apartment - Apartment/Unit number
 * @body    {string} zip - ZIP/Postal code
 * @body    {string} city - City
 * @body    {string} country - Country
 * @body    {boolean} isAdmin - Admin status
 * @returns {Object} Updated user
 */
router.put(`/:id`, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
        isAdmin: req.body.isAdmin,
    },
    { new: true }
  );

  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "User not found" });
  }
  res.send(user);
});

/**
 * @route   DELETE api/v1/users/:id
 * @desc    Delete a user
 * @access  Private/Admin
 * @param   {string} id - User ID
 * @returns {Object} Success message
 */
router.delete("/:id", (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: "User deleted successfully" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err.message });
    });
});

module.exports = router;
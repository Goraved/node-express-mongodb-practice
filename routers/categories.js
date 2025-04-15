const { Category } = require("../models/category");
const express = require("express");
const router = express.Router();

/**
 * @route   GET api/v1/categories
 * @desc    Get all categories
 * @access  Public
 * @returns {Array} List of all categories
 */
router.get(`/`, async (req, res) => {
  const categoryList = await Category.find();
  if (!categoryList) {
    return res.status(500).json({ success: false });
  }
  res.status(200).send(categoryList);
});

/**
 * @route   GET api/v1/categories/:id
 * @desc    Get a single category by ID
 * @access  Public
 * @param   {string} id - Category ID
 * @returns {Object} Category data
 */
router.get(`/:id`, async (req, res) => {
  Category.findById(req.params.id)
    .then((category) => {
      if (category) {
        return res.status(200).json({ category });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err.message });
    });
});

/**
 * @route   POST api/v1/categories
 * @desc    Create a new category
 * @access  Private/Admin
 * @body    {string} name - Category name
 * @body    {string} icon - Category icon
 * @body    {string} color - Category color
 * @body    {string} image - Category image URL
 * @returns {Object} Created category
 */
router.post(`/`, async (req, res) => {
  let category = new Category({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color,
    image: req.body.image,
  });
  category = await category.save();

  if (!category) {
    return res.status(400).json({ success: false });
  }
  res.send(category);
});

/**
 * @route   PUT api/v1/categories/:id
 * @desc    Update a category
 * @access  Private/Admin
 * @param   {string} id - Category ID
 * @body    {string} name - Category name
 * @body    {string} icon - Category icon
 * @body    {string} color - Category color
 * @body    {string} image - Category image URL
 * @returns {Object} Updated category
 */
router.put(`/:id`, async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
      image: req.body.image,
    },
    { new: true }
  );

  if (!category) {
    return res
      .status(400)
      .json({ success: false, message: "Category not found" });
  }
  res.send(category);
});

/**
 * @route   DELETE api/v1/categories/:id
 * @desc    Delete a category
 * @access  Private/Admin
 * @param   {string} id - Category ID
 * @returns {Object} Success message
 */
router.delete("/:id", (req, res) => {
  Category.findByIdAndDelete(req.params.id)
    .then((category) => {
      if (category) {
        return res
          .status(200)
          .json({ success: true, message: "Category deleted successfully" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err.message });
    });
});

module.exports = router;
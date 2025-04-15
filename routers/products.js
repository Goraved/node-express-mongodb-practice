const { Product } = require("../models/product");
const { Category } = require("../models/category");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/**
 * Storage configuration for multer middleware to handle file uploads.
 * 
 * @constant {Object} storage
 * @property {Function} destination - Function to determine the destination folder for uploaded files.
 *   Sets uploaded files to be stored in "./public/uploads" directory.
 * @property {Function} filename - Function to determine the filename for uploaded files.
 *   Generates a unique filename by combining the original filename, current timestamp, and appropriate file extension.
 *   Validates that the file mimetype matches one of the allowed image types defined in FILE_TYPE_MAP.
 *   Returns an error if the file type is invalid.
 * 
 * @requires multer
 * @requires FILE_TYPE_MAP - A mapping of MIME types to file extensions
 */
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(".")[0];
    const fileExtension = FILE_TYPE_MAP[file.mimetype];
    if (!fileExtension) {
      return cb(new Error("Invalid image type"), false);
    }
    // Generate a unique filename using the original name and current timestamp
    cb(null, fileName + "-" + Date.now() + "." + fileExtension);
  },
});
const uploadOptions = multer({ storage: storage });

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a list of all products with optional category filtering
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Comma-separated list of category IDs to filter products
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @route   GET api/v1/products
 * @desc    Get all products with optional category filtering
 * @access  Public
 * @query   {string} categories - Comma-separated list of category IDs
 * @returns {Array} List of products
 */
router.get(`/`, async (req, res) => {
  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
  }

  const productList = await Product.find(filter).populate("category");
  if (!productList) {
    return res.status(500).json({ success: false });
  }
  res.send(productList);
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     description: Retrieve a single product by its ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
/**
 * @route   GET api/v1/products/:id
 * @desc    Get a single product by ID
 * @access  Public
 * @param   {string} id - Product ID
 * @returns {Object} Product data with populated category
 */
router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");

  if (!product) {
    res.status(404).json({ success: false, message: "Product not found" });
  }
  res.send(product);
});

/**
 * @route   GET api/v1/products/get/count
 * @desc    Get total count of products
 * @access  Private/Admin
 * @returns {Object} Count of products
 */
router.get(`/get/count`, async (req, res) => {
  const productCount = await Product.countDocuments();

  if (!productCount) {
    res.status(500).json({ success: false, message: "Products not found" });
  }
  res.send({ count: productCount });
});

/**
 * @route   GET api/v1/products/get/featured/:count
 * @desc    Get featured products with optional limit
 * @access  Public
 * @param   {number} count - Number of featured products to return
 * @returns {Array} Featured products
 */
router.get(`/get/featured/:count`, async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const featuredProducts = await Product.find({ isFeatured: true }).limit(
    +count
  );

  if (!featuredProducts) {
    res.status(500).json({ success: false, message: "Products not found" });
  }
  res.send(featuredProducts);
});

/**
 * @route   POST api/v1/products
 * @desc    Create a new product
 * @access  Private/Admin
 * @body    {string} name - Product name
 * @body    {string} description - Product description
 * @body    {string} richDescription - Detailed product description
 * @body    {string} image - Main product image URL
 * @body    {Array} images - Additional product images URLs
 * @body    {string} brand - Product brand
 * @body    {number} price - Product price
 * @body    {string} category - Category ID
 * @body    {number} countInStock - Available quantity
 * @body    {number} rating - Product rating
 * @body    {boolean} isFeatured - Featured status
 * @returns {Object} Created product
 */
router.post(`/`, uploadOptions.single("image"), async (req, res) => {
  // Validate that the category exists
  const category = await Category.findById(req.body.category);
  if (!category) {
    return res.status(400).send("Invalid Category");
  }

  const file = req.file;
  if (!file) {
    return res.status(400).send("No image in the request");
  }
  const fileName = req.file ? req.file.filename : null;
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

  /**
   * Creates a new Product instance with data from the request body.
   * @constructor
   * @param {Object} req.body - The request body containing product data
   * @param {string} req.body.name - The name of the product
   * @param {string} req.body.description - Brief description of the product
   * @param {string} req.body.richDescription - Detailed description of the product
   * @param {string} fileName - The name of the uploaded image file
   * @param {string} basePath - The base path for the image URL
   * @param {string[]} req.body.images - Array of additional product image URLs
   * @param {string} req.body.brand - The brand name of the product
   * @param {number} req.body.price - The price of the product
   * @param {string|ObjectId} req.body.category - Reference to the product category
   * @param {number} req.body.countInStock - Available quantity in stock
   * @param {number} req.body.rating - Product rating value
   * @param {boolean} req.body.isFeatured - Indicates if product is featured
   * @returns {Product} New product instance ready to be saved to the database
   */
  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${fileName}`,
    images: req.body.images,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    isFeatured: req.body.isFeatured,
  });
  product = await product.save();
  if (!product) {
    return res
      .status(500)
      .json({ success: false, message: "Product not created" });
  }
  res.send(product);
});

/**
 * @route   DELETE api/v1/products/:id
 * @desc    Delete a product
 * @access  Private/Admin
 * @param   {string} id - Product ID
 * @returns {Object} Success message
 */
router.delete("/:id", (req, res) => {
  Product.findByIdAndDelete(req.params.id)
    .then((product) => {
      if (product) {
        return res
          .status(200)
          .json({ success: true, message: "Product deleted successfully" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err.message });
    });
});

/**
 * @route   PUT api/v1/products/:id
 * @desc    Update a product
 * @access  Private/Admin
 * @param   {string} id - Product ID
 * @body    {string} name - Product name
 * @body    {string} description - Product description
 * @body    {string} richDescription - Detailed product description
 * @body    {string} image - Main product image URL
 * @body    {Array} images - Additional product images URLs
 * @body    {string} brand - Product brand
 * @body    {number} price - Product price
 * @body    {string} category - Category ID
 * @body    {number} countInStock - Available quantity
 * @body    {number} rating - Product rating
 * @body    {boolean} isFeatured - Featured status
 * @returns {Object} Updated product
 */
router.put(`/:id`, uploadOptions.single("image"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Product ID");
  }

  // Validate that the category exists
  const category = await Category.findById(req.body.category);
  if (!category) {
    return res.status(400).send("Invalid Category");
  }

  // Validate that the category exists
  let product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(400).send("Invalid Product");
  }

  const file = req.file;
  let imagePath;
  if (file) {
    const fileName = req.file ? req.file.filename : null;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    imagePath = `${basePath}${fileName}`;
  } else {
    imagePath = product.image;
  }

  product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: imagePath,
      images: req.body.images,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );

  if (!product) {
    return res
      .status(400)
      .json({ success: false, message: "Product not found" });
  }
  res.send(product);
});

/**
 * @swagger
 * /products/gallery-images/{id}:
 *   put:
 *     summary: Update product gallery
 *     description: Upload multiple images to a product's gallery
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Gallery images (up to 10)
 *     responses:
 *       200:
 *         description: Updated product with gallery
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  `/gallery-images/:id`,
  uploadOptions.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Product ID");
    }

    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).send("No images in the request");
    }
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    const imagePaths = files.map((file) => `${basePath}${file.filename}`);
    console.log

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        images: imagePaths,
      },
      { new: true }
    );

    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "Product not found" });
    }
    res.send(product);
  }
);

module.exports = router;

import { Product } from "../models/product.model.js";
import { User } from "../models/user-model.js";
import { catchAsyncErrors } from "../middlewares/catchAysncErrors.js";
import { ErrorHandler } from "../middlewares/error.middleware.js";
import fs from "fs";
import path from "path";

// Validation helper function
const validateRequiredFields = (fields, isUpdate = false) => {
  const requiredFields = [
    "name",
    "description",
    "price",
    "category",
    "stockQuantity",
    "servingSize",
  ];
  const missingFields = [];

  const cleanFields = {};
  Object.keys(fields).forEach((key) => {
    const cleanKey = key.trim();
    const value = fields[key];

    // Skip empty or whitespace-only keys
    if (cleanKey && cleanKey !== key.trim()) {
      console.log(`Warning: Field key has extra spaces: "${key}"`);
    }

    if (cleanKey) {
      cleanFields[cleanKey] = typeof value === "string" ? value.trim() : value;
    }
  });

  for (const field of requiredFields) {
    const value = cleanFields[field];

    if (!isUpdate && (!value || value === "")) {
      missingFields.push(field);
    } else if (isUpdate && value !== undefined && (!value || value === "")) {
      missingFields.push(field);
    }
  }

  // Additional validations
  if (cleanFields.price !== undefined) {
    const price = parseFloat(cleanFields.price);
    if (isNaN(price) || price < 0) {
      missingFields.push("price (must be a valid number >= 0)");
    }
  }

  if (cleanFields.stockQuantity !== undefined) {
    const stockQuantity = parseInt(cleanFields.stockQuantity);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      missingFields.push("stockQuantity (must be a valid number >= 0)");
    }
  }

  return { missingFields, cleanFields };
};

// Create Product (Admin only)
const createProduct = catchAsyncErrors(async (req, res, next) => {
  // Validate required fields
  const { missingFields, cleanFields } = validateRequiredFields(req.body);
  if (missingFields.length > 0) {
    return next(
      new ErrorHandler(
        `Missing or invalid required fields: ${missingFields.join(", ")}`,
        400
      )
    );
  }

  const {
    name,
    description,
    price,
    category,
    stockQuantity,
    ingredients,
    servingSize,
    howToUse,
  } = cleanFields;

  // Handle uploaded images
  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map((file) => ({
      url: `${req.protocol}://${req.get("host")}/uploads/products/${
        file.filename
      }`,
      altText: cleanFields.altText || "",
    }));
  }

  // Clean ingredients array if it exists
  let cleanIngredients = [];
  if (ingredients) {
    let parsedIngredients = ingredients;
    if (typeof ingredients === "string") {
      try {
        parsedIngredients = JSON.parse(ingredients);
      } catch (err) {
        return next(new ErrorHandler("Invalid ingredients format", 400));
      }
    }
    if (Array.isArray(parsedIngredients)) {
      cleanIngredients = parsedIngredients.filter(
        (ingredient) => ingredient && ingredient.name && ingredient.quantity
      );
    }
  }

  const product = await Product.create({
    name,
    description,
    price: parseFloat(price),
    category,
    stockQuantity: parseInt(stockQuantity),
    images,
    ingredients: cleanIngredients,
    servingSize,
    howToUse,
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});

// Get All Products
const getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const { category, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (category) {
    filter.category = category;
  }

  const products = await Product.find(filter)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Product.countDocuments(filter);

  res.status(200).json({
    success: true,
    products,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
});

// Get Single Product
const getProductById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Update Product (Admin only)
const updateProduct = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  let product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const body = req.body || {};

  if (body.ingredients && typeof body.ingredients === "string") {
    try {
      body.ingredients = JSON.parse(body.ingredients);
    } catch (err) {
      return next(new ErrorHandler("Invalid ingredients format", 400));
    }
  }

  const { missingFields, cleanFields } = validateRequiredFields(body, true);
  if (missingFields.length > 0) {
    return next(
      new ErrorHandler(`Invalid field values: ${missingFields.join(", ")}`, 400)
    );
  }

  // Convert string numbers to actual numbers for update
  if (cleanFields.price !== undefined) {
    cleanFields.price = parseFloat(cleanFields.price);
  }
  if (cleanFields.stockQuantity !== undefined) {
    cleanFields.stockQuantity = parseInt(cleanFields.stockQuantity);
  }

  // Handle uploaded images (replace images if new ones are uploaded)
  if (req.files && req.files.length > 0) {
    // Delete old images from server
    if (product.images && product.images.length > 0) {
      product.images.forEach((image) => {
        const filename = path.basename(image.url);
        const filepath = path.join(
          process.cwd(),
          "public/uploads/products",
          filename
        );
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      });
    }
    cleanFields.images = req.files.map((file) => ({
      url: `${req.protocol}://${req.get("host")}/uploads/products/${
        file.filename
      }`,
      altText: cleanFields.altText || "",
    }));
  }

  // Clean ingredients array if it exists
  if (cleanFields.ingredients) {
    let parsedIngredients = cleanFields.ingredients;
    if (typeof parsedIngredients === "string") {
      try {
        parsedIngredients = JSON.parse(parsedIngredients);
      } catch (err) {
        return next(new ErrorHandler("Invalid ingredients format", 400));
      }
    }
    if (Array.isArray(parsedIngredients)) {
      cleanFields.ingredients = parsedIngredients.filter(
        (ingredient) => ingredient && ingredient.name && ingredient.quantity
      );
    }
  }

  product = await Product.findByIdAndUpdate(id, cleanFields, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product,
  });
});

// Delete Product (Admin only)
const deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Delete associated images from server
  if (product.images && product.images.length > 0) {
    product.images.forEach((image) => {
      const filename = path.basename(image.url);
      const filepath = path.join(
        process.cwd(),
        "public/uploads/products",
        filename
      );
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    });
  }

  await Product.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// Add Review (User only)
const addReview = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Check if user has purchased this product
  const user = await User.findById(req.user._id);
  const hasPurchased = user.Buyinghistory.some(
    (purchase) => purchase.productId.toString() === id
  );

  if (!hasPurchased) {
    return next(
      new ErrorHandler("You can only review products you have purchased", 403)
    );
  }

  const existingReview = product.reviews.find(
    (review) => review.userId.toString() === req.user._id.toString()
  );

  if (existingReview) {
    return next(
      new ErrorHandler("You have already reviewed this product", 400)
    );
  }

  const review = {
    userId: req.user._id,
    rating,
    comment,
  };

  product.reviews.push(review);
  await product.save();

  res.status(200).json({
    success: true,
    message: "Review added successfully",
    product,
  });
});

export {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addReview,
};

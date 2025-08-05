import { Blog } from "../models/blog-model.js";
import { catchAsyncErrors } from "../middlewares/catchAysncErrors.js";
import { ErrorHandler } from "../middlewares/error.middleware.js";

// Create a new blog
const createBlog = catchAsyncErrors(async (req, res, next) => {
  let { title, content, category, tags } = req.body;

  if (!title || !content || !category) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  // Parse tags if it's a string (from multipart/form-data)
  if (typeof tags === "string") {
    try {
      tags = JSON.parse(tags);
    } catch (e) {
      return next(new ErrorHandler("Tags must be a valid JSON array", 400));
    }
  }

  // Validate tags if provided
  if (tags && !Array.isArray(tags)) {
    return next(new ErrorHandler("Tags must be provided as an array", 400));
  }

  // Handle uploaded cover image with correct path for blogs
  let coverImage = "";
  if (req.file) {
    coverImage = `${req.protocol}://${req.get("host")}/uploads/blogs/${
      req.file.filename
    }`;
  }

  const blog = await Blog.create({
    title,
    content,
    category,
    tags: tags || [], // Use provided tags or empty array
    coverImage,
    status: "published",
    author: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Blog created successfully",
    blog,
  });
});

// Get all blogs
const getAllBlogs = catchAsyncErrors(async (req, res, next) => {
  const blogs = await Blog.find({ status: "published" })
    .populate("author", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: blogs.length,
    blogs,
  });
});

// Get blog by ID
const getBlogById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const blog = await Blog.findById(id).populate("author", "name email");

  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }

  res.status(200).json({
    success: true,
    blog,
  });
});

// Update blog
const updateBlog = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  let { title, content, category, coverImage, status, tags } = req.body;

  const blog = await Blog.findById(id);

  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }

  // Check if the user is the author of the blog
  if (blog.author.toString() !== req.user._id.toString()) {
    return next(
      new ErrorHandler("You are not authorized to update this blog", 403)
    );
  }

  // Parse tags if it's a string (from multipart/form-data)
  if (typeof tags === "string") {
    try {
      tags = JSON.parse(tags);
      console.log("Parsed tags:", tags);
    } catch (e) {
      return next(new ErrorHandler("Tags must be a valid JSON array", 400));
    }
  }

  // Validate tags if provided
  if (tags && !Array.isArray(tags)) {
    return next(new ErrorHandler("Tags must be provided as an array", 400));
  }

  if (title) blog.title = title;
  if (content) blog.content = content;
  if (category) blog.category = category;
  if (coverImage) blog.coverImage = coverImage;
  if (status) blog.status = status;
  if (tags) blog.tags = tags;

  await blog.save();

  res.status(200).json({
    success: true,
    message: "Blog updated successfully",
    blog,
  });
});

// Delete blog
const deleteBlog = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);

  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }

  // Check if the user is the author of the blog
  if (blog.author.toString() !== req.user._id.toString()) {
    return next(
      new ErrorHandler("You are not authorized to delete this blog", 403)
    );
  }

  await Blog.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Blog deleted successfully",
  });
});

// Add comment to blog
const addComment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, comment, website } = req.body; // Changed from content to comment

  if (!name || !email || !comment) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  const blog = await Blog.findById(id);

  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }

  // Check if user already commented
  const existingComment = blog.comments.find((c) => c.email === email);
  if (existingComment) {
    return next(
      new ErrorHandler("You have already commented on this blog", 400)
    );
  }

  const newComment = {
    name,
    email,
    content: comment, // Map 'comment' to 'content' in the schema
    website: website || "",
  };

  blog.comments.push(newComment);
  await blog.save();

  res.status(200).json({
    success: true,
    message: "Comment added successfully",
    blog,
  });
});

export {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  addComment,
};

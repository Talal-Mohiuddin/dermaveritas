import { Blog } from "../models/blog-model.js";
import { catchAsyncErrors } from "../middlewares/catchAysncErrors.js";
import { ErrorHandler } from "../middlewares/error.middleware.js";

// Create a new blog
const createBlog = catchAsyncErrors(async (req, res, next) => {
  const { title, content, category } = req.body;

  if (!title || !content || !category) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  // Handle uploaded cover image with correct path for blogs
  let coverImage = "";
  if (req.file) {
    // Making sure we're using /uploads/blogs/ in the path
    coverImage = `${req.protocol}://${req.get("host")}/uploads/blogs/${
      req.file.filename
    }`;
  }
  const blog = await Blog.create({
    title,
    content,
    category,
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
  const blogs = await Blog.find({ isPublished: true })
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
  const { title, content, category, coverImage, status } = req.body;

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

  if (title) blog.title = title;
  if (content) blog.content = content;
  if (category) blog.category = category;
  if (coverImage) blog.coverImage = coverImage;
  if (status) blog.status = status;

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

export { createBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog };

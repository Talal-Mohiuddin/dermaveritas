import mongoose from "mongoose";

export default async function connectDB() {
  try {
    const dbURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/mydatabase";
    await mongoose.connect(dbURI).then(() => {
      console.log("MongoDB connected successfully");
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

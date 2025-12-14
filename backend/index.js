import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

/* -----------------------------
   CORS CONFIG
------------------------------ */
const allowedOrigins = [
  "https://blog-website-nine-lake.vercel.app",
  "http://127.0.0.1:5500",
  "http://localhost:5500"
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("❌ Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

/* -----------------------------
   HEALTH CHECK (IMPORTANT)
------------------------------ */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

/* -----------------------------
   ROUTES
------------------------------ */
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/auth", userRoutes);

/* -----------------------------
   GLOBAL ERROR HANDLER
------------------------------ */
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

/* -----------------------------
   MONGODB CONNECTION
------------------------------ */
const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // Force Render restart
  }
};

/* -----------------------------
   HANDLE DISCONNECTS
------------------------------ */
mongoose.connection.on("disconnected", () => {
  console.error("⚠️ MongoDB disconnected. Reconnecting...");
  connectDB();
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error:", err);
});

/* --------------------
   START SERVER
-----------------------*/
const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
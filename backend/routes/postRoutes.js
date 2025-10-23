import express from "express";
import Post from "../models/post.js";
import { authMiddleware } from "../middleWare/authMiddleWare.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const newPost = new Post({
      ...req.body,
      userId: req.user.id,
      username: req.user.name
    });
    const saved = await newPost.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    console.log("post.userId:", post.userId);
    console.log("req.user.id:", req.user.id);

    if (post.userId.toString() !== req.user.id.toString()){
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { title, content, image, date, tags } = req.body;
    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      { title, content, image, date, tags },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating post:", err);
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.userId.toString() !== req.user.id.toString()){
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

import express from "express";
import Comment from "../models/comment.js";
import { authMiddleware } from "../middleWare/authMiddleWare.js";

const router = express.Router();

router.get("/:postId", async (req, res) => {
  const comments = await Comment.find({ postId: req.params.postId }).sort({ when: -1 });
  res.json(comments);
});

router.post("/", authMiddleware, async (req, res) => {
  const comment = new Comment({ 
    ...req.body, 
    userId: req.user.id, 
    username: req.user.name 
  });
  await comment.save();
  res.json(comment);
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, message } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    console.log("comment:", comment);
    console.log("comment.userId:", comment?.userId);
    console.log("req.user:", req.user.id);

    if (!comment.userId || comment.userId.toString() !== req.user.id.toString()){
      return res.status(403).json({ message: "Unauthorized" });
    }

    comment.name = name || comment.name;
    comment.message = message || comment.message;
    const updated = await comment.save();

    res.json(updated)
  } catch (err) {
    console.error("❌ Error updating post:", err);
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedComment = await Comment.findByIdAndDelete(req.params.id);

    if (!deletedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    console.log("comment:", deletedComment);
    console.log("comment.userId:", deletedComment?.userId);
    console.log("req.user:", req.user.id);

    if (deletedComment.userId.toString() !== req.user.id.toString()){
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json({ message: "Comment deleted successfully", deletedComment });
  } catch (err) {
    console.error("❌ Error deleting comment:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;

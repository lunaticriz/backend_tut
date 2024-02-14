import mongoose, { isValidObjectId } from "mongoose";
import Comment from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  if (!isValidObjectId) {
    throw new ApiError(400, "Invalid video id");
  }
  const { page = 1, limit = 10 } = req.query;
  const match = {};
  if (videoId) match.video = new mongoose.Types.ObjectId(videoId);
  const pipeline = [
    { $match: match },
    {
      $facet: {
        paginatedResults: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        totalCount: [{ $count: "value" }],
      },
    },
  ];
  const [{ paginatedResults, totalCount }] = await Comment.aggregate(pipeline);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        paginatedResults,
        totalCount: totalCount.length ? totalCount[0].value : 0,
      },
      totalCount.length > 0
        ? "All comments fetched for this video"
        : "Comment not found"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const { content } = req.body;
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video id");
    }
    if (!content) {
      throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.create({
      content,
      video: videoId,
      owner: req.user?._id,
    });

    if (!comment) {
      throw new ApiError(400, "Unable to add comment");
    }
    return res
      .status(201)
      .json(new ApiResponse(201, comment, "Comment added successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message || "Unable to add comment");
  }
});

const updateComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!isValidObjectId(req.params.commentId)) {
      throw new ApiError(400, "Invalid comment id");
    }
    if (!content) {
      throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      {
        content,
      },
      { new: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "Comment updated successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message || "Unable to update comment");
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!isValidObjectId(req.params.commentId)) {
      throw new ApiError(400, "Invalid comment id");
    }
    await Comment.findByIdAndDelete(commentId);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment deleted successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message || "Invalid comment id");
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };

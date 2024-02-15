import mongoose, { isValidObjectId } from "mongoose";
import Like from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video id");
    }
    const videoLikedByUserCheck = await Like.findOne({
      $and: [{ likedBy: req.user?._id }, { video: videoId }],
    });
    if (videoLikedByUserCheck) {
      await Like.findOneAndDelete({
        $and: [{ likedBy: req.user?._id }, { video: videoId }],
      });
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video unliked successfully"));
    }

    const result = await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });

    if (!result) {
      throw new ApiError(500, "Something went wrong");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, result, "Video liked successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid video id");
    }
    const commentLikedByUserCheck = await Like.findOne({
      $and: [{ likedBy: req.user?._id }, { comment: commentId }],
    });
    if (commentLikedByUserCheck) {
      await Like.findOneAndDelete({
        $and: [{ likedBy: req.user?._id }, { comment: commentId }],
      });
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment unliked successfully"));
    }

    const result = await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });

    if (!result) {
      throw new ApiError(500, "Something went wrong");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, result, "Comment liked successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
      throw new ApiError(400, "Invalid video id");
    }
    const tweetLikedByUserCheck = await Like.findOne({
      $and: [{ likedBy: req.user?._id }, { tweet: tweetId }],
    });
    if (tweetLikedByUserCheck) {
      await Like.findOneAndDelete({
        $and: [{ likedBy: req.user?._id }, { tweet: tweetId }],
      });
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet unliked successfully"));
    }

    const result = await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });

    if (!result) {
      throw new ApiError(500, "Something went wrong");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, result, "Tweet liked successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  try {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
      { $match: { likedBy: new mongoose.Types.ObjectId(req.user?._id) } },
      { $group: { _id: "$video" } },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "_id",
          as: "videoDetails",
          pipeline: [
            {
              $match: { isPublished: true },
            },
          ],
        },
      },
      { $unwind: "$videoDetails" },
      { $replaceRoot: { newRoot: "$videoDetails" } },
      {
        $group: {
          _id: null,
          likedVideos: { $push: "$$ROOT" },
          totalLikedVideos: { $sum: 1 },
        },
      },
      {
        $project: { _id: 0 },
      },
    ]);
    if (likedVideos.length < 0) {
      throw new ApiError(500, "Video not found");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully.")
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

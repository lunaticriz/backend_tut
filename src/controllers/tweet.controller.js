import mongoose, { isValidObjectId } from "mongoose";
import Tweet from "../models/tweet.model.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  try {
    if (!req.body.content) {
      throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweet.create({
      content: req.body.content,
      owner: req.user?._id,
    });

    if (!tweet) {
      throw new ApiError(400, "Unable to create tweet");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, tweet, "Tweet created successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message || "Unable to create");
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  try {
    const userTweets = await Tweet.find({ owner: req.params.userId });
    if (!userTweets) {
      throw new ApiError(400, "No tweets found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, userTweets, "Tweets fetched successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message || "Unable to fetch tweets");
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  try {
    if (!isValidObjectId(req.params.tweetId)) {
      throw new ApiError(400, "Invalid tweet id");
    }

    if (!req.body.content) {
      throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.findByIdAndUpdate(
      req.params.tweetId,
      {
        $set: {
          content: req.body.content,
        },
      },
      {
        new: true,
      }
    );
    if (!tweet) {
      throw new ApiError(400, "Unable to update tweet");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, tweet, "Tweets fetched successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message || "Unable to fetch tweets");
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  try {
    if (!isValidObjectId(req.params.tweetId)) {
      throw new ApiError(400, "Invalid tweet id");
    }
    await Tweet.findByIdAndDelete(req.params.tweetId);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
  } catch (error) {
    throw new ApiError(400, "Unable to delete tweet");
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

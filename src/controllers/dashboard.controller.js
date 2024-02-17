import mongoose from "mongoose";
import Video from "../models/video.model.js";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";
import Like from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  try {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelStats = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.user?._id) },
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "owner",
          as: "videos",
          pipeline: [
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
              },
            },
            {
              $addFields: {
                totalLikes: {
                  $size: "$likes",
                },
              },
            },
            {
              $project: {
                createdAt: 0,
                updatedAt: 0,
                likes: 0,
                owner: 0,
                __v: 0,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "channlesSubscribedTo",
        },
      },
      {
        $lookup: {
          from: "playlists",
          localField: "_id",
          foreignField: "owner",
          as: "playlists",
        },
      },
      {
        $addFields: {
          totalVideos: {
            $size: "$videos",
          },
          totalSubscribers: {
            $size: "$subscribers",
          },
          totalChannlesSubscribedTo: {
            $size: "$channlesSubscribedTo",
          },
          totalPlaylists: {
            $size: "$playlists",
          },
        },
      },
      {
        $project: {
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
          password: 0,
          refreshToken: 0,
          subscribers: 0,
          channlesSubscribedTo: 0,
          playlists: 0,
        },
      },
    ]);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          channelStats,
          "Channel stats fetched successfully."
        )
      );
  } catch (error) {
    throw new ApiError(400, error?.message || "No Stats");
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  try {
    // TODO: Get all the videos uploaded by the channel
    const videos = await Video.aggregate([
      {
        $match: { owner: new mongoose.Types.ObjectId(req.user?._id) },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "userDetails",
          pipeline: [
            {
              $project: {
                _id: 0,
                fullName: 1,
                userName: 1,
                avatar: 1,
                coverImage: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
        },
      },
    ]);

    if (videos.length < 0) {
      throw new ApiError(404, "No videos found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, videos, "All videos fetched successfully."));
  } catch (error) {
    throw new ApiError(400, error?.message || "Unable to fetch videos");
  }
});

export { getChannelStats, getChannelVideos };

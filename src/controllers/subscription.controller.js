import mongoose, { isValidObjectId } from "mongoose";
import Subscription from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
      throw new ApiError(400, "Invalid channel id");
    }
    const channelSubscribedByUserCheck = await Subscription.findOne({
      $and: [{ subscriber: req.user?._id }, { channel: channelId }],
    });
    let newSubscription;
    let unsubscribe;
    if (!channelSubscribedByUserCheck) {
      newSubscription = await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
      });
      if (!newSubscription) {
        throw new ApiError(400, "Subscription not created, try again");
      }
    } else {
      await Subscription.findOneAndDelete({
        $and: [{ subscriber: req.user?._id }, { channel: channelId }],
      });
      unsubscribe = null;
    }
    const message =
      unsubscribe == null
        ? "Unsubscribed successfully"
        : "Subscribed successfully";
    return res
      .status(201)
      .json(
        new ApiResponse(201, !newSubscription ? {} : newSubscription, message)
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Internal Server Error");
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId)) {
      throw new ApiError(400, "Invalid channel id");
    }
    const subscriberList = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriber",
          pipeline: [
            {
              $project: {
                _id: 1,
                fullName: 1,
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$subscriber" },
      { $replaceRoot: { newRoot: "$subscriber" } },
      {
        $group: {
          _id: null,
          subscriberList: { $push: "$$ROOT" },
          totalSubscriberList: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);
    if (subscriberList.length < 0) {
      throw new ApiError(400, "No subscriber found");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscriberList,
          "All subscriber list fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, error?.message || "No subscriber found");
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  try {
    const { subscriberId } = req.params;
    if (!isValidObjectId(subscriberId)) {
      throw new ApiError(400, "Invalid subscriber id");
    }
    const channelList = await Subscription.aggregate([
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(subscriberId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "channel",
          pipeline: [
            {
              $project: {
                _id: 1,
                fullName: 1,
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$channel" },
      { $replaceRoot: { newRoot: "$channel" } },
      {
        $group: {
          _id: null,
          channelList: { $push: "$$ROOT" },
          totalSubscriberList: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);
    if (channelList.length < 0) {
      throw new ApiError(400, "No Channel found");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          channelList,
          "All channel list fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, error?.message || "No channel found");
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };

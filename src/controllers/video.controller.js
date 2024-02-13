import mongoose, { isValidObjectId } from "mongoose";
import Video from "../models/video.model.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadCloudinary,
  removeFileFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  try {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video
    if (!(title && description)) {
      throw new ApiError(404, "Title and description are required");
    }

    const videoFile = req.files?.videoFile[0].path;
    if (!videoFile) {
      throw new ApiError(400, "Video file is required");
    }
    const thumbnailFile = req.files?.thumbnail[0].path;
    if (!thumbnailFile) {
      throw new ApiError(400, "Thumbnail file is required");
    }

    const video = await uploadCloudinary(videoFile);
    if (!video) {
      throw new ApiError(400, "Error while uploading video file.");
    }

    const thumbnail = await uploadCloudinary(thumbnailFile);
    if (!thumbnail) {
      throw new ApiError(400, "Error while uploading thumbnail file.");
    }

    const newVideo = await Video.create({
      title,
      description,
      videoFile: video.url,
      thumbnail: thumbnail.url,
      duration: video.duration,
      owner: req.user?._id,
    });

    if (!newVideo) {
      throw new ApiError(500, "Internal server error, please try again");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, newVideo, "Video published successfully."));
  } catch (error) {
    throw new ApiError(400, error?.message || "Uncaught exception");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const video = await Video.findById(videoId);
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully."));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  const oldThumbnail = await Video.findById(videoId).select("thumbnail -_id");
  const thumbnailPath = req.file?.path;
  let thumbnail;
  if (thumbnailPath) {
    await removeFileFromCloudinary(oldThumbnail.thumbnail);
    thumbnail = await uploadCloudinary(thumbnailPath);
  }
  const newThumbnail = !thumbnail?.url ? oldThumbnail.thumbnail : thumbnail.url;
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: newThumbnail,
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully."));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};

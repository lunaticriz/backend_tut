import mongoose, { isValidObjectId } from "mongoose";
import Playlist from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    //TODO: create playlist
    if (!(name && description)) {
      throw new ApiError(400, "Name or description is required");
    }
    const playlist = await Playlist.create({
      name,
      description,
      owner: req.user?._id,
    });

    if (!playlist) {
      throw new ApiError(400, "Playlist not created, try again");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, playlist, "Playlist created successfully."));
  } catch (error) {
    throw new ApiError(
      400,
      error?.message || "Unexpected error while creating playlist"
    );
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    //TODO: get user playlists
    if (!userId) {
      throw new ApiError(400, "userId required");
    }
    const allPlaylist = await Playlist.find({ owner: userId });
    if (allPlaylist.length < 0) throw new ApiError(400, "Playlist not found");
    return res
      .status(200)
      .json(
        new ApiResponse(200, allPlaylist, "Playlists fetched successfully")
      );
  } catch (error) {
    throw new ApiError(400, error?.message || "Unexpected error");
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(500, "Unable to fetch playlist");
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;
    if (!(playlistId && videoId)) {
      throw new ApiError(400, "playlistId or videoId required");
    }
    const addVideoInPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      { $addToSet: { videos: videoId } },
      { new: true }
    );
    if (!addVideoInPlaylist) {
      throw new ApiError(501, "Something went wrong");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, addVideoInPlaylist, "Video added in your playlist")
      );
  } catch (error) {
    throw new ApiError(400, error?.message || "Unexpected error");
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;
    // TODO: remove video from playlist
    if (!(playlistId && videoId)) {
      throw new ApiError(400, "playlistId or videoId required");
    }
    const removeVideoFromPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      { $pull: { videos: videoId } },
      { new: true }
    );
    if (!removeVideoFromPlaylist) {
      throw new ApiError(501, "Something went wrong");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          removeVideoFromPlaylist,
          "Video removed from your playlist"
        )
      );
  } catch (error) {
    throw new ApiError(400, error?.message || "Unexpected error");
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
    // TODO: delete playlist
    if (!playlistId) {
      throw new ApiError(400, "playlistId is required");
    }
    let r = await Playlist.findByIdAndDelete(playlistId);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message || "Unexpected error");
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist
    if (!(name && description)) {
      throw new ApiError(400, "Name or description is required");
    }
    const playlist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $set: {
          name,
          description,
        },
      },
      { new: true }
    );

    if (!playlist) {
      throw new ApiError(400, "Error while updating playlist details");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist updated successfully."));
  } catch (error) {
    throw new ApiError(
      400,
      error?.message || "Unexpected error while updating playlist"
    );
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};

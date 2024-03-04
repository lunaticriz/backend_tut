import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import {
  uploadCloudinary,
  removeFileFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import sendmail from "../utils/sendmail.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating access token and refresh token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { userName, email, fullName, password } = req.body;
    [userName, email, fullName, password].some((field) => {
      if (field?.trim() === "" || field?.trim() === undefined) {
        throw new ApiError(400, "All fields are required");
      }
    });

    const userExists = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (userExists) {
      throw new ApiError(409, "User already exists");
    }

    const avatarPath = req.files?.avatar[0]?.path;
    let coverImagePath;
    if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
    ) {
      coverImagePath = req.files?.coverImage[0]?.path;
    }
    const avatar = await uploadCloudinary(avatarPath);
    const coverImage = await uploadCloudinary(coverImagePath);
    if (!avatar) {
      throw new ApiError(400, "Avatar is required");
    }

    const user = await User.create({
      userName: userName.toLowerCase(),
      email,
      fullName,
      avatar: avatar?.url,
      coverImage: coverImage?.url || "",
      password,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser)
      throw new ApiError(500, "Something went wrong, please try again");

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "User Creation",
      text: "Thank you for choosing us, your account has been created.",
    };

    sendmail.sendMail(mailOptions, (error, info) => {
      if (error) {
        throw new ApiError(500, "Something went wrong, please try again");
      }
    });
    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User created successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message || "Unexpected error");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    if (!(userName || email)) {
      throw new ApiError(400, "Username or email is required");
    }
    const isUser = await User.findOne({
      $or: [{ userName }, { email }],
    });
    if (!isUser) {
      throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await isUser.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user credentials");
    }
    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(isUser._id);

    const loggedInUser = await User.findById(isUser._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged in successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, error?.message || "Unexpected error");
  }
});

const logout = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: { refreshToken: 1 }, // This will remove from the document.
      },
      { new: true }
    );
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message || "Unexpected error");
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(400, "unauthorized token");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid refresh token or expired refresh token");
    }
    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "Refresh token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, error?.message || "Invalid refresh token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!(oldPassword && newPassword)) {
      throw new ApiError(400, "Old password and new password are required");
    }
    const user = await User.findById(req.user?._id);
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message || "Invalid password");
  }
});

const currentUser = asyncHandler(async (req, res) => {
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user, "User retrieved successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message || "Unexpected error");
  }
});

const updateUserDetails = asyncHandler(async (req, res) => {
  try {
    const { fullName, email } = req.body;
    if (!(fullName || email)) {
      throw new ApiError(400, "All fields are required");
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          email,
        },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User updated successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message || "Unexpected error");
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  try {
    const avatarPath = req.file?.path;
    if (!avatarPath) {
      throw new ApiError(400, "Avatar file is required");
    }
    const oldAvatar = req.user.avatar;
    const avatar = await uploadCloudinary(avatarPath);
    if (!avatar) {
      throw new ApiError(400, "Error while uploading avatar file.");
    }
    await removeFileFromCloudinary(oldAvatar);
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar updated successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message || "Unexpected error");
  }
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  try {
    const coverImagePath = req.file?.path;
    if (!coverImagePath) {
      throw new ApiError(400, "Cover image file is required");
    }

    const coverImage = await uploadCloudinary(coverImagePath);
    if (!coverImage) {
      throw new ApiError(400, "Error while uploading cover image file.");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Cover image updated successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message || "Unexpected error");
  }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName?.trim()) {
    throw new ApiError(400, "username is missing");
  }
  const channel = await User.aggregate([
    {
      $match: { userName: userName?.toLowerCase() },
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
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channlesSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channlesSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully.")
    );
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(req.user?._id) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user?.length) {
    throw new ApiError(404, "Watch history not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "User watch history fetched successfully."
      )
    );
});

export {
  registerUser,
  loginUser,
  logout,
  refreshAccessToken,
  changePassword,
  currentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
};

import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import  uploadCloudinary  from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        user.save({validateBeforeSave: false});
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error generating access token and refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => { 
    try {
        const { userName, email, fullName, password } = req.body;
        if(
            [userName, email, fullName, password].some((field) => {
                field?.trim() === ''
            })
        ) {
            throw new ApiError(400, "All fields are required");
        }

        const userExists = await User.findOne({
            $or: [{email}, {userName}]
        });

        if(userExists) {
            throw new ApiError(409, "User already exists");
        }

        const avatarPath = req.files?.avatar[0]?.path;
        let coverImagePath;
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
            coverImagePath = req.files?.coverImage[0]?.path;
        }
        const avatar = await uploadCloudinary(avatarPath);
        const coverImage = await uploadCloudinary(coverImagePath);
        if(!avatar) {
            throw new ApiError(400, "Avatar is required")
        }

        const user = await User.create({
            userName: userName.toLowerCase(),
            email,
            fullName,
            avatar: avatar?.url,
            coverImage: coverImage?.url || '',
            password,
        });

        const createdUser = await User.findById(user._id).select("-password -refreshToken");
        if (!createdUser) throw new ApiError(500, "Something went wrong, please try again")

        return res.status(201).json(new ApiResponse(
            200,
            createdUser,
            "User created successfully"
        ));

    } catch (err) { 
        throw err;
    }
})

const loginUser = asyncHandler(async(req, res) => {
    try {
        const { userName, email, password } = req.body;
        if(!(userName || email)) {
            throw new ApiError(400, "Username or email is required");
        }
        const isUser = await User.findOne({
            $or: [{userName}, {email}]
        })
        if(!isUser) {
            throw new ApiError(404, "User not found");
        }

        const isPasswordValid =  await isUser.comparePassword(password);
        if(!isPasswordValid) {
            throw new ApiError(401, "Invalid user credentials");
        }
        const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(isUser._id);
        
        const loggedInUser = await User.findById(isUser._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: true,
        }

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200, 
            {
                user: loggedInUser,
                accessToken,
                refreshToken,

            }, 
            "User logged in successfully"));
    } catch (error) {
        throw new ApiError(400, error?.message || "Unexpected error")
    }

})

const logout = asyncHandler(async (req, res)=>{
    try {
        await User.findByIdAndUpdate(
            req.user._id, 
            {
                $set: { refreshToken: undefined}
            }, 
            {new: true}
        )
        const options = {
            httpOnly: true,
            secure: true,
        }
    
        return res
          .status(200)
          .clearCookie("accessToken", options)
          .clearCookie("refreshToken", options)
          .json(new ApiResponse(
                200, 
                {}, 
                "User logged out successfully"
            )
        );
    } catch (error) {
        throw new ApiError(400, error?.message || "Unexpected error");
    }
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if(!incomingRefreshToken) {
            throw new ApiError(400, "unauthorized token");
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if(!user) {
            throw new ApiError(401, "Invalid refresh token");
        }
        if(user?.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Invalid refresh token or expired refresh token");
        }
        const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id);
        const options = {
            httpOnly: true,
            secure: true,
        }
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
        ))
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid refresh token")
    }
})

const changePassword = asyncHandler(async (req, res) =>{
    try {
        const { oldPassword, newPassword} = req.body;
        if(!(oldPassword && newPassword)) {
            throw new ApiError(400, "Old password and new password are required");
        }
        const user = await User.findById(req.user?._id);
        const isPasswordValid = await user.comparePassword(oldPassword);
        if(!isPasswordValid) {
            throw new ApiError(401, "Invalid password");
        }
        user.password = newPassword;
        await user.save({validateBeforeSave: false});
        return res.status(200).json(
            new ApiResponse(
                200, 
                {}, 
                "Password changed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid password");
    }
})

const currentUser = asyncHandler(async (req, res) => {
    try {
        return res.status(200).json(
            new ApiResponse(
                200, 
                req.user, 
                "User retrieved successfully"
            )
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "Unexpected error");
    }
})

const updateUserDetails = asyncHandler(async (req, res) => {
    try {
        const {fullName, email} = req.body;
        if(!(fullName && email)) {
            throw new ApiError(400, "All fields are required");
        }
        const user = await User.findByIdAndUpdate(req.user?._id, 
            {
                $set: {
                    fullName,
                    email
                }
            }, { new: true}
        ).select("-password");

        return res.status(200).json(
            new ApiResponse(
                200, 
                user, 
                "User updated successfully"
            )
        )

    } catch (error) {
        throw new ApiError(400, error?.message || "Unexpected error")
    }
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    try {
        const avatarPath = req.file.path;
        if (!avatarPath) {
            throw new ApiError(400, "Avatar file is required");
        }

        const avatar = await uploadCloudinary(avatarPath);
        if(!avatar) {
            throw new ApiError(400, "Error while uploading avatar file.")
        }

        const user = await User.findByIdAndUpdate(req.user?._id, 
            {
                $set: {
                    avatar: avatar.url
                }
            }, { new: true}
        ).select("-password");

        return res.status(200).json(
            new ApiResponse(
                200, 
                user, 
                "Avatar updated successfully"
            )
        );
    } catch (error) {
        throw new ApiError(400, error?.message || "Unexpected error")
    }
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    try {
        const coverImagePath = req.file.path;
        if (!coverImagePath) {
            throw new ApiError(400, "Cover image file is required");
        }

        const coverImage = await uploadCloudinary(avatarPath);
        if(!coverImage) {
            throw new ApiError(400, "Error while uploading cover image file.")
        }

        const user = await User.findByIdAndUpdate(req.user?._id, 
            {
                $set: {
                    coverImage: coverImage.url
                }
            }, { new: true}
        ).select("-password");

        return res.status(200).json(
            new ApiResponse(
                200, 
                user, 
                "Cover image updated successfully"
            )
        );
    } catch (error) {
        throw new ApiError(400, error?.message || "Unexpected error")
    }
})

export {
    registerUser,
    loginUser,
    logout,
    refreshAccessToken,
    changePassword,
    currentUser,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage
}
import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import  uploadCloudinary  from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';

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
        console.error(err);
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
        console.log(error);
    }

})

const logout = asyncHandler(async (req, res)=>{
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
})
export {
    registerUser,
    loginUser,
    logout
}
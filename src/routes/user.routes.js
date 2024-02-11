import { Router } from "express";
import { registerUser, loginUser, logout, refreshAccessToken, changePassword, currentUser, updateUserDetails } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    }, 
    {
        name: "coverImage",
        maxCount: 1
    }
]),registerUser);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logout);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(changePassword);
router.route("/current-user").get(currentUser);
router.route("/update-user-details").post(updateUserDetails);

export default router;
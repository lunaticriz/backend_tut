import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";

const healthcheck = asyncHandler(async (req, res) => {
  //TODO: build a healthcheck response that simply returns the OK status as json with a message
  try {
    return res.status(200).json(new ApiResponse(200, {}, "Ok"));
  } catch (error) {
    logger.error(`${req.method} ${req.url} ${error?.message}`);
    throw new ApiError(500, error?.message || "Internal Server Error");
  }
});

export { healthcheck };

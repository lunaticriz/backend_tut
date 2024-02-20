import request from "supertest";
import mongoose from "mongoose";
import { app } from "../app";
import { DB_NAME } from "../constant.js";
import { upload } from "../middlewares/multer.middleware.js";

jest.mock(upload, () => {
  return (req, res, next) => {
    req.file = {
      path: "C:/Users/Dell/Downloads/earth.jpg", // Mock the file path
    };
    next();
  };
});

describe("POST /users/register", () => {
  beforeAll(async () => {
    await mongoose.connect(`mongodb://localhost:27017/${DB_NAME}`);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
  test("Should create a user", async () => {
    const userDetails = {
      userName: "sam11",
      email: "sam11@gmail.com",
      password: "1234@12",
      fullName: "Sam Singh",
      avatar: "C:Users/DellOneDrive/desktop/videotube/public/temp/earth.jpg",
    };

    // Use request.agent() to persist cookies between requests
    const agent = request.agent(app);

    // Register a user
    const res = await agent.post("/api/v1/users/register").send(userDetails);

    // Check if the user is successfully created
    expect(res.statusCode).toBe(200);

    // Optionally, make additional assertions on the response if needed
  }, 10000); // Increase timeout if necessary
});

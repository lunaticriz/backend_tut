import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import { app } from "../server.js";
import connect from "../db/index.js";
import dotenv from "dotenv";

dotenv.config();
// Use a Mocha hook to connect to MongoDB before running the tests
before(function (done) {
  // Connect to MongoDB
  connect()
    .then(() => {
      console.log("MongoDB connected");
      done();
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      done(err); // Pass the error to Mocha to fail the test
    });
});

// Use a Mocha hook to disconnect from MongoDB after running the tests
after(function (done) {
  // Disconnect from MongoDB
  mongoose
    .disconnect()
    .then(() => {
      console.log("MongoDB disconnected");
      done();
    })
    .catch((err) => {
      console.error("MongoDB disconnection error:", err);
      done(err); // Pass the error to Mocha to fail the test
    });
});

// describe("POST /user/register", () => {
//   it("should create a new user along with file", async () => {
//     const response = await request(app)
//       .post("/api/v1/users/register")
//       .set("Content-Type", "multipart/form-data")
//       .field("userName", "johndoe")
//       .field("email", "johndoe@john.com")
//       .field("fullName", "John Doe")
//       .field("password", "JohnDoe")
//       .attach("avatar", "public/temp/earth.jpg"); // Attach the file to the request

//     // Assert the response
//     expect(response.status).to.equal(201);
//     // expect(response.body).to.have.property(
//     //   "message",
//     //   "File uploaded successfully"
//     // );
//     // expect(response.body).to.have.property("filename").that.is.a("string");
//   });
// });

// describe("POST /user/login", () => {
//   it("should return status 400 for invalid credentials", async () => {
//     const response = await request(app)
//       .post("/api/v1/users/login")
//       .send({ email: "invaliduser", password: "invalidpassword" });
//     expect(response.status).to.equal(400);
//   });

//   it("should return status 200 and user details for valid credentials", async () => {
//     const response = await request(app)
//       .post("/api/v1/users/login")
//       .send({ email: "johndoe@john.com", password: "JohnDoe" });
//     console.log(response._body);
//     expect(response.status).to.equal(200);
//     expect(response._body).to.have.property("statusCode", 200);
//     expect(response._body.message).to.equal("User logged in successfully");
//     expect(response._body.data).to.be.an("object");
//     expect(response._body.data.user).to.have.property("_id");
//     expect(response._body.data.user).to.have.property(
//       "email",
//       "johndoe@john.com"
//     );
//   });
// });

// describe("GET POST /user/current-user", () => {
//   it("should be return failed to fetch current user details", async () => {
//     const response = await request(app)
//       .get("/api/v1/users/current-user")
//       .set("Authorization", "")
//       .set("Content-Type", "application/json");
//     expect(response.status).to.equal(401);
//   });
//   it("should be return current user details", async () => {
//     const response = await request(app)
//       .get("/api/v1/users/current-user")
//       .set(
//         "Authorization",
//         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NWU4Mzk4YzIwYWE0NGY2ZTRkNDJlMDgiLCJlbWFpbCI6ImpvaG5kb2VAam9obi5jb20iLCJ1c2VyTmFtZSI6ImpvaG5kb2UiLCJmdWxsTmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzA5ODkyMjAxLCJleHAiOjE3MDk5Nzg2MDF9.QOWVHsHXfXXd-4dxCqvXlbAApD_zE8q0hCJO9_kz-jU"
//       )
//       .set("Content-Type", "application/json");
//     expect(response.status).to.equal(200);
//     expect(response._body).to.have.property("statusCode", 200);
//     expect(response._body.data).to.be.an("object");
//     expect(response._body.message).to.equal("User retrieved successfully");
//   });
// });

describe("POST /user/logout", () => {
  it("should not be logout the user from the application", async () => {
    const response = await request(app)
      .post("/api/v1/users/logout")
      .set("Authorization", "")
      .set("Content-Type", "application/json");
    expect(response.status).to.equal(401);
  });

  it("should be logout the user from the application", async () => {
    const response = await request(app)
      .post("/api/v1/users/logout")
      .set(
        "Authorization",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NWU4Mzk4YzIwYWE0NGY2ZTRkNDJlMDgiLCJlbWFpbCI6ImpvaG5kb2VAam9obi5jb20iLCJ1c2VyTmFtZSI6ImpvaG5kb2UiLCJmdWxsTmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzA5ODkzNzM3LCJleHAiOjE3MDk5ODAxMzd9.hUopDwT3OG8ryRvhIp1nkZhCx5UvihdKlbQkXWAXjr8"
      )
      .set("Content-Type", "application/json");
    expect(response.status).to.equal(200);
    expect(response._body.message).to.equal("User logged out successfully");
  });
});

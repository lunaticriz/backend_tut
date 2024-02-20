import request from "supertest";
import { app } from "../app.js";

/**
 * To run test use this command
 * NODE_OPTIONS=--experimental-vm-modules npm test
 */

describe("Get /healthcheck", () => {
  test("should create a health check", async () => {
    const res = await request(app).get("/api/v1/healthcheck");
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual("Ok");
  });
});

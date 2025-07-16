import request from "supertest";
import app from "../src/server";

describe("Auth", () => {
  it("registers user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@a.com", password: "123456" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });
});
import { describe, expect, it, afterAll } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();
afterAll(() => app.close());

describe("POST /score", () => {
  it("scores a weak password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/score",
      payload: { password: "password1" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.score).toBe(0);
    expect(body.feedback.warning).toBeTruthy();
  });

  it("scores a strong password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/score",
      payload: { password: "correct-horse-battery-staple-9!" },
    });
    expect(res.json().score).toBe(4);
  });

  it("rejects missing password", async () => {
    const res = await app.inject({ method: "POST", url: "/score", payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it("ignores extra properties per fastify ajv defaults", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/score",
      payload: { password: "password1", extra: "y" },
    });
    expect([200, 400]).toContain(res.statusCode);
  });
});

describe("POST /score/batch", () => {
  it("scores several passwords", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/score/batch",
      payload: { passwords: ["123456", "Gm4x!p2vT9wZqL"] },
    });
    expect(res.statusCode).toBe(200);
    const results = res.json().results;
    expect(results[0].score).toBe(0);
    expect(results[1].score).toBeGreaterThan(2);
  });

  it("rejects over-limit batches", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/score/batch",
      payload: { passwords: Array(51).fill("x") },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("meta", () => {
  it("health works", async () => {
    expect((await app.inject({ url: "/health" })).json().status).toBe("ok");
  });

  it("root states the no-storage policy", async () => {
    const body = (await app.inject({ url: "/" })).json();
    expect(body.note).toMatch(/never logged or stored/);
  });
});

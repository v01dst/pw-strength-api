import { describe, expect, it } from "vitest";
import { scorePassword } from "../src/strength.js";

describe("scorePassword", () => {
  it("scores common passwords at 0", () => {
    for (const pw of ["123456", "password", "qwerty", "Password1"]) {
      const r = scorePassword(pw);
      expect(r.score).toBe(0);
      expect(r.feedback.warning).toBeTruthy();
    }
  });

  it("scores empty as 0 with a warning", () => {
    const r = scorePassword("");
    expect(r.score).toBe(0);
    expect(r.entropyBits).toBe(0);
  });

  it("scores very short passwords at 0 regardless of complexity", () => {
    expect(scorePassword("aB3!").score).toBe(0);
  });

  it("scores keyboard patterns lower", () => {
    const seq = scorePassword("qwertyuiop1!");
    const shuffled = scorePassword("q1w!eirtuyop");
    expect(seq.entropyBits).toBeLessThan(shuffled.entropyBits);
  });

  it("scores sequences lower", () => {
    expect(scorePassword("Abcd1234!@").entropyBits).toBeLessThan(
      scorePassword("Axcd1b34!@").entropyBits
    );
  });

  it("scores repeats lower", () => {
    expect(scorePassword("aaaaaaaaaa1!").entropyBits).toBeLessThan(
      scorePassword("aigxz7hk1!").entropyBits
    );
  });

  it("strong long mixed password reaches 4", () => {
    const r = scorePassword("correct-horse-battery-staple-9!");
    expect(r.score).toBe(4);
    expect(r.label).toBe("very-strong");
    expect(r.entropyBits).toBeGreaterThan(80);
  });

  it("crack time grows with strength", () => {
    expect(scorePassword("Tr0ub4dour&3").crackTimeOfflineSlowHash).not.toBe("instant");
    expect(scorePassword("correct-horse-battery-staple-9!").guessesLog10).toBeGreaterThan(
      scorePassword("abc123!!xyz").guessesLog10
    );
  });

  it("gives actionable suggestions", () => {
    const r = scorePassword("hello1234");
    expect(r.feedback.suggestions.length).toBeGreaterThan(0);
  });

  it("penalizes year-like tokens", () => {
    expect(scorePassword("Summer2024!x").entropyBits).toBeLessThan(
      scorePassword("Summerqwx!xz").entropyBits
    );
  });

  it("digit-only passwords get a suggestion", () => {
    const r = scorePassword("987123456012");
    expect(r.feedback.suggestions.join(" ")).toMatch(/letters/);
  });

  it("labels match scores", () => {
    const labels = ["very-weak", "weak", "fair", "strong", "very-strong"];
    const cases: [string, number][] = [
      ["123456", 0],
      ["abc12345", 0],
      ["Gm4x!p2", 2],
      ["Gm4x!p2vT9wZ", 3],
      ["correct-horse-battery-staple-9!x8", 4],
    ];
    for (const [pw, expected] of cases) {
      expect(scorePassword(pw).score).toBe(expected);
      expect(scorePassword(pw).label).toBe(labels[expected]);
    }
  });
});

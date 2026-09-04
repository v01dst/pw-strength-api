const COMMON_PASSWORDS = new Set([
  "123456", "password", "123456789", "12345678", "12345", "qwerty", "1234567",
  "111111", "1234567890", "123123", "abc123", "1234", "password1", "iloveyou",
  "000000", "qwerty123", "1q2w3e", "aa12345678", "654321", "monkey", "qwertyuiop",
  "dragon", "123321", "654321", "letmein", "admin", "welcome", "login", "password!",
  "football", "baseball", "superman", "trustno1", "hello", "freedom", "whatever",
  "qazwsx", "google", "master", "sunshine", "princess", "charlie", "shadow",
  "michael", "jennifer", "jordan", "hunter", "buster", "soccer", "harley",
  "ranger", "buster", "hockey", "klaster", "george", "sexy", "andrew",
  "charlie", "thomas", "robert", "access", "love", "summer", "winter",
]);

const KEYBOARD_ROWS = ["`1234567890-=", "qwertyuiop[]\\", "asdfghjkl;'", "zxcvbnm,./"];
const LOWER_ROWS = KEYBOARD_ROWS.map((r) => r.toLowerCase());

export interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: "very-weak" | "weak" | "fair" | "strong" | "very-strong";
  entropyBits: number;
  guessesLog10: number;
  crackTimeOfflineSlowHash: string;
  feedback: {
    warning: string | null;
    suggestions: string[];
  };
}

const LABELS: StrengthResult["label"][] = ["very-weak", "weak", "fair", "strong", "very-strong"];

function charsetSize(pw: string): number {
  let size = 0;
  if (/[a-z]/.test(pw)) size += 26;
  if (/[A-Z]/.test(pw)) size += 26;
  if (/\d/.test(pw)) size += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) size += 33;
  return size;
}

function isKeyboardSequence(pw: string): boolean {
  const low = pw.toLowerCase();
  if (low.length < 3) return false;
  for (const row of LOWER_ROWS) {
    for (let i = 0; i + 3 <= low.length; i++) {
      const slice = low.slice(i, i + 3);
      if (row.includes(slice) || row.includes([...slice].reverse().join(""))) {
        return true;
      }
    }
  }
  return false;
}

function isSequence(pw: string): boolean {
  const low = pw.toLowerCase();
  if (low.length < 3) return false;
  let asc = 0;
  let desc = 0;
  for (let i = 1; i < low.length; i++) {
    const delta = low.charCodeAt(i) - low.charCodeAt(i - 1);
    if (delta === 1) asc++;
    else if (delta === -1) desc++;
  }
  return asc >= 2 || desc >= 2;
}

function countRepeats(pw: string): number {
  let repeats = 0;
  let run = 1;
  for (let i = 1; i < pw.length; i++) {
    if (pw[i] === pw[i - 1]) {
      run++;
      if (run >= 3) repeats++;
    } else {
      run = 1;
    }
  }
  return repeats;
}

function humanTime(seconds: number): string {
  if (seconds < 1) return "instant";
  const units: [number, string][] = [
    [60, "seconds"],
    [3600, "minutes"],
    [86400, "hours"],
    [2592000, "days"],
    [31536000, "months"],
    [31536000 * 100, "years"],
    [31536000 * 10000, "centuries"],
  ];
  let label = "millions of years";
  let value = seconds;
  let prev = 1;
  for (const [factor, name] of units) {
    if (seconds < factor) {
      value = seconds / prev;
      label = name === "months" ? "months" : name;
      return `${Math.max(1, Math.round(value))} ${label.replace(/s$/, "")}${Math.round(value) === 1 ? "" : "s"}`;
    }
    prev = factor;
    label = name;
  }
  if (seconds < 31536000 * 1e9) return "centuries";
  return "millions of years";
}

export function scorePassword(pw: string): StrengthResult {
  const suggestions: string[] = [];
  let warning: string | null = null;

  if (pw.length === 0) {
    return {
      score: 0,
      label: "very-weak",
      entropyBits: 0,
      guessesLog10: 0,
      crackTimeOfflineSlowHash: "instant",
      feedback: { warning: "password is empty", suggestions: ["enter a password"] },
    };
  }

  const low = pw.toLowerCase();
  const common = COMMON_PASSWORDS.has(low) || COMMON_PASSWORDS.has(low.replace(/\d+$/, ""));

  let entropy = pw.length * Math.log2(Math.max(charsetSize(pw), 2));

  const penalties: number[] = [];
  if (common) {
    warning = "this is one of the most common passwords";
    penalties.push(entropy * 0.8);
    suggestions.push("choose something unique, not a common password");
  }
  if (/^\d+$/.test(pw)) {
    penalties.push(entropy * 0.3);
    suggestions.push("add letters and symbols");
  }
  if (isKeyboardSequence(pw)) {
    penalties.push(entropy * 0.35);
    suggestions.push("avoid keyboard patterns like 'qwerty'");
  }
  if (isSequence(pw)) {
    penalties.push(entropy * 0.3);
    suggestions.push("avoid sequences like 'abcd' or '4321'");
  }
  const repeats = countRepeats(pw);
  if (repeats > 0) {
    penalties.push(repeats * 4);
    suggestions.push("avoid repeated characters like 'aaa'");
  }
  if (/(.)\1{2,}/.test(pw) === false && /^(.)\1+$/.test(pw)) {
    penalties.push(entropy * 0.5);
  }
  if (pw.length < 12) {
    suggestions.push("use at least 12 characters");
  }
  if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/\d/.test(pw) || !/[^a-zA-Z0-9]/.test(pw)) {
    suggestions.push("mix upper case, lower case, digits and symbols");
  }
  const yearMatch = pw.match(/(19|20)\d{2}/);
  if (yearMatch) {
    penalties.push(6);
    suggestions.push("avoid years and dates");
  }

  entropy = Math.max(0, entropy - penalties.reduce((a, b) => a + b, 0));

  const guessesLog10 = entropy / Math.log2(10);
  const offlineSlowSeconds = Math.pow(10, guessesLog10) / 1e4;

  let score: StrengthResult["score"];
  if (common) score = 0;
  else if (entropy < 28) score = 0;
  else if (entropy < 40) score = 1;
  else if (entropy < 60) score = 2;
  else if (entropy < 80) score = 3;
  else score = 4;
  if (!common && pw.length < 6) score = 0;
  if (!common && score === 4 && pw.length < 12) score = 3;

  if (score <= 1 && !warning) warning = "this password is easy to crack";

  return {
    score,
    label: LABELS[score] ?? "very-weak",
    entropyBits: Math.round(entropy * 10) / 10,
    guessesLog10: Math.round(guessesLog10 * 10) / 10,
    crackTimeOfflineSlowHash: common ? "instant" : humanTime(offlineSlowSeconds),
    feedback: { warning, suggestions: [...new Set(suggestions)].slice(0, 4) },
  };
}

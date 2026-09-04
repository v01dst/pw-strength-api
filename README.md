<div align="center">

# 🔐 pw-strength-api

**Password strength scoring — entropy, crack-time estimates, actionable feedback. Nothing stored.**

[![CI](https://github.com/v01dst/pw-strength-api/actions/workflows/ci.yml/badge.svg)](https://github.com/v01dst/pw-strength-api/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-MIT-8A2BE2)
![Node](https://img.shields.io/badge/node-22-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-strict-3178C6?logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/tests-20%20passing-brightgreen)

`entropy` · `common-password detection` · `pattern penalties` · `crack time` · `zero storage`

</div>

---

## ✨ Features

- **📊 0–4 scoring** — very-weak → very-strong, zxcvbn-style penalties
- **🧮 Real entropy math** — charset-aware, adjusted for common passwords, sequences, keyboard rows, repeats and years
- **⏱️ Crack-time estimates** — offline slow-hash scenario in human units
- **💡 Actionable feedback** — warnings + suggestions, not just a number
- **🔒 Privacy-first** — scored in memory, never logged or persisted
- **📦 Batch mode** — score up to 50 at once

## 🚀 Quick Start

```bash
git clone https://github.com/v01dst/pw-strength-api
cd pw-strength-api
npm ci
npm start
```

Or with Docker:

```bash
docker compose up -d
```

## 📡 API

### `POST /score`

```bash
curl -X POST http://localhost:3000/score \
  -H 'content-type: application/json' \
  -d '{"password":"Tr0ub4dor&3"}'
```

```json
{
  "score": 3,
  "label": "strong",
  "entropyBits": 52.6,
  "guessesLog10": 15.8,
  "crackTimeOfflineSlowHash": "centuries",
  "feedback": { "warning": null, "suggestions": ["use at least 12 characters"] }
}
```

### `POST /score/batch`

```json
{ "passwords": ["123456", "Gm4x!p2vT9wZqL"] }
```

### Errors

| Status | Meaning                    |
|--------|-----------------------------|
| `400`  | Missing password / too long |

## 🧱 Tech Stack

| Layer     | Tech                  |
|-----------|-----------------------|
| Runtime   | Node.js 22            |
| Language  | TypeScript (strict)   |
| Framework | Fastify 5             |
| Scoring   | In-house heuristics   |
| Testing   | Vitest 5              |
| Packaging | Docker + compose      |
| CI        | GitHub Actions        |

---

<div align="center">

Built with ⚡ by **v01dst**

[![GitHub](https://img.shields.io/badge/github-v01dst-181717?logo=github)](https://github.com/v01dst)
[![Discord](https://img.shields.io/badge/discord-9p.1-5865F2?logo=discord&logoColor=white)](https://discord.com/users/9p.1)

</div>

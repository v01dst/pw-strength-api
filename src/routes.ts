import type { FastifyInstance } from "fastify";
import { scorePassword, type StrengthResult } from "./strength.js";

const MAX_LENGTH = 256;

export function strengthRoutes(app: FastifyInstance): void {
  const errorResponse = {
    type: "object",
    properties: { error: { type: "string" } },
    required: ["error"],
  } as const;

  const scoreResponse = {
    type: "object",
    properties: {
      score: { type: "number" },
      label: { type: "string" },
      entropyBits: { type: "number" },
      guessesLog10: { type: "number" },
      crackTimeOfflineSlowHash: { type: "string" },
      feedback: {
        type: "object",
        properties: { warning: { type: ["string", "null"] }, suggestions: { type: "array", items: { type: "string" } } },
        required: ["warning", "suggestions"],
      },
    },
    required: ["score", "label", "entropyBits", "guessesLog10", "crackTimeOfflineSlowHash", "feedback"],
  } as const;

  app.post(
    "/score",
    {
      schema: {
        body: {
          type: "object",
          required: ["password"],
          properties: { password: { type: "string", maxLength: MAX_LENGTH } },
          additionalProperties: false,
        },
        response: { 200: scoreResponse, 400: errorResponse },
      },
    },
    async (request, reply) => {
      const { password } = request.body as { password: string };
      if (password.length > MAX_LENGTH) {
        return reply.status(400).send({ error: `password too long (max ${MAX_LENGTH})` });
      }
      return reply.status(200).send(scorePassword(password));
    }
  );

  app.post(
    "/score/batch",
    {
      schema: {
        body: {
          type: "object",
          required: ["passwords"],
          properties: {
            passwords: { type: "array", items: { type: "string", maxLength: MAX_LENGTH }, maxItems: 50 },
          },
          additionalProperties: false,
        },
        response: { 400: errorResponse },
      },
    },
    async (request, reply) => {
      const { passwords } = request.body as { passwords: string[] };
      const results: (StrengthResult | { error: string })[] = passwords.map((p) =>
        p.length > MAX_LENGTH ? { error: `password too long (max ${MAX_LENGTH})` } : scorePassword(p)
      );
      return reply.status(200).send({ results });
    }
  );
}

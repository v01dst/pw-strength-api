import Fastify, { type FastifyInstance } from "fastify";
import { DEFAULT_CONFIG, type Config } from "./config.js";
import { strengthRoutes } from "./routes.js";

export interface AppOptions {
  config?: Partial<Config>;
  logger?: boolean;
}

export const DEFAULTS = DEFAULT_CONFIG;

export function createApp(opts: AppOptions = {}): FastifyInstance {
  const config: Config = { ...DEFAULT_CONFIG, ...opts.config };
  const startedAt = Date.now();

  const app = Fastify({ logger: opts.logger ?? false });

  app.get("/health", async () => ({
    status: "ok",
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
  }));

  app.get("/", async () => ({
    service: "pw-strength-api",
    version: "1.0.0",
    author: "v01dst",
    note: "passwords are scored in memory and never logged or stored",
    usage: "POST /score {password} → strength report",
  }));

  app.register((instance, _o, done) => {
    strengthRoutes(instance);
    done();
  });

  void config;
  return app;
}

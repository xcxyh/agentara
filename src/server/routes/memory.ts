import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { config } from "@/shared";

const userPath = () => join(config.paths.memory, "USER.md");
const soulPath = () => join(config.paths.memory, "SOUL.md");

async function readFileOrDefault(path: string): Promise<string> {
  try {
    const file = Bun.file(path);
    return await file.text();
  } catch {
    return "";
  }
}

const PutMemorySchema = z.object({ content: z.string() });

/**
 * Memory route group. Serves USER.md and SOUL.md under config.paths.memory.
 */
export const memoryRoutes = new Hono()
  .get("/user", async (c) => {
    const user = await readFileOrDefault(userPath());
    return c.json({ filename: userPath(), content: user });
  })
  .get("/soul", async (c) => {
    const soul = await readFileOrDefault(soulPath());
    return c.json({ filename: soulPath(), content: soul });
  })
  .put("/user", zValidator("json", PutMemorySchema), async (c) => {
    const { content } = c.req.valid("json");
    mkdirSync(config.paths.memory, { recursive: true });
    await Bun.write(userPath(), content);
    return c.json({ ok: true });
  })
  .put("/soul", zValidator("json", PutMemorySchema), async (c) => {
    const { content } = c.req.valid("json");
    mkdirSync(config.paths.memory, { recursive: true });
    await Bun.write(soulPath(), content);
    return c.json({ ok: true });
  });

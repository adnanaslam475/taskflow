import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import {
  checkOrigin,
  errorResponse,
  HttpError,
  json,
  readJson,
} from "@/lib/http";
import { taskPatch } from "@/lib/task-validation";

type Context = { params: Promise<{ id: string }> };

async function update(request: Request, context: Context) {
  try {
    const id = z
      .string()
      .uuid()
      .parse((await context.params).id);
    const input = taskPatch.parse(await readJson(request));
    const now = new Date().toISOString();
    const [task] = await getDb()
      .update(tasks)
      .set({
        ...input,
        updatedAt: now,
        ...(input.completed === undefined
          ? {}
          : { completedAt: input.completed ? now : null }),
      })
      .where(eq(tasks.id, id))
      .returning();
    if (!task) throw new HttpError(404, "Task not found.");
    return json({ task });
  } catch (error) {
    return errorResponse(error);
  }
}

export const PATCH = update;
export const PUT = update;

export async function DELETE(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const id = z
      .string()
      .uuid()
      .parse((await context.params).id);
    const deleted = await getDb()
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id });
    if (!deleted.length) throw new HttpError(404, "Task not found.");
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import { errorResponse, json, readJson } from "@/lib/http";
import { taskInput } from "@/lib/task-validation";

export async function GET() {
  try {
    return json({
      tasks: await getDb()
        .select()
        .from(tasks)
        .orderBy(desc(tasks.createdAt), desc(tasks.id)),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = taskInput.parse(await readJson(request));
    const now = new Date().toISOString();
    const [task] = await getDb()
      .insert(tasks)
      .values({
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        completedAt: input.completed ? now : null,
      })
      .returning();
    return json({ task }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    completed: integer("completed", { mode: "boolean" })
      .notNull()
      .default(false),
    priority: text("priority", { enum: ["low", "medium", "high"] })
      .notNull()
      .default("medium"),
    category: text("category", { enum: ["work", "personal", "learning"] })
      .notNull()
      .default("work"),
    dueDate: text("due_date"),
    sourceUrl: text("source_url"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    completedAt: text("completed_at"),
  },
  (table) => [
    index("tasks_created_at_idx").on(table.createdAt),
    uniqueIndex("tasks_source_url_idx").on(table.sourceUrl),
    check(
      "tasks_title_check",
      sql`length(trim(${table.title})) BETWEEN 1 AND 160`,
    ),
    check("tasks_completed_check", sql`${table.completed} IN (0, 1)`),
    check(
      "tasks_priority_check",
      sql`${table.priority} IN ('low', 'medium', 'high')`,
    ),
    check(
      "tasks_category_check",
      sql`${table.category} IN ('work', 'personal', 'learning')`,
    ),
  ],
);

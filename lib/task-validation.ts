import { z } from "zod";

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    "Choose a valid date.",
  );

export const taskInput = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Give your task a title.")
      .max(160, "Keep the title under 161 characters."),
    description: z.string().trim().max(3000).default(""),
    completed: z.boolean().default(false),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    category: z.enum(["work", "personal", "learning"]).default("work"),
    dueDate: date.nullable().default(null),
    sourceUrl: z
      .string()
      .max(500)
      .regex(
        /^https:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9_.-]+\/issues\/[1-9]\d*$/,
        "Use a GitHub issue URL.",
      )
      .nullable()
      .default(null),
  })
  .strict();

export const taskPatch = taskInput
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one field to update.",
  );

export type Task = z.infer<typeof taskInput> & {
  id: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

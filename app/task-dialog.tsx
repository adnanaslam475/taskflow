"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, LoaderCircle, Plus, X } from "lucide-react";
import type { Task } from "@/lib/task-validation";

export default function TaskDialog({
  task,
  onClose,
  onSave,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (input: Record<string, unknown>, id?: string) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="task-dialog"
      onCancel={(event) => {
        if (saving) event.preventDefault();
        else onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current && !saving) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSaving(true);
          setError("");
          try {
            await onSave(
              {
                title: data.get("title"),
                description: data.get("description"),
                priority: data.get("priority"),
                category: data.get("category"),
                dueDate: data.get("dueDate") || null,
              },
              task?.id,
            );
            onClose();
          } catch (error) {
            setError((error as Error).message);
            setSaving(false);
          }
        }}
      >
        <div className="dialog-heading">
          <div className="dialog-icon">
            <Plus size={22} />
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close task form"
            disabled={saving}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <h2 id="dialog-title">
          {task ? "A little fine-tuning." : "One step closer."}
        </h2>
        <p className="muted">
          {task
            ? "Update the details and keep things moving."
            : "Give your next idea a place to start."}
        </p>
        <label htmlFor="title">
          Task title <span className="required">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={160}
          autoFocus
          placeholder="What would you like to get done?"
          defaultValue={task?.title}
        />
        <label htmlFor="description">
          Description <span className="optional">optional</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={3000}
          placeholder="A few details, a small reminder…"
          defaultValue={task?.description}
        />
        <div className="form-columns">
          <div>
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              defaultValue={task?.category ?? "work"}
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="learning">Learning</option>
            </select>
          </div>
          <div>
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              defaultValue={task?.priority ?? "medium"}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <label htmlFor="dueDate">
          Due date <span className="optional">optional</span>
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={task?.dueDate ?? ""}
        />
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="dialog-footer">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button className="button primary" disabled={saving}>
            {saving ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <ArrowUpRight size={17} />
            )}
            {task ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

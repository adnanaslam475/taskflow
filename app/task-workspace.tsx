"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  Command,
  Flag,
  Layers,
  LayoutGrid,
  ListTodo,
  LoaderCircle,
  Menu,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import Github from "./github-icon";
import type { Task } from "@/lib/task-validation";
import { api } from "@/lib/api-client";
import TaskDialog from "./task-dialog";
import GitHubPanel from "./github-panel";

type View = "all" | "today" | "upcoming" | "completed";
type Category = "all" | Task["category"];
const dateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dayAfter = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateKey(date);
};
const names = {
  all: "All tasks",
  today: "Today",
  upcoming: "Upcoming",
  completed: "Completed",
};

function DueDate({ value, done }: { value: string | null; done: boolean }) {
  if (!value) return <span className="task-due no-date">No due date</span>;
  const today = dateKey();
  const label =
    value === today
      ? "Today"
      : value === dayAfter(1)
        ? "Tomorrow"
        : new Date(`${value}T12:00:00`).toLocaleDateString("en", {
            month: "short",
            day: "numeric",
          });
  return (
    <span
      className={`task-due ${!done && value < today ? "overdue" : ""} ${value === today && !done ? "due-today" : ""}`}
    >
      <CalendarDays size={13} />
      {label}
    </span>
  );
}

function ConfirmDelete({
  task,
  onClose,
  onDelete,
}: {
  task: Task;
  onClose: () => void;
  onDelete: () => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="task-dialog small-dialog"
      aria-labelledby="delete-title"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onClose();
      }}
    >
      <div className="dialog-heading">
        <div className="dialog-icon danger-icon">
          <Trash2 size={22} />
        </div>
        <button
          className="icon-button"
          aria-label="Close delete confirmation"
          onClick={onClose}
          disabled={busy}
        >
          <X size={20} />
        </button>
      </div>
      <h2 id="delete-title">Let this one go?</h2>
      <p className="muted">“{task.title}” will be permanently deleted.</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="dialog-footer">
        <button className="button secondary" onClick={onClose} disabled={busy}>
          Keep task
        </button>
        <button
          className="button danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onDelete();
              onClose();
            } catch (error) {
              setError((error as Error).message);
              setBusy(false);
            }
          }}
        >
          {busy && <LoaderCircle size={16} className="spin" />}Delete task
        </button>
      </div>
    </dialog>
  );
}

export default function TaskWorkspace() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("all");
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [dialog, setDialog] = useState<{ task: Task | null } | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [busy, setBusy] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [samplesBusy, setSamplesBusy] = useState(false);
  const [help, setHelp] = useState(false);
  const helpRef = useRef<HTMLDialogElement>(null);
  const today = dateKey();
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTasks((await api<{ tasks: Task[] }>("/api/tasks")).tasks);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (help) helpRef.current?.showModal();
  }, [help]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        (event.target.closest("input,textarea,select,dialog") ||
          event.target.isContentEditable)
      )
        return;
      if (
        event.key.toLowerCase() === "n" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !document.querySelector("dialog[open]")
      ) {
        event.preventDefault();
        setDialog({ task: null });
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        document.getElementById("task-search")?.focus();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  const completed = tasks.filter((task) => task.completed).length;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;
  const counts = {
    all: tasks.length,
    today: tasks.filter((task) => task.dueDate === today && !task.completed)
      .length,
    upcoming: tasks.filter(
      (task) => task.dueDate && task.dueDate > today && !task.completed,
    ).length,
    completed,
  };
  const filtered = useMemo(
    () =>
      tasks
        .filter((task) => {
          if (category !== "all" && task.category !== category) return false;
          if (view === "completed" && !task.completed) return false;
          if (view === "today" && (task.dueDate !== today || task.completed))
            return false;
          if (
            view === "upcoming" &&
            (!task.dueDate || task.dueDate <= today || task.completed)
          )
            return false;
          return `${task.title} ${task.description}`
            .toLowerCase()
            .includes(search.toLowerCase());
        })
        .sort((a, b) => {
          if (sort === "priority")
            return (
              { high: 0, medium: 1, low: 2 }[a.priority] -
              { high: 0, medium: 1, low: 2 }[b.priority]
            );
          if (sort === "due")
            return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
          return (
            b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
          );
        }),
    [tasks, view, category, search, sort, today],
  );
  async function save(input: Record<string, unknown>, id?: string) {
    const { task } = await api<{ task: Task }>(
      id ? `/api/tasks/${id}` : "/api/tasks",
      { method: id ? "PATCH" : "POST", body: JSON.stringify(input) },
    );
    setTasks((previous) =>
      id
        ? previous.map((item) => (item.id === id ? task : item))
        : [task, ...previous],
    );
    setToast(
      id ? "Task updated. Looking good." : "Task added. One step closer.",
    );
  }
  async function toggle(task: Task) {
    setBusy((previous) => [...previous, task.id]);
    try {
      const data = await api<{ task: Task }>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !task.completed }),
      });
      setTasks((previous) =>
        previous.map((item) => (item.id === task.id ? data.task : item)),
      );
      setToast(
        task.completed
          ? "Task moved back to your list."
          : "A little win. Nicely done!",
      );
    } catch (error) {
      setToast((error as Error).message);
    } finally {
      setBusy((previous) => previous.filter((id) => id !== task.id));
    }
  }
  function navigate(nextView: View, nextCategory: Category = "all") {
    setView(nextView);
    setCategory(nextCategory);
    setMobileNav(false);
  }
  async function samples() {
    setSamplesBusy(true);
    const examples = [
      {
        title: "Map out the new dashboard",
        description: "Sketch the first ideas for a simpler workspace.",
        priority: "high",
        category: "work",
        dueDate: today,
      },
      {
        title: "Read a chapter of Atomic Habits",
        description: "A few pages, a fresh perspective.",
        priority: "low",
        category: "personal",
        dueDate: dayAfter(1),
      },
      {
        title: "Review the onboarding flow",
        description: "Make that first impression a good one.",
        priority: "medium",
        category: "work",
        dueDate: today,
      },
      {
        title: "Explore React Server Components",
        description: "Set aside a little time to learn something new.",
        priority: "medium",
        category: "learning",
        dueDate: dayAfter(3),
      },
      {
        title: "Take a screen-free afternoon walk",
        description: "Step outside. Come back with a clearer head.",
        priority: "low",
        category: "personal",
        dueDate: today,
        completed: true,
      },
      {
        title: "Ship the API documentation",
        description: "Document endpoints, examples, and the database schema.",
        priority: "high",
        category: "work",
        dueDate: dayAfter(1),
        completed: true,
      },
    ];
    try {
      for (const input of examples.reverse()) await save(input);
      setToast("A few ideas to get you started. Make them yours.");
    } catch (error) {
      setToast((error as Error).message);
    } finally {
      setSamplesBusy(false);
    }
  }
  return (
    <div className="app-shell">
      {mobileNav && (
        <button
          className="nav-scrim"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className={`sidebar ${mobileNav ? "is-open" : ""}`}>
        <a href="/" className="brand" aria-label="Taskflow home">
          <span className="brand-mark">
            <CheckCheck size={22} strokeWidth={2.6} />
          </span>
          taskflow<span className="brand-period">.</span>
        </a>
        <div className="workspace-label">
          <span className="workspace-avatar">Y</span>
          <div>
            Your workspace<small>A little space to get things done</small>
          </div>
        </div>
        <span className="nav-caption">WORKSPACE</span>
        <nav aria-label="Task navigation">
          {(
            [
              { key: "all", icon: LayoutGrid },
              { key: "today", icon: Sun },
              { key: "upcoming", icon: CalendarDays },
              { key: "completed", icon: CircleCheck },
            ] as const
          ).map(({ key, icon: Icon }) => (
            <button
              key={key}
              className={`nav-item ${view === key && category === "all" ? "active" : ""}`}
              onClick={() => navigate(key)}
            >
              <Icon size={18} />
              <span>{names[key]}</span>
              <span className="nav-count">{counts[key]}</span>
            </button>
          ))}
        </nav>
        <span className="nav-caption category-caption">MY CATEGORIES</span>
        <nav aria-label="Categories">
          {(["work", "personal", "learning"] as const).map((item) => (
            <button
              key={item}
              className={`nav-item ${category === item ? "active" : ""}`}
              onClick={() => navigate("all", item)}
            >
              <span className={`category-dot ${item}`} />
              <span className="capitalize">{item}</span>
              <span className="category-count">
                {tasks.filter((task) => task.category === item).length}
              </span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="small-wins">
            <span className="small-wins-icon">
              <Sparkles size={22} />
            </span>
            <h3>Small steps. Big things.</h3>
            <p>
              You don’t have to do it all today.
              <br />
              Just take the next step.
            </p>
            <span className="small-wins-line" />
          </div>
          <button
            className="nav-item help-button"
            onClick={() => {
              setHelp(true);
              setMobileNav(false);
            }}
          >
            <CircleHelp size={17} />A little help
            <ArrowUpRight size={14} />
          </button>
          <div className="sidebar-signoff">
            MADE FOR A CLEARER MIND <span>✳</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb-home">Your workspace</span>
            <ChevronRight size={14} />
            <strong>My tasks</strong>
          </div>
          <div className="topbar-right">
            <span className="top-date" suppressHydrationWarning>
              {new Date().toLocaleDateString("en", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="top-divider" />
            <span className="profile-avatar" title="Your personal workspace">
              Y
            </span>
          </div>
        </header>
        <main className="workspace-main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span />A FRESH SPACE FOR A FOCUSED DAY
              </div>
              <h1>
                Make today count<span>.</span>
              </h1>
              <p>A little less overwhelm. A little more progress.</p>
            </div>
            <button
              className="button primary new-task"
              onClick={() => setDialog({ task: null })}
            >
              <Plus size={18} />
              New task<span className="keyboard-key">N</span>
            </button>
          </div>
          <section className="stats-grid" aria-label="Task overview">
            <div className="stat-card">
              <div>
                <span className="stat-label">Total tasks</span>
                <div className="stat-number">
                  {tasks.length}
                  <span>ideas in motion</span>
                </div>
              </div>
              <span className="stat-icon violet">
                <Layers size={21} />
              </span>
              <div className="stat-decoration">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="stat-card">
              <div>
                <span className="stat-label">In progress</span>
                <div className="stat-number">
                  {tasks.length - completed}
                  <span>one step at a time</span>
                </div>
              </div>
              <span className="stat-icon amber">
                <Flag size={20} />
              </span>
              <div className="stat-decoration amber-bars">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="stat-card">
              <div>
                <span className="stat-label">Completed</span>
                <div className="stat-number">
                  {completed}
                  <span>little wins, well earned</span>
                </div>
              </div>
              <span className="stat-icon green">
                <CheckCheck size={22} />
              </span>
              <div className="stat-decoration green-bars">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          </section>
          <div className="content-grid">
            <section className="tasks-section" aria-labelledby="tasks-title">
              <div className="section-heading">
                <h2 id="tasks-title">
                  {category === "all"
                    ? "My tasks"
                    : `${category[0].toUpperCase()}${category.slice(1)} tasks`}
                  <span>
                    {category === "all"
                      ? tasks.length
                      : tasks.filter((task) => task.category === category)
                          .length}
                  </span>
                </h2>
                <span className="section-note">A plan for what’s next</span>
              </div>
              <div
                className="task-tabs"
                role="tablist"
                aria-label="Filter tasks"
              >
                {(["all", "today", "upcoming", "completed"] as const).map(
                  (item) => (
                    <button
                      role="tab"
                      id={`filter-${item}`}
                      aria-controls="task-results"
                      tabIndex={view === item ? 0 : -1}
                      onKeyDown={(event) => {
                        const views: View[] = [
                          "all",
                          "today",
                          "upcoming",
                          "completed",
                        ];
                        const index = views.indexOf(item);
                        let next: View | undefined;
                        if (event.key === "ArrowRight")
                          next = views[(index + 1) % 4];
                        if (event.key === "ArrowLeft")
                          next = views[(index + 3) % 4];
                        if (event.key === "Home") next = "all";
                        if (event.key === "End") next = "completed";
                        if (next) {
                          event.preventDefault();
                          setView(next);
                          document.getElementById(`filter-${next}`)?.focus();
                        }
                      }}
                      aria-selected={view === item}
                      className={view === item ? "selected" : ""}
                      key={item}
                      onClick={() => setView(item)}
                    >
                      {names[item]}
                      {item === "all" && <span>{tasks.length}</span>}
                    </button>
                  ),
                )}
              </div>
              <div className="list-toolbar">
                <div className="search-input">
                  <Search size={16} />
                  <input
                    id="task-search"
                    aria-label="Search tasks"
                    placeholder="Find a task…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  {search ? (
                    <button
                      className="icon-button"
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      <X size={13} />
                    </button>
                  ) : (
                    <kbd>
                      <Command size={10} />K
                    </kbd>
                  )}
                </div>
                <label className="sort-control">
                  <ArrowDownUp size={14} />
                  <span className="sr-only">Sort tasks</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="priority">Priority</option>
                    <option value="due">Due date</option>
                  </select>
                </label>
              </div>
              <div
                className="task-list"
                id="task-results"
                role="tabpanel"
                aria-labelledby={`filter-${view}`}
              >
                {loading ? (
                  <div className="empty-state">
                    <LoaderCircle className="spin" size={28} />
                    <h3>A moment of calm…</h3>
                    <p>Getting your tasks ready.</p>
                  </div>
                ) : error ? (
                  <div className="empty-state" role="alert">
                    <CircleHelp size={30} />
                    <h3>Couldn’t load your tasks</h3>
                    <p>{error}</p>
                    <button className="button secondary" onClick={load}>
                      Try again
                    </button>
                  </div>
                ) : filtered.length ? (
                  filtered.map((task) => (
                    <article
                      className={`task-row ${task.completed ? "is-complete" : ""}`}
                      key={task.id}
                    >
                      <button
                        className="task-checkbox"
                        aria-label={`${task.completed ? "Mark incomplete" : "Complete"}: ${task.title}`}
                        aria-pressed={task.completed}
                        disabled={busy.includes(task.id)}
                        onClick={() => toggle(task)}
                      >
                        {busy.includes(task.id) ? (
                          <LoaderCircle size={14} className="spin" />
                        ) : task.completed ? (
                          <Check size={14} strokeWidth={3} />
                        ) : null}
                      </button>
                      <div className="task-content">
                        <div className="task-title-line">
                          <button
                            className="task-title"
                            onClick={() => setDialog({ task })}
                          >
                            {task.title}
                          </button>
                          {task.sourceUrl && (
                            <a
                              href={task.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="task-source"
                              aria-label="View source GitHub issue"
                            >
                              <Github size={13} />
                            </a>
                          )}
                        </div>
                        {task.description && (
                          <p className="task-description">{task.description}</p>
                        )}
                        <div className="task-details">
                          <span className={`category-tag ${task.category}`}>
                            <span />
                            {task.category}
                          </span>
                          <DueDate value={task.dueDate} done={task.completed} />
                        </div>
                      </div>
                      <div className={`priority-badge ${task.priority}`}>
                        <span />
                        {task.priority}
                      </div>
                      <div className="task-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit: ${task.title}`}
                          onClick={() => setDialog({ task })}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="icon-button delete-button"
                          aria-label={`Delete: ${task.title}`}
                          onClick={() => setDeleting(task)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <ListTodo size={30} />
                    </div>
                    <h3>
                      {tasks.length
                        ? "A little breathing room."
                        : "Good things start with one task."}
                    </h3>
                    <p>
                      {search
                        ? "No tasks match your search. Try a different word."
                        : tasks.length
                          ? "No tasks here just yet. You’re making space for what’s next."
                          : "A big idea or a small reminder — give it a home."}
                    </p>
                    <button
                      className="button secondary"
                      onClick={() => setDialog({ task: null })}
                    >
                      <Plus size={16} />
                      {tasks.length ? "Add a task" : "Add your first task"}
                    </button>
                    {!tasks.length && (
                      <button
                        className="text-button sample-button"
                        onClick={samples}
                        disabled={samplesBusy}
                      >
                        {samplesBusy ? (
                          <LoaderCircle size={14} className="spin" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        Try a few sample tasks
                      </button>
                    )}
                  </div>
                )}
                {!loading && !error && filtered.length > 0 && (
                  <button
                    className="inline-add"
                    onClick={() => setDialog({ task: null })}
                  >
                    <Plus size={16} />
                    Add a new task<span>One more small step</span>
                  </button>
                )}
              </div>
              <div className="list-footer">
                <span>
                  {filtered.length} {filtered.length === 1 ? "task" : "tasks"}
                  {search && " found"}
                </span>
                <span>
                  <span className="tiny-dot" />
                  {loading
                    ? "Connecting…"
                    : error
                      ? "Connection interrupted"
                      : "Your changes are saved"}
                </span>
              </div>
              <div className="gentle-reminder">
                <span>
                  <Sun size={19} />
                </span>
                <p>
                  <strong>Progress has its own pace.</strong> A finished task is
                  a win, however small.
                </p>
              </div>
            </section>
            <aside className="right-column">
              <GitHubPanel
                tasks={tasks}
                onImport={async (issue) => {
                  await save({
                    title: issue.title.slice(0, 160),
                    description: `Imported from GitHub issue #${issue.number}.`,
                    priority: "medium",
                    category: "work",
                    sourceUrl: issue.url,
                  });
                }}
              />
              <section className="progress-card">
                <div>
                  <h3>Your little wins</h3>
                  <Sparkles size={17} />
                </div>
                <p>Every checkmark is a step forward.</p>
                <div className="progress-values">
                  <strong>
                    {progress}
                    <span>%</span>
                  </strong>
                  <span>
                    {completed} of {tasks.length} complete
                  </span>
                </div>
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label="Tasks completed"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${progress}%` }} />
                </div>
                <p className="progress-message">
                  {progress === 100 && tasks.length
                    ? "Look at you. All done for now!"
                    : "Keep going. You’re building momentum."}
                  <ArrowUpRight size={14} />
                </p>
              </section>
            </aside>
          </div>
          <footer className="page-footer">
            <span>A little focus goes a long way.</span>
            <span>
              thoughtfully simple <span className="footer-flower">✳</span>{" "}
              taskflow
            </span>
          </footer>
        </main>
      </div>
      {dialog && (
        <TaskDialog
          task={dialog.task}
          onClose={() => setDialog(null)}
          onSave={save}
        />
      )}
      {deleting && (
        <ConfirmDelete
          task={deleting}
          onClose={() => setDeleting(null)}
          onDelete={async () => {
            await api(`/api/tasks/${deleting.id}`, { method: "DELETE" });
            setTasks((previous) =>
              previous.filter((task) => task.id !== deleting.id),
            );
            setToast("Task deleted. A little more breathing room.");
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={15} />
          </span>
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {help && (
        <dialog
          ref={helpRef}
          className="task-dialog small-dialog"
          aria-labelledby="help-title"
          onCancel={() => setHelp(false)}
        >
          <div className="dialog-heading">
            <div className="dialog-icon">
              <CircleHelp size={23} />
            </div>
            <button
              className="icon-button"
              aria-label="Close help"
              onClick={() => setHelp(false)}
            >
              <X size={20} />
            </button>
          </div>
          <h2 id="help-title">A calmer way to get things done.</h2>
          <p className="muted">
            Add a task, give it a category, and take it one step at a time.
            Click a title to edit it, or the circle to celebrate a little win.
          </p>
          <div className="help-shortcuts">
            <span>
              New task<kbd>N</kbd>
            </span>
            <span>
              Find a task<kbd>⌘ / Ctrl K</kbd>
            </span>
            <span>
              Close a dialog<kbd>Esc</kbd>
            </span>
          </div>
          <p className="muted">
            The GitHub panel reads public repositories. Use the + next to an
            issue to save it to your tasks. Your tasks are stored in the
            database and stay here when you return.
          </p>
          <button
            className="button primary help-done"
            onClick={() => setHelp(false)}
          >
            Got it
            <ArrowRight size={16} />
          </button>
        </dialog>
      )}
    </div>
  );
}

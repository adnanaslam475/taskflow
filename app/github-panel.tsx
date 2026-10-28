"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleDot,
  LoaderCircle,
  Plus,
  RefreshCw,
  Star,
} from "lucide-react";
import type { GitHubData } from "@/lib/github";
import Github from "./github-icon";
import type { Task } from "@/lib/task-validation";
import { api } from "@/lib/api-client";

export default function GitHubPanel({
  tasks,
  onImport,
}: {
  tasks: Task[];
  onImport: (issue: GitHubData["issues"][number]) => Promise<void>;
}) {
  const [draft, setDraft] = useState("facebook/react");
  const [repo, setRepo] = useState("facebook/react");
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<GitHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState<number | null>(null);
  const [importError, setImportError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    api<GitHubData>(`/api/github?repo=${encodeURIComponent(repo)}`, {
      signal: controller.signal,
    })
      .then(setData)
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [repo, revision]);
  return (
    <section
      className="github-card"
      id="github-panel"
      aria-labelledby="github-title"
    >
      <div className="github-card-top">
        <div className="github-logo">
          <Github size={23} />
        </div>
        <span className="live-badge">
          <span />
          Live integration
        </span>
      </div>
      <h2 id="github-title">From issue to action.</h2>
      <p className="muted">
        Bring a little open source into your day. Turn a GitHub issue into your
        next task.
      </p>
      <form
        className="repo-form"
        onSubmit={(event) => {
          event.preventDefault();
          setRepo(draft.trim());
          setRevision((value) => value + 1);
        }}
      >
        <label className="field-caption" htmlFor="repository">
          PUBLIC REPOSITORY
        </label>
        <div className="repo-input">
          <Github size={16} />
          <input
            id="repository"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            required
            maxLength={140}
            placeholder="owner/repository"
            spellCheck={false}
          />
          <button
            aria-label="Load repository"
            title="Load repository"
            disabled={loading}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
      {loading ? (
        <div className="github-loading" role="status">
          <LoaderCircle className="spin" size={22} />
          <p>Finding your next contribution…</p>
        </div>
      ) : error ? (
        <div className="integration-error" role="alert">
          <p>{error}</p>
          <button
            className="text-button"
            onClick={() => setRevision((value) => value + 1)}
          >
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      ) : (
        data && (
          <>
            <div className="repo-meta">
              <a href={data.repository.url} target="_blank" rel="noreferrer">
                {data.repository.name}
                <ArrowUpRight size={13} />
              </a>
              <span>
                <Star size={13} />
                {Intl.NumberFormat("en", { notation: "compact" }).format(
                  data.repository.stars,
                )}
              </span>
            </div>
            <div className="issues-caption">
              <span>RECENT OPEN ISSUES</span>
              <span>{data.issues.length} shown</span>
            </div>
            <div className="issue-list">
              {data.issues.map((issue) => {
                const imported = tasks.some(
                  (task) => task.sourceUrl === issue.url,
                );
                return (
                  <div className="issue" key={issue.number}>
                    <CircleDot size={16} className="issue-status" />
                    <div>
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noreferrer"
                        className="issue-title"
                      >
                        {issue.title}
                      </a>
                      <span className="issue-number">
                        #{issue.number}
                        {issue.labels[0] && (
                          <span className="issue-label">
                            {issue.labels[0].name}
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      className={`issue-add ${imported ? "imported" : ""}`}
                      aria-label={
                        imported
                          ? `Issue ${issue.number} added`
                          : `Add issue ${issue.number} as task`
                      }
                      title={imported ? "Added to your tasks" : "Add as task"}
                      disabled={imported || importing !== null}
                      onClick={async () => {
                        setImporting(issue.number);
                        setImportError("");
                        try {
                          await onImport(issue);
                        } catch (error) {
                          setImportError((error as Error).message);
                        } finally {
                          setImporting(null);
                        }
                      }}
                    >
                      {importing === issue.number ? (
                        <LoaderCircle className="spin" size={15} />
                      ) : imported ? (
                        <Check size={15} />
                      ) : (
                        <Plus size={15} />
                      )}
                    </button>
                  </div>
                );
              })}
              {data.issues.length === 0 && (
                <p className="no-issues">
                  All caught up. No open issues in the latest results.
                </p>
              )}
            </div>
            {importError && (
              <p className="form-error" role="alert">
                {importError}
              </p>
            )}
            <div className="github-footer">
              <span>
                <span className="tiny-dot" />
                Updated{" "}
                {new Date(data.fetchedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <button
                className="icon-button"
                aria-label="Refresh GitHub issues"
                onClick={() => setRevision((value) => value + 1)}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </>
        )
      )}
      <a
        className="github-attribution"
        href="https://docs.github.com/en/rest/issues/issues#list-repository-issues"
        target="_blank"
        rel="noreferrer"
      >
        Powered by the GitHub REST API <ArrowUpRight size={12} />
      </a>
    </section>
  );
}

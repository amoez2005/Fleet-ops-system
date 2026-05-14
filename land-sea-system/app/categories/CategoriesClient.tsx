"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import DashboardHomeLink from "@/components/DashboardHomeLink";
import EditorJumpButton from "@/components/EditorJumpButton";
import { readApiJson, reloadAfterMutation } from "@/lib/client-response";
import { formatUtcDateTime } from "@/lib/format";
import {
  errorStyle,
  inputStyle,
  noteStyle,
  pageHeaderStyle,
  pageStyle,
  palette,
  panelStyle,
  pageTitleStyle,
  primaryButtonStyle,
  sectionTitleStyle,
  successStyle,
  tableContainerStyle,
  tableHeadRowStyle,
  tableMetaTextStyle,
  tableStyle,
  tdStyle,
  thStyle,
} from "@/lib/ui";

type CategoryItem = {
  id: string;
  name: string;
  description: string;
  assetCount: number;
  createdAt: string;
};

export default function CategoriesClient({
  categories,
  canManage,
}: {
  categories: CategoryItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const editorPanelRef = useRef<HTMLElement | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSubmitting(true);

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
        }),
      });

      const data = await readApiJson<{ error?: string }>(res);

      if (!res.ok) {
        setError(data.error || "Failed to create category.");
        return;
      }

      setName("");
      setDescription("");
      setSuccess("Category created successfully.");
      reloadAfterMutation(router);
    } catch {
      setError("Something went wrong while creating category.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError("");
    setSuccess("");

    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      const res = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
      });

      const data = await readApiJson<{ error?: string }>(res);

      if (!res.ok) {
        setError(data.error || "Failed to delete category.");
        return;
      }

      setSuccess("Category deleted successfully.");
      reloadAfterMutation(router);
    } catch {
      setError("Something went wrong while deleting category.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="landsea-editor-page" style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>Categories</h1>
        </div>

        <DashboardHomeLink />
      </div>

      <div className="landsea-editor-layout landsea-editor-layout--narrow">
        <section ref={editorPanelRef} className="landsea-editor-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>
            {canManage ? "Add Category" : "Category Access"}
          </h2>

          {canManage ? (
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Truck"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </div>

              {error ? (
                <div style={errorStyle}>{error}</div>
              ) : null}

              {success ? (
                <div style={successStyle}>{success}</div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                style={primaryButtonStyle}
              >
                {submitting ? "Creating..." : "Create Category"}
              </button>
            </form>
          ) : (
            <div style={noteStyle}>
              Your role can review categories, but only operations managers and
              super admins can create or delete them.
            </div>
          )}
        </section>

        <section className="landsea-list-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>Category List</h2>

          <div className="landsea-list-scroll" style={tableContainerStyle}>
            <table
              style={tableStyle}
            >
              <thead>
                <tr style={tableHeadRowStyle}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Assets</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={5}>
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id}>
                      <td style={tdStyle}>{category.name}</td>
                      <td style={tdStyle}>{category.description || "-"}</td>
                      <td style={tdStyle}>{category.assetCount}</td>
                      <td style={tdStyle}>
                        <span style={tableMetaTextStyle}>
                          {formatUtcDateTime(category.createdAt)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {canManage ? (
                          <button
                            onClick={() => handleDelete(category.id)}
                            disabled={
                              deletingId === category.id || category.assetCount > 0
                            }
                            style={{
                              ...primaryButtonStyle,
                              width: "auto",
                              padding: "8px 12px",
                              background:
                                category.assetCount > 0
                                  ? palette.softSurfaceAlt
                                  : palette.spicyPaprika,
                              border:
                                category.assetCount > 0
                                  ? `1px solid ${palette.border}`
                                  : `1px solid ${palette.accentBorder}`,
                              color:
                                category.assetCount > 0
                                  ? palette.mutedText
                                  : palette.floralWhite,
                              cursor:
                                category.assetCount > 0 ? "not-allowed" : "pointer",
                              opacity: deletingId === category.id ? 0.7 : 1,
                            }}
                            title={
                              category.assetCount > 0
                                ? "Cannot delete category with linked assets."
                                : "Delete category"
                            }
                          >
                            {deletingId === category.id ? "Deleting..." : "Delete"}
                          </button>
                        ) : (
                          <span style={tableMetaTextStyle}>View only</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p style={noteStyle}>
            {canManage
              ? "Note: Categories with linked assets cannot be deleted."
              : "You have read-only access to category records."}
          </p>
        </section>
      </div>

      {canManage ? (
        <EditorJumpButton
          targetRef={editorPanelRef}
          label="Jump to category form"
        />
      ) : null}
    </main>
  );
}

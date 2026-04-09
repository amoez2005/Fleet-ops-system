"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import DashboardHomeLink from "@/components/DashboardHomeLink";
import EditorJumpButton from "@/components/EditorJumpButton";
import { focusEditorPanel } from "@/lib/editor";
import { formatUtcDateTime } from "@/lib/format";
import {
  actionsWrapStyle,
  dangerButtonStyle,
  errorStyle,
  inputStyle,
  miniButtonStyle,
  noteStyle,
  optionStyle,
  pageHeaderStyle,
  pageStyle,
  palette,
  panelStyle,
  pageTitleStyle,
  primaryButtonStyle,
  readOnlyBoxStyle,
  secondaryButtonStyle,
  sectionTitleStyle,
  successStyle,
  tableContainerStyle,
  tableHeadRowStyle,
  tableMetaTextStyle,
  tableStyle,
  tdStyle,
  thStyle,
  warningTextStyle,
} from "@/lib/ui";

type RevenueItem = {
  id: string;
  grossAmount: string;
  deductions: string;
  netAmount: string;
  revenueDate: string;
  revenueCategory: string;
  notes: string;
  assignmentId: string;
  assignmentTitle: string;
  clientName: string;
};

type AssignmentOption = {
  id: string;
  title: string;
  clientName: string;
  startDate: string;
  status: string;
};

export default function RevenuesClient({
  revenues,
  assignments,
  revenueCategories = [],
}: {
  revenues: RevenueItem[];
  assignments: AssignmentOption[];
  revenueCategories?: string[];
}) {
  const router = useRouter();
  const editorPanelRef = useRef<HTMLElement | null>(null);
  const defaultAssignmentId = assignments[0]?.id ?? "";

  const [assignmentId, setAssignmentId] = useState(defaultAssignmentId);
  const [revenueDate, setRevenueDate] = useState("");
  const [grossAmount, setGrossAmount] = useState("");
  const [deductions, setDeductions] = useState("0");
  const [revenueCategory, setRevenueCategory] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function resetForm() {
    setAssignmentId(defaultAssignmentId);
    setRevenueDate("");
    setGrossAmount("");
    setDeductions("0");
    setRevenueCategory("");
    setNotes("");
    setEditingId("");
  }

  function startEdit(revenue: RevenueItem) {
    setError("");
    setSuccess("");
    setEditingId(revenue.id);
    setAssignmentId(revenue.assignmentId);
    setRevenueDate(toDateTimeInputValue(revenue.revenueDate));
    setGrossAmount(revenue.grossAmount);
    setDeductions(revenue.deductions);
    setRevenueCategory(revenue.revenueCategory);
    setNotes(revenue.notes);
    focusEditorPanel(editorPanelRef.current);
  }

  function cancelEdit() {
    setError("");
    setSuccess("");
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSubmitting(true);

      const res = await fetch(
        editingId ? `/api/revenues?id=${editingId}` : "/api/revenues",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignmentId,
            revenueDate: toUtcIsoString(revenueDate),
            grossAmount,
            deductions,
            revenueCategory,
            notes,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save revenue.");
        return;
      }

      resetForm();
      setSuccess(
        editingId ? "Revenue updated successfully." : "Revenue created successfully."
      );
      router.refresh();
    } catch {
      setError(
        editingId
          ? "Something went wrong while updating revenue."
          : "Something went wrong while creating revenue."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError("");
    setSuccess("");

    const confirmed = window.confirm(
      "Are you sure you want to delete this revenue record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      const res = await fetch(`/api/revenues?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete revenue.");
        return;
      }

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Revenue deleted successfully.");
      router.refresh();
    } catch {
      setError("Something went wrong while deleting revenue.");
    } finally {
      setDeletingId("");
    }
  }

  const netPreview = getNetPreview(grossAmount, deductions);

  return (
    <main className="landsea-editor-page" style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>Revenues</h1>
        </div>

        <DashboardHomeLink />
      </div>

      <div className="landsea-editor-layout">
        <section ref={editorPanelRef} className="landsea-editor-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>
            {editingId ? "Edit Revenue" : "Add Revenue"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Assignment
              </label>
              <select
                value={assignmentId}
                onChange={(e) => setAssignmentId(e.target.value)}
                required
                style={inputStyle}
              >
                {assignments.map((assignment) => (
                  <option
                    key={assignment.id}
                    value={assignment.id}
                    style={optionStyle}
                  >
                    {(assignment.title || "Untitled Assignment")} - {assignment.clientName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Revenue Date (UTC)
              </label>
              <input
                type="datetime-local"
                value={revenueDate}
                onChange={(e) => setRevenueDate(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div className="landsea-form-grid-2">
              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Gross Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(e.target.value)}
                  required
                  placeholder="e.g. 150000"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Deductions
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  placeholder="e.g. 10000"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Net Amount
              </label>
              <div style={readOnlyBoxStyle}>{netPreview}</div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Revenue Category
              </label>
              <select
                value={revenueCategory}
                onChange={(e) => setRevenueCategory(e.target.value)}
                style={inputStyle}
              >
                <option value="" style={optionStyle}>
                  No category
                </option>
                {revenueCategories.map((category) => (
                  <option
                    key={category}
                    value={category}
                    style={optionStyle}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Optional notes"
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            {error ? <div style={errorStyle}>{error}</div> : null}
            {success ? <div style={successStyle}>{success}</div> : null}

            <div className="landsea-form-grid-actions">
              <button
                type="submit"
                disabled={submitting || assignments.length === 0}
                style={{
                  ...primaryButtonStyle,
                  opacity: submitting || assignments.length === 0 ? 0.8 : 1,
                }}
              >
                {submitting
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                    ? "Update Revenue"
                    : "Create Revenue"}
              </button>

              {editingId ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={secondaryButtonStyle}
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>

          {assignments.length === 0 ? (
            <p style={warningTextStyle}>
              You need at least one assignment before adding revenue.
            </p>
          ) : null}
        </section>

        <section className="landsea-list-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>Revenue List</h2>

          <div className="landsea-list-scroll" style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeadRowStyle}>
                  <th style={thStyle}>Revenue Date</th>
                  <th style={thStyle}>Assignment</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Gross</th>
                  <th style={thStyle}>Deductions</th>
                  <th style={thStyle}>Net</th>
                  <th style={thStyle}>Notes</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {revenues.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={9}>
                      No revenue records found.
                    </td>
                  </tr>
                ) : (
                  revenues.map((revenue) => (
                    <tr key={revenue.id}>
                      <td style={tdStyle}>
                        <span style={tableMetaTextStyle}>
                          {formatUtcDateTime(revenue.revenueDate)}
                        </span>
                      </td>
                      <td style={tdStyle}>{revenue.assignmentTitle || "-"}</td>
                      <td style={tdStyle}>{revenue.clientName}</td>
                      <td style={tdStyle}>{revenue.revenueCategory || "-"}</td>
                      <td style={tdStyle}>{revenue.grossAmount}</td>
                      <td style={tdStyle}>{revenue.deductions}</td>
                      <td style={tdStyle}>{revenue.netAmount}</td>
                      <td style={tdStyle}>{revenue.notes || "-"}</td>
                      <td style={tdStyle}>
                        <div style={actionsWrapStyle}>
                          <button
                            onClick={() => startEdit(revenue)}
                            disabled={submitting || deletingId === revenue.id}
                            style={{
                              ...miniButtonStyle,
                              background:
                                editingId === revenue.id
                                  ? palette.softSurfaceAlt
                                  : miniButtonStyle.background,
                              opacity: submitting || deletingId === revenue.id ? 0.7 : 1,
                            }}
                          >
                            {editingId === revenue.id ? "Editing..." : "Edit"}
                          </button>

                          <Link
                            href={`/revenues/print/${revenue.id}`}
                            target="_blank"
                            rel="noreferrer"
                            style={printLinkStyle}
                          >
                            Print
                          </Link>

                          <Link
                            href={`/api/revenues/pdf?id=${revenue.id}`}
                            target="_blank"
                            rel="noreferrer"
                            style={printLinkStyle}
                          >
                            PDF
                          </Link>

                          <button
                            onClick={() => handleDelete(revenue.id)}
                            disabled={deletingId === revenue.id}
                            style={{
                              ...dangerButtonStyle,
                              opacity: deletingId === revenue.id ? 0.7 : 1,
                            }}
                          >
                            {deletingId === revenue.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p style={noteStyle}>
            Note: Revenue records can be edited, deleted, printed, and exported
            to PDF from here.
          </p>
        </section>
      </div>

      <EditorJumpButton targetRef={editorPanelRef} label="Jump to revenue form" />
    </main>
  );
}

function toDateTimeInputValue(isoString: string) {
  if (!isoString) {
    return "";
  }

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toUtcIsoString(value: string) {
  if (!value) {
    return "";
  }

  return `${value}:00.000Z`;
}

function getNetPreview(grossAmount: string, deductions: string) {
  const gross = Number(grossAmount || "0");
  const deductionValue = Number(deductions || "0");

  if (Number.isNaN(gross) || Number.isNaN(deductionValue)) {
    return "-";
  }

  const net = gross - deductionValue;

  if (net < 0) {
    return "Net cannot be negative";
  }

  return net.toFixed(2);
}

const printLinkStyle: React.CSSProperties = {
  ...miniButtonStyle,
};

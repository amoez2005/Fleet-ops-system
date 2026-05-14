"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import DashboardHomeLink from "@/components/DashboardHomeLink";
import EditorJumpButton from "@/components/EditorJumpButton";
import { readApiJson, reloadAfterMutation } from "@/lib/client-response";
import { focusEditorPanel } from "@/lib/editor";
import { formatUtcDateTime } from "@/lib/format";
import {
  actionsWrapStyle,
  dangerButtonStyle,
  errorStyle,
  inputStyle,
  miniButtonStyle,
  noteStyle,
  pageHeaderStyle,
  pageStyle,
  panelStyle,
  pageTitleStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  sectionTitleStyle,
  successStyle,
  tableContainerStyle,
  tableHeadRowStyle,
  tableMetaTextStyle,
  tableStyle,
  tdStyle,
  thStyle,
} from "@/lib/ui";

type SalaryItem = {
  id: string;
  employeeName: string;
  roleTitle: string;
  salaryMonth: string;
  amount: string;
  paymentDate: string;
  notes: string;
};

export default function SalariesClient({
  salaryRecords,
}: {
  salaryRecords: SalaryItem[];
}) {
  const router = useRouter();
  const editorPanelRef = useRef<HTMLElement | null>(null);

  const [employeeName, setEmployeeName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [salaryMonth, setSalaryMonth] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function resetForm() {
    setEmployeeName("");
    setRoleTitle("");
    setSalaryMonth("");
    setAmount("");
    setPaymentDate("");
    setNotes("");
    setEditingId("");
  }

  function startEdit(record: SalaryItem) {
    setError("");
    setSuccess("");
    setEditingId(record.id);
    setEmployeeName(record.employeeName);
    setRoleTitle(record.roleTitle);
    setSalaryMonth(toMonthInputValue(record.salaryMonth));
    setAmount(record.amount);
    setPaymentDate(toDateTimeInputValue(record.paymentDate));
    setNotes(record.notes);
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
        editingId ? `/api/salaries?id=${editingId}` : "/api/salaries",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeName,
            roleTitle,
            salaryMonth: toMonthIsoString(salaryMonth),
            amount,
            paymentDate: paymentDate ? toUtcIsoString(paymentDate) : "",
            notes,
          }),
        }
      );

      const data = await readApiJson<{ error?: string }>(res);

      if (!res.ok) {
        setError(data.error || "Failed to save salary record.");
        return;
      }

      resetForm();
      setSuccess(
        editingId
          ? "Salary record updated successfully."
          : "Salary record created successfully."
      );
      reloadAfterMutation(router);
    } catch {
      setError(
        editingId
          ? "Something went wrong while updating salary record."
          : "Something went wrong while creating salary record."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError("");
    setSuccess("");

    const confirmed = window.confirm(
      "Are you sure you want to delete this salary record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      const res = await fetch(`/api/salaries?id=${id}`, {
        method: "DELETE",
      });

      const data = await readApiJson<{ error?: string }>(res);

      if (!res.ok) {
        setError(data.error || "Failed to delete salary record.");
        return;
      }

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Salary record deleted successfully.");
      reloadAfterMutation(router);
    } catch {
      setError("Something went wrong while deleting salary record.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="landsea-editor-page" style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>Salary Records</h1>
        </div>

        <DashboardHomeLink />
      </div>

      <div className="landsea-editor-layout">
        <section ref={editorPanelRef} className="landsea-editor-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>
            {editingId ? "Edit Salary Record" : "Add Salary Record"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Employee Name
              </label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                required
                placeholder="e.g. Operations Supervisor"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Role Title
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Optional"
                style={inputStyle}
              />
            </div>

            <div className="landsea-form-grid-2">
              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Salary Month
                </label>
                <input
                  type="month"
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="e.g. 85000"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Payment Date (UTC)
              </label>
              <input
                type="datetime-local"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                style={inputStyle}
              />
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
                disabled={submitting}
                style={primaryButtonStyle}
              >
                {submitting
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                    ? "Update Salary Record"
                    : "Create Salary Record"}
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
        </section>

        <section className="landsea-list-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>Salary List</h2>

          <div className="landsea-list-scroll" style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeadRowStyle}>
                  <th style={thStyle}>Employee</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Salary Month</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Payment Date</th>
                  <th style={thStyle}>Notes</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {salaryRecords.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={7}>
                      No salary records found.
                    </td>
                  </tr>
                ) : (
                  salaryRecords.map((record) => (
                    <tr key={record.id}>
                      <td style={tdStyle}>{record.employeeName}</td>
                      <td style={tdStyle}>{record.roleTitle || "-"}</td>
                      <td style={tdStyle}>
                        <span style={tableMetaTextStyle}>
                          {formatSalaryMonth(record.salaryMonth)}
                        </span>
                      </td>
                      <td style={tdStyle}>{record.amount}</td>
                      <td style={tdStyle}>
                        <span style={tableMetaTextStyle}>
                          {record.paymentDate
                            ? formatUtcDateTime(record.paymentDate)
                            : "-"}
                        </span>
                      </td>
                      <td style={tdStyle}>{record.notes || "-"}</td>
                      <td style={tdStyle}>
                        <div style={actionsWrapStyle}>
                          <button
                            onClick={() => startEdit(record)}
                            disabled={submitting || deletingId === record.id}
                            style={miniButtonStyle}
                          >
                            {editingId === record.id ? "Editing..." : "Edit"}
                          </button>

                          <button
                            onClick={() => handleDelete(record.id)}
                            disabled={deletingId === record.id}
                            style={dangerButtonStyle}
                          >
                            {deletingId === record.id ? "Deleting..." : "Delete"}
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
            Note: Salary records can be edited or deleted from here.
          </p>
        </section>
      </div>

      <EditorJumpButton targetRef={editorPanelRef} label="Jump to salary form" />
    </main>
  );
}

function toMonthInputValue(isoString: string) {
  if (!isoString) {
    return "";
  }

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function toMonthIsoString(value: string) {
  if (!value) {
    return "";
  }

  return `${value}-01T00:00:00.000Z`;
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

function formatSalaryMonth(isoString: string) {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

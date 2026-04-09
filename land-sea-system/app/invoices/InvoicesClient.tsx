"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DashboardHomeLink from "@/components/DashboardHomeLink";
import EditorJumpButton from "@/components/EditorJumpButton";
import { focusEditorPanel } from "@/lib/editor";
import { formatUtcDateTime } from "@/lib/format";
import {
  actionsWrapStyle,
  dangerButtonStyle,
  errorStyle,
  getStatusBadgeStyle,
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
  selectionBoxStyle,
  successStyle,
  tableContainerStyle,
  tableHeadRowStyle,
  tableMetaTextStyle,
  tableStyle,
  tdStyle,
  thStyle,
  warningTextStyle,
} from "@/lib/ui";

type InvoiceItem = {
  id: string;
  invoiceNo: string;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  status: string;
  paymentDate: string;
  notes: string;
  clientId: string;
  clientName: string;
  assignmentIds: string[];
  assignmentTitles: string[];
};

type ClientOption = {
  id: string;
  clientCode: string;
  companyName: string;
  status: string;
};

type AssignmentOption = {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  startDate: string;
  status: string;
};

const statuses = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];

export default function InvoicesClient({
  invoices,
  clients,
  assignments,
}: {
  invoices: InvoiceItem[];
  clients: ClientOption[];
  assignments: AssignmentOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorPanelRef = useRef<HTMLElement | null>(null);
  const defaultClientId = clients[0]?.id ?? "";
  const focus = searchParams.get("focus");
  const isOverdueFocus = focus === "overdue";
  const assignmentMap = new Map(
    assignments.map((assignment) => [assignment.id, assignment])
  );

  const [invoiceNo, setInvoiceNo] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [taxAmount, setTaxAmount] = useState("0");
  const [status, setStatus] = useState("DRAFT");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [clientId, setClientId] = useState(defaultClientId);
  const [assignmentIds, setAssignmentIds] = useState<string[]>([]);
  const [assignmentToAddId, setAssignmentToAddId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [generatingInvoiceNo, setGeneratingInvoiceNo] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!editingId && !invoiceNo) {
      void generateNextInvoiceNo();
    }
  }, [editingId, invoiceNo]);

  function resetForm() {
    setInvoiceNo("");
    setIssueDate("");
    setDueDate("");
    setSubtotal("");
    setTaxAmount("0");
    setStatus("DRAFT");
    setPaymentDate("");
    setNotes("");
    setClientId(defaultClientId);
    setAssignmentIds([]);
    setAssignmentToAddId("");
    setEditingId("");
  }

  function startEdit(invoice: InvoiceItem) {
    setError("");
    setSuccess("");
    setEditingId(invoice.id);
    setInvoiceNo(invoice.invoiceNo);
    setIssueDate(toDateTimeInputValue(invoice.issueDate));
    setDueDate(toDateTimeInputValue(invoice.dueDate));
    setSubtotal(invoice.subtotal);
    setTaxAmount(invoice.taxAmount);
    setStatus(invoice.status);
    setPaymentDate(toDateTimeInputValue(invoice.paymentDate));
    setNotes(invoice.notes);
    setClientId(invoice.clientId);
    setAssignmentIds(invoice.assignmentIds);
    setAssignmentToAddId("");
    focusEditorPanel(editorPanelRef.current);
  }

  function cancelEdit() {
    setError("");
    setSuccess("");
    resetForm();
  }

  function handleClientChange(nextClientId: string) {
    setClientId(nextClientId);
    setAssignmentIds((currentAssignmentIds) =>
      currentAssignmentIds.filter(
        (assignmentId) => assignmentMap.get(assignmentId)?.clientId === nextClientId
      )
    );
    setAssignmentToAddId("");
  }

  function handleSelectAssignment(assignmentId: string) {
    if (!assignmentId) {
      return;
    }

    setAssignmentIds((currentAssignmentIds) =>
      currentAssignmentIds.includes(assignmentId)
        ? currentAssignmentIds
        : [...currentAssignmentIds, assignmentId]
    );
    setAssignmentToAddId("");
  }

  function handleRemoveAssignment(assignmentId: string) {
    setAssignmentIds((currentAssignmentIds) =>
      currentAssignmentIds.filter((id) => id !== assignmentId)
    );
  }

  async function generateNextInvoiceNo(nextIssueDate?: string) {
    try {
      setGeneratingInvoiceNo(true);

      const params = new URLSearchParams({
        mode: "next-number",
      });

      if (nextIssueDate) {
        params.set("issueDate", toUtcIsoString(nextIssueDate));
      }

      const res = await fetch(`/api/invoices?${params.toString()}`);

      if (!res.ok) {
        return;
      }

      const data = await res.json();

      if (data.invoiceNo) {
        setInvoiceNo(data.invoiceNo);
      }
    } finally {
      setGeneratingInvoiceNo(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSubmitting(true);

      const res = await fetch(
        editingId ? `/api/invoices?id=${editingId}` : "/api/invoices",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoiceNo,
            issueDate: toUtcIsoString(issueDate),
            dueDate: toUtcIsoString(dueDate),
            subtotal,
            taxAmount,
            status,
            paymentDate: paymentDate ? toUtcIsoString(paymentDate) : "",
            notes,
            clientId,
            assignmentIds,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save invoice.");
        return;
      }

      resetForm();
      setSuccess(
        editingId ? "Invoice updated successfully." : "Invoice created successfully."
      );
      router.refresh();
    } catch {
      setError(
        editingId
          ? "Something went wrong while updating invoice."
          : "Something went wrong while creating invoice."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError("");
    setSuccess("");

    const confirmed = window.confirm(
      "Are you sure you want to delete this invoice?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      const res = await fetch(`/api/invoices?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete invoice.");
        return;
      }

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Invoice deleted successfully.");
      router.refresh();
    } catch {
      setError("Something went wrong while deleting invoice.");
    } finally {
      setDeletingId("");
    }
  }

  const selectedAssignments = assignmentIds
    .map((assignmentId) => assignmentMap.get(assignmentId))
    .filter((assignment): assignment is AssignmentOption => Boolean(assignment));

  const availableAssignments = assignments.filter(
    (assignment) =>
      assignment.clientId === clientId && !assignmentIds.includes(assignment.id)
  );

  const totalPreview = getTotalPreview(subtotal, taxAmount);
  const scopedInvoices = isOverdueFocus
    ? invoices.filter((invoice) => invoice.status === "OVERDUE")
    : invoices;

  return (
    <main className="landsea-editor-page" style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>Invoices</h1>
        </div>

        <DashboardHomeLink />
      </div>

      <div className="landsea-editor-layout landsea-editor-layout--wide">
        <section ref={editorPanelRef} className="landsea-editor-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>
            {editingId ? "Edit Invoice" : "Add Invoice"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Invoice No
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: editingId
                    ? "1fr"
                    : "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                }}
              >
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  required
                  placeholder="e.g. INV-2026-0002"
                  style={inputStyle}
                />

                {!editingId ? (
                  <button
                    type="button"
                    onClick={() => void generateNextInvoiceNo(issueDate)}
                    disabled={generatingInvoiceNo}
                    style={secondaryButtonStyle}
                  >
                    {generatingInvoiceNo ? "Generating..." : "Generate Next"}
                  </button>
                ) : null}
              </div>

              <p style={{ margin: "8px 0 0", color: palette.mutedText, fontSize: "12px" }}>
                Auto-generated by default, but you can still edit it.
              </p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Client
              </label>
              <select
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                required
                style={inputStyle}
              >
                {clients.map((client) => (
                  <option
                    key={client.id}
                    value={client.id}
                    style={optionStyle}
                  >
                    {client.clientCode} - {client.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="landsea-form-grid-2">
              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Issue Date (UTC)
                </label>
                <input
                  type="datetime-local"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Due Date (UTC)
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="landsea-form-grid-2">
              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Subtotal
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                  required
                  placeholder="e.g. 100000"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Tax Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Total Amount
              </label>
              <div style={readOnlyBoxStyle}>{totalPreview}</div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Linked Assignments
              </label>
              <div style={{ marginBottom: "12px" }}>
                <select
                  value={assignmentToAddId}
                  onChange={(e) => handleSelectAssignment(e.target.value)}
                  style={inputStyle}
                >
                  <option value="" style={optionStyle}>
                    {clients.length === 0
                      ? "No client available"
                      : availableAssignments.length === 0
                        ? "No assignments available for selected client"
                        : "Select assignment for invoice"}
                  </option>
                  {availableAssignments.map((assignment) => (
                    <option
                      key={assignment.id}
                      value={assignment.id}
                      style={optionStyle}
                    >
                      {(assignment.title || "Untitled Assignment")} - {assignment.status}
                    </option>
                  ))}
                </select>
              </div>

              <div style={selectionBoxStyle}>
                {selectedAssignments.length === 0 ? (
                  <p style={{ margin: 0, color: palette.mutedText }}>
                    No assignments selected.
                  </p>
                ) : (
                  selectedAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px 0",
                        borderBottom: `1px solid ${palette.border}`,
                      }}
                    >
                      <span>
                        {assignment.title || "Untitled Assignment"} - {assignment.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        style={miniButtonStyle}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="landsea-form-grid-2">
              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={inputStyle}
                >
                  {statuses.map((item) => (
                    <option
                      key={item}
                      value={item}
                      style={optionStyle}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
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
                disabled={submitting || clients.length === 0}
                style={{
                  ...primaryButtonStyle,
                  opacity: submitting || clients.length === 0 ? 0.8 : 1,
                }}
              >
                {submitting
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                    ? "Update Invoice"
                    : "Create Invoice"}
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

          {clients.length === 0 ? (
            <p style={warningTextStyle}>
              You need at least one client before adding invoices.
            </p>
          ) : null}
        </section>

        <section className="landsea-list-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>Invoice List</h2>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <p style={{ margin: 0, color: palette.mutedText, fontSize: "13px" }}>
              Showing {scopedInvoices.length} of {invoices.length} invoices
            </p>

            {isOverdueFocus ? (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    border: `1px solid ${palette.accentBorder}`,
                    background: palette.accentWash,
                    color: palette.carbonBlack,
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  Focused view: Overdue invoices
                </div>

                <Link href="/invoices" style={miniButtonStyle}>
                  Show All
                </Link>
              </div>
            ) : null}
          </div>

          <div className="landsea-list-scroll" style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeadRowStyle}>
                  <th style={thStyle}>Invoice No</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Assignments</th>
                  <th style={thStyle}>Issue Date</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Subtotal</th>
                  <th style={thStyle}>Tax</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>Payment Date</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {scopedInvoices.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={11}>
                      {isOverdueFocus
                        ? "No overdue invoices found."
                        : "No invoices found."}
                    </td>
                  </tr>
                ) : (
                  scopedInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td style={tdStyle}>{invoice.invoiceNo}</td>
                      <td style={tdStyle}>{invoice.clientName}</td>
                      <td style={tdStyle}>
                        {invoice.assignmentTitles.length === 0
                          ? "-"
                          : invoice.assignmentTitles.join(", ")}
                      </td>
                      <td style={tdStyle}>
                        <span style={tableMetaTextStyle}>
                          {formatUtcDateTime(invoice.issueDate)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={tableMetaTextStyle}>
                          {formatUtcDateTime(invoice.dueDate)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={getStatusBadgeStyle(invoice.status)}>
                          {invoice.status}
                        </span>
                      </td>
                      <td style={tdStyle}>{invoice.subtotal}</td>
                      <td style={tdStyle}>{invoice.taxAmount}</td>
                      <td style={tdStyle}>{invoice.totalAmount}</td>
                      <td style={tdStyle}>
                        <span style={tableMetaTextStyle}>
                          {invoice.paymentDate
                            ? formatUtcDateTime(invoice.paymentDate)
                            : "-"}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={actionsWrapStyle}>
                          <button
                            onClick={() => startEdit(invoice)}
                            disabled={submitting || deletingId === invoice.id}
                            style={{
                              ...miniButtonStyle,
                              background:
                                editingId === invoice.id
                                  ? palette.softSurfaceAlt
                                  : miniButtonStyle.background,
                              opacity: submitting || deletingId === invoice.id ? 0.7 : 1,
                            }}
                          >
                            {editingId === invoice.id ? "Editing..." : "Edit"}
                          </button>

                          <Link
                            href={`/invoices/print/${invoice.id}`}
                            target="_blank"
                            rel="noreferrer"
                            style={printLinkStyle}
                          >
                            Print
                          </Link>

                          <Link
                            href={`/api/invoices/pdf?id=${invoice.id}`}
                            style={pdfLinkStyle}
                          >
                            PDF
                          </Link>

                          <button
                            onClick={() => handleDelete(invoice.id)}
                            disabled={deletingId === invoice.id}
                            style={{
                              ...dangerButtonStyle,
                              opacity: deletingId === invoice.id ? 0.7 : 1,
                            }}
                          >
                            {deletingId === invoice.id ? "Deleting..." : "Delete"}
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
            Note: Invoices can be edited, deleted, and printed from here.
          </p>
        </section>
      </div>

      <EditorJumpButton targetRef={editorPanelRef} label="Jump to invoice form" />
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

function getTotalPreview(subtotal: string, taxAmount: string) {
  const subtotalValue = Number(subtotal || "0");
  const taxValue = Number(taxAmount || "0");

  if (Number.isNaN(subtotalValue) || Number.isNaN(taxValue)) {
    return "-";
  }

  return (subtotalValue + taxValue).toFixed(2);
}

const printLinkStyle: React.CSSProperties = {
  ...miniButtonStyle,
};

const pdfLinkStyle: React.CSSProperties = {
  ...miniButtonStyle,
};

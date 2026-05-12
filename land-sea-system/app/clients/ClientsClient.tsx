"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import DashboardHomeLink from "@/components/DashboardHomeLink";
import EditorJumpButton from "@/components/EditorJumpButton";
import { focusEditorPanel } from "@/lib/editor";
import { formatUtcDateTime } from "@/lib/format";
import {
  actionsWrapStyle,
  errorStyle,
  getStatusBadgeStyle,
  infoStackStyle,
  inputStyle,
  noteStyle,
  optionStyle,
  pageHeaderStyle,
  pageStyle,
  palette,
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
  miniButtonStyle,
  dangerButtonStyle,
} from "@/lib/ui";

type ClientItem = {
  id: string;
  clientCode: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  contractNotes: string;
  invoiceTerms: string;
  status: string;
  createdAt: string;
  assignmentCount: number;
  invoiceCount: number;
};

const statuses = ["ACTIVE", "INACTIVE", "HOLD"];

export default function ClientsClient({
  clients,
  canManage,
}: {
  clients: ClientItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const editorPanelRef = useRef<HTMLElement | null>(null);

  const [clientCode, setClientCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [invoiceTerms, setInvoiceTerms] = useState("");
  const [contractNotes, setContractNotes] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function resetForm() {
    setClientCode("");
    setCompanyName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setAddress("");
    setInvoiceTerms("");
    setContractNotes("");
    setStatus("ACTIVE");
    setEditingId("");
  }

  function startEdit(client: ClientItem) {
    setError("");
    setSuccess("");
    setEditingId(client.id);
    setClientCode(client.clientCode);
    setCompanyName(client.companyName);
    setContactPerson(client.contactPerson);
    setPhone(client.phone);
    setEmail(client.email);
    setAddress(client.address);
    setInvoiceTerms(client.invoiceTerms);
    setContractNotes(client.contractNotes);
    setStatus(client.status);
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
        editingId ? `/api/clients?id=${editingId}` : "/api/clients",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientCode,
            companyName,
            contactPerson,
            phone,
            email,
            address,
            invoiceTerms,
            contractNotes,
            status,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save client.");
        return;
      }

      resetForm();
      setSuccess(
        editingId ? "Client updated successfully." : "Client created successfully."
      );
      router.refresh();
    } catch {
      setError(
        editingId
          ? "Something went wrong while updating client."
          : "Something went wrong while creating client."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError("");
    setSuccess("");

    const confirmed = window.confirm(
      "Are you sure you want to delete this client?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      const res = await fetch(`/api/clients?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete client.");
        return;
      }

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Client deleted successfully.");
      router.refresh();
    } catch {
      setError("Something went wrong while deleting client.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="landsea-editor-page" style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>Clients</h1>
        </div>

        <DashboardHomeLink />
      </div>

      <div className="landsea-editor-layout">
        <section ref={editorPanelRef} className="landsea-editor-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>
            {canManage ? (editingId ? "Edit Client" : "Add Client") : "Client Access"}
          </h2>

          {canManage ? (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Client Code
                </label>
                <input
                  type="text"
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value)}
                  required
                  placeholder="e.g. CL-002"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="e.g. XYZ Logistics Ltd."
                  style={inputStyle}
                />
              </div>

              <div className="landsea-form-grid-2">
                <div>
                  <label style={{ display: "block", marginBottom: "8px" }}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Optional"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px" }}>
                    Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Optional"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Optional"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="Optional"
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </div>

              <div className="landsea-form-grid-2">
                <div>
                  <label style={{ display: "block", marginBottom: "8px" }}>
                    Invoice Terms
                  </label>
                  <input
                    type="text"
                    value={invoiceTerms}
                    onChange={(e) => setInvoiceTerms(e.target.value)}
                    placeholder="Optional"
                    style={inputStyle}
                  />
                </div>

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
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Contract Notes
                </label>
                <textarea
                  value={contractNotes}
                  onChange={(e) => setContractNotes(e.target.value)}
                  rows={4}
                  placeholder="Optional"
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
                      ? "Update Client"
                      : "Create Client"}
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
          ) : (
            <div style={noteStyle}>
              Your role can review client records, but only operations managers
              and super admins can create, edit, or delete them.
            </div>
          )}
        </section>

        <section className="landsea-list-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>Client List</h2>

          <div className="landsea-list-scroll" style={tableContainerStyle}>
            <table
              style={tableStyle}
            >
              <thead>
                <tr style={tableHeadRowStyle}>
                  <th style={thStyle}>Client Code</th>
                  <th style={thStyle}>Company Name</th>
                  <th style={thStyle}>Contact Person</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Links</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={9}>
                      No clients found.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id}>
                      <td style={tdStyle}>{client.clientCode}</td>
                      <td style={tdStyle}>{client.companyName}</td>
                      <td style={tdStyle}>{client.contactPerson || "-"}</td>
                      <td style={tdStyle}>{client.phone || "-"}</td>
                      <td style={tdStyle}>{client.email || "-"}</td>
                      <td style={tdStyle}>
                        <span style={getStatusBadgeStyle(client.status)}>
                          {client.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={infoStackStyle}>
                          <span>Assignments: {client.assignmentCount}</span>
                          <span>Invoices: {client.invoiceCount}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={tableMetaTextStyle}>
                          {formatUtcDateTime(client.createdAt)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {canManage ? (
                          <div style={actionsWrapStyle}>
                            <button
                              onClick={() => startEdit(client)}
                              disabled={submitting || deletingId === client.id}
                              style={{
                                ...miniButtonStyle,
                                background:
                                  editingId === client.id
                                    ? palette.softSurfaceAlt
                                    : miniButtonStyle.background,
                                opacity: submitting || deletingId === client.id ? 0.7 : 1,
                              }}
                            >
                              {editingId === client.id ? "Editing..." : "Edit"}
                            </button>

                            <button
                              onClick={() => handleDelete(client.id)}
                              disabled={
                                deletingId === client.id ||
                                client.assignmentCount > 0 ||
                                client.invoiceCount > 0
                              }
                              style={{
                                ...dangerButtonStyle,
                                background:
                                  client.assignmentCount > 0 || client.invoiceCount > 0
                                    ? palette.softSurfaceAlt
                                    : dangerButtonStyle.background,
                                border:
                                  client.assignmentCount > 0 || client.invoiceCount > 0
                                    ? `1px solid ${palette.border}`
                                    : dangerButtonStyle.border,
                                color:
                                  client.assignmentCount > 0 || client.invoiceCount > 0
                                    ? palette.mutedText
                                    : dangerButtonStyle.color,
                                cursor:
                                  client.assignmentCount > 0 || client.invoiceCount > 0
                                    ? "not-allowed"
                                    : "pointer",
                                opacity: deletingId === client.id ? 0.7 : 1,
                              }}
                              title={
                                client.assignmentCount > 0 || client.invoiceCount > 0
                                  ? "Cannot delete client with linked assignments or invoices."
                                  : "Delete client"
                              }
                            >
                              {deletingId === client.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
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
              ? "Note: Clients can be edited at any time. Delete stays blocked when assignments or invoices are linked."
              : "You have read-only access to client records."}
          </p>
        </section>
      </div>

      {canManage ? (
        <EditorJumpButton targetRef={editorPanelRef} label="Jump to client form" />
      ) : null}
    </main>
  );
}

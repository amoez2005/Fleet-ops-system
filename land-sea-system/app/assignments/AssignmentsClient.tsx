"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  getStatusBadgeStyle,
  infoStackStyle,
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
  secondaryButtonStyle,
  sectionTitleStyle,
  selectionBoxStyle,
  successStyle,
  tableContainerStyle,
  tableHeadRowStyle,
  tableStyle,
  tdStyle,
  thStyle,
  warningTextStyle,
} from "@/lib/ui";

type AssignmentItem = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  rateType: string;
  rateValue: string;
  jobNotes: string;
  status: string;
  clientId: string;
  clientName: string;
  assetIds: string[];
  assetCodes: string[];
  revenueCount: number;
  invoiceLinkCount: number;
};

type ClientOption = {
  id: string;
  clientCode: string;
  companyName: string;
  status: string;
};

type AssetOption = {
  id: string;
  assetCode: string;
  categoryName: string;
  operationalStatus: string;
};

const statuses = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"];

export default function AssignmentsClient({
  assignments,
  clients,
  assets,
  canManage,
}: {
  assignments: AssignmentItem[];
  clients: ClientOption[];
  assets: AssetOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorPanelRef = useRef<HTMLElement | null>(null);
  const defaultClientId = clients[0]?.id ?? "";
  const focus = searchParams.get("focus");
  const isActiveFocus = focus === "active";

  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [rateType, setRateType] = useState("");
  const [rateValue, setRateValue] = useState("");
  const [jobNotes, setJobNotes] = useState("");
  const [status, setStatus] = useState("PLANNED");
  const [clientId, setClientId] = useState(defaultClientId);
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [assetToAddId, setAssetToAddId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function resetForm() {
    setTitle("");
    setStartDate("");
    setEndDate("");
    setLocation("");
    setRateType("");
    setRateValue("");
    setJobNotes("");
    setStatus("PLANNED");
    setClientId(defaultClientId);
    setAssetIds([]);
    setAssetToAddId("");
    setEditingId("");
  }

  function startEdit(assignment: AssignmentItem) {
    setError("");
    setSuccess("");
    setEditingId(assignment.id);
    setTitle(assignment.title);
    setStartDate(toDateTimeInputValue(assignment.startDate));
    setEndDate(toDateTimeInputValue(assignment.endDate));
    setLocation(assignment.location);
    setRateType(assignment.rateType);
    setRateValue(assignment.rateValue);
    setJobNotes(assignment.jobNotes);
    setStatus(assignment.status);
    setClientId(assignment.clientId);
    setAssetIds(assignment.assetIds);
    setAssetToAddId("");
    focusEditorPanel(editorPanelRef.current);
  }

  function cancelEdit() {
    setError("");
    setSuccess("");
    resetForm();
  }

  function handleSelectAsset(assetId: string) {
    if (!assetId) {
      return;
    }

    setAssetIds((currentAssetIds) =>
      currentAssetIds.includes(assetId)
        ? currentAssetIds
        : [...currentAssetIds, assetId]
    );
    setAssetToAddId("");
  }

  function handleRemoveAsset(assetId: string) {
    setAssetIds((currentAssetIds) =>
      currentAssetIds.filter((id) => id !== assetId)
    );
  }

  const selectedAssets = assetIds
    .map((assetId) => assetMap.get(assetId))
    .filter((asset): asset is AssetOption => Boolean(asset));

  const availableAssets = assets.filter(
    (asset) =>
      asset.operationalStatus === "AVAILABLE" && !assetIds.includes(asset.id)
  );

  const scopedAssignments = isActiveFocus
    ? assignments.filter((assignment) => assignment.status === "ACTIVE")
    : assignments;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSubmitting(true);

      const res = await fetch(
        editingId ? `/api/assignments?id=${editingId}` : "/api/assignments",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            startDate: toUtcIsoString(startDate),
            endDate: endDate ? toUtcIsoString(endDate) : "",
            location,
            rateType,
            rateValue,
            jobNotes,
            status,
            clientId,
            assetIds,
          }),
        }
      );

      const data = await readApiJson<{ error?: string }>(res);

      if (!res.ok) {
        setError(data.error || "Failed to save assignment.");
        return;
      }

      resetForm();
      setSuccess(
        editingId
          ? "Assignment updated successfully."
          : "Assignment created successfully."
      );
      reloadAfterMutation(router);
    } catch {
      setError(
        editingId
          ? "Something went wrong while updating assignment."
          : "Something went wrong while creating assignment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError("");
    setSuccess("");

    const confirmed = window.confirm(
      "Are you sure you want to delete this assignment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      const res = await fetch(`/api/assignments?id=${id}`, {
        method: "DELETE",
      });

      const data = await readApiJson<{ error?: string }>(res);

      if (!res.ok) {
        setError(data.error || "Failed to delete assignment.");
        return;
      }

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Assignment deleted successfully.");
      reloadAfterMutation(router);
    } catch {
      setError("Something went wrong while deleting assignment.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="landsea-editor-page" style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>Assignments</h1>
        </div>

        <DashboardHomeLink />
      </div>

      <div className="landsea-editor-layout landsea-editor-layout--wide">
        <section ref={editorPanelRef} className="landsea-editor-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>
            {canManage
              ? editingId
                ? "Edit Assignment"
                : "Add Assignment"
              : "Assignment Access"}
          </h2>

          {canManage ? (
            <>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px" }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Optional assignment title"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px" }}>
                    Client
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
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
                      Start Date (UTC)
                    </label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px" }}>
                      End Date (UTC)
                    </label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px" }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Optional"
                    style={inputStyle}
                  />
                </div>

                <div className="landsea-form-grid-3">
                  <div>
                    <label style={{ display: "block", marginBottom: "8px" }}>
                      Rate Type
                    </label>
                    <input
                      type="text"
                      value={rateType}
                      onChange={(e) => setRateType(e.target.value)}
                      placeholder="Optional"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px" }}>
                      Rate Value
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={rateValue}
                      onChange={(e) => setRateValue(e.target.value)}
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
                    Linked Assets
                  </label>
                  <div
                    style={{
                      display: "block",
                      marginBottom: "12px",
                    }}
                  >
                    <select
                      value={assetToAddId}
                      onChange={(e) => handleSelectAsset(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="" style={optionStyle}>
                        {availableAssets.length === 0
                          ? "No available assets to add"
                          : "Select available asset"}
                      </option>
                      {availableAssets.map((asset) => (
                        <option
                          key={asset.id}
                          value={asset.id}
                          style={optionStyle}
                        >
                          {asset.assetCode} ({asset.categoryName}) - {asset.operationalStatus}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={selectionBoxStyle}>
                    {selectedAssets.length === 0 ? (
                      <p style={{ margin: 0, color: palette.mutedText }}>
                        No assets selected.
                      </p>
                    ) : (
                      selectedAssets.map((asset) => (
                        <div
                          key={asset.id}
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
                            {asset.assetCode} ({asset.categoryName}) - {asset.operationalStatus}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(asset.id)}
                            style={miniButtonStyle}
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px" }}>
                    Job Notes
                  </label>
                  <textarea
                    value={jobNotes}
                    onChange={(e) => setJobNotes(e.target.value)}
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
                        ? "Update Assignment"
                        : "Create Assignment"}
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
                  You need at least one client before adding assignments.
                </p>
              ) : null}
            </>
          ) : (
            <div style={noteStyle}>
              Your role can review assignments, but only operations managers and
              super admins can create, edit, or delete them.
            </div>
          )}
        </section>

        <section className="landsea-list-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>Assignment List</h2>

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
              Showing {scopedAssignments.length} of {assignments.length} assignments
            </p>

            {isActiveFocus ? (
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
                    border: `1px solid ${palette.border}`,
                    background: palette.softSurfaceAlt,
                    color: palette.carbonBlack,
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  Focused view: Active assignments
                </div>

                <Link href="/assignments" style={miniButtonStyle}>
                  Show All
                </Link>
              </div>
            ) : null}
          </div>

          <div className="landsea-list-scroll" style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeadRowStyle}>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Assets</th>
                  <th style={thStyle}>Start</th>
                  <th style={thStyle}>End</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Links</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {scopedAssignments.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={9}>
                      {isActiveFocus
                        ? "No active assignments found."
                        : "No assignments found."}
                    </td>
                  </tr>
                ) : (
                  scopedAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td style={tdStyle}>{assignment.title || "-"}</td>
                      <td style={tdStyle}>{assignment.clientName}</td>
                      <td style={tdStyle}>
                        {assignment.assetCodes.length === 0
                          ? "-"
                          : assignment.assetCodes.join(", ")}
                      </td>
                      <td style={tdStyle}>
                        {formatUtcDateTime(assignment.startDate)}
                      </td>
                      <td style={tdStyle}>
                        {assignment.endDate
                          ? formatUtcDateTime(assignment.endDate)
                          : "-"}
                      </td>
                      <td style={tdStyle}>{assignment.location || "-"}</td>
                      <td style={tdStyle}>
                        <span style={getStatusBadgeStyle(assignment.status)}>
                          {assignment.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={infoStackStyle}>
                          <span>Revenues: {assignment.revenueCount}</span>
                          <span>Invoice Links: {assignment.invoiceLinkCount}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {canManage ? (
                          <div style={actionsWrapStyle}>
                            <button
                              onClick={() => startEdit(assignment)}
                              disabled={submitting || deletingId === assignment.id}
                              style={{
                                ...miniButtonStyle,
                                background:
                                  editingId === assignment.id
                                    ? palette.softSurfaceAlt
                                    : miniButtonStyle.background,
                                opacity:
                                  submitting || deletingId === assignment.id ? 0.7 : 1,
                              }}
                            >
                              {editingId === assignment.id ? "Editing..." : "Edit"}
                            </button>

                            <button
                              onClick={() => handleDelete(assignment.id)}
                              disabled={
                                deletingId === assignment.id ||
                                assignment.revenueCount > 0 ||
                                assignment.invoiceLinkCount > 0
                              }
                              style={{
                                ...dangerButtonStyle,
                                background:
                                  assignment.revenueCount > 0 ||
                                  assignment.invoiceLinkCount > 0
                                    ? palette.softSurfaceAlt
                                    : dangerButtonStyle.background,
                                border:
                                  assignment.revenueCount > 0 ||
                                  assignment.invoiceLinkCount > 0
                                    ? `1px solid ${palette.border}`
                                    : dangerButtonStyle.border,
                                color:
                                  assignment.revenueCount > 0 ||
                                  assignment.invoiceLinkCount > 0
                                    ? palette.mutedText
                                    : dangerButtonStyle.color,
                                cursor:
                                  assignment.revenueCount > 0 ||
                                  assignment.invoiceLinkCount > 0
                                    ? "not-allowed"
                                    : "pointer",
                                opacity: deletingId === assignment.id ? 0.7 : 1,
                              }}
                              title={
                                assignment.revenueCount > 0 ||
                                assignment.invoiceLinkCount > 0
                                  ? "Cannot delete assignment with linked revenue or invoices."
                                  : "Delete assignment"
                              }
                            >
                              {deletingId === assignment.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        ) : (
                          <span style={warningTextStyle}>View only</span>
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
              ? "Note: Assignments can be edited at any time. Delete stays blocked when revenue or invoice links are already attached."
              : "You have read-only access to assignment records."}
          </p>
        </section>
      </div>

      {canManage ? (
        <EditorJumpButton
          targetRef={editorPanelRef}
          label="Jump to assignment form"
        />
      ) : null}
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

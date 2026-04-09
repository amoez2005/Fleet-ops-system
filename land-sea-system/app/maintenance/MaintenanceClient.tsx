"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

type MaintenanceItem = {
  id: string;
  serviceType: string;
  lastServiceDate: string;
  nextDueDate: string;
  cost: string;
  vendor: string;
  notes: string;
  assetId: string;
  assetCode: string;
  categoryName: string;
};

type AssetOption = {
  id: string;
  assetCode: string;
  categoryName: string;
  operationalStatus: string;
};

export default function MaintenanceClient({
  maintenanceRecords,
  assets,
}: {
  maintenanceRecords: MaintenanceItem[];
  assets: AssetOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorPanelRef = useRef<HTMLElement | null>(null);
  const defaultAssetId = assets[0]?.id ?? "";
  const focus = searchParams.get("focus");
  const isDueSoonFocus = focus === "due-soon";

  const [assetId, setAssetId] = useState(defaultAssetId);
  const [serviceType, setServiceType] = useState("");
  const [lastServiceDate, setLastServiceDate] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [cost, setCost] = useState("");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function resetForm() {
    setAssetId(defaultAssetId);
    setServiceType("");
    setLastServiceDate("");
    setNextDueDate("");
    setCost("");
    setVendor("");
    setNotes("");
    setEditingId("");
  }

  function startEdit(record: MaintenanceItem) {
    setError("");
    setSuccess("");
    setEditingId(record.id);
    setAssetId(record.assetId);
    setServiceType(record.serviceType);
    setLastServiceDate(toDateTimeInputValue(record.lastServiceDate));
    setNextDueDate(toDateTimeInputValue(record.nextDueDate));
    setCost(record.cost);
    setVendor(record.vendor);
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
        editingId ? `/api/maintenance?id=${editingId}` : "/api/maintenance",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assetId,
            serviceType,
            lastServiceDate: lastServiceDate ? toUtcIsoString(lastServiceDate) : "",
            nextDueDate: nextDueDate ? toUtcIsoString(nextDueDate) : "",
            cost,
            vendor,
            notes,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save maintenance record.");
        return;
      }

      resetForm();
      setSuccess(
        editingId
          ? "Maintenance record updated successfully."
          : "Maintenance record created successfully."
      );
      router.refresh();
    } catch {
      setError(
        editingId
          ? "Something went wrong while updating maintenance record."
          : "Something went wrong while creating maintenance record."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError("");
    setSuccess("");

    const confirmed = window.confirm(
      "Are you sure you want to delete this maintenance record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      const res = await fetch(`/api/maintenance?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete maintenance record.");
        return;
      }

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Maintenance record deleted successfully.");
      router.refresh();
    } catch {
      setError("Something went wrong while deleting maintenance record.");
    } finally {
      setDeletingId("");
    }
  }

  const now = new Date();
  const nextTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const scopedMaintenanceRecords = isDueSoonFocus
    ? maintenanceRecords.filter((record) => {
        if (!record.nextDueDate) {
          return false;
        }

        const nextDue = new Date(record.nextDueDate);

        return (
          !Number.isNaN(nextDue.getTime()) &&
          nextDue >= now &&
          nextDue <= nextTwoWeeks
        );
      })
    : maintenanceRecords;

  return (
    <main className="landsea-editor-page" style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>Maintenance Records</h1>
        </div>

        <DashboardHomeLink />
      </div>

      <div className="landsea-editor-layout">
        <section ref={editorPanelRef} className="landsea-editor-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>
            {editingId ? "Edit Maintenance Record" : "Add Maintenance Record"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Asset
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                required
                style={inputStyle}
              >
                {assets.map((asset) => (
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

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Service Type
              </label>
              <input
                type="text"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                required
                placeholder="e.g. Oil Change"
                style={inputStyle}
              />
            </div>

            <div className="landsea-form-grid-2">
              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Last Service (UTC)
                </label>
                <input
                  type="datetime-local"
                  value={lastServiceDate}
                  onChange={(e) => setLastServiceDate(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Next Due (UTC)
                </label>
                <input
                  type="datetime-local"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="landsea-form-grid-2">
              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Cost
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="Optional"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Vendor
                </label>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Optional"
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
                disabled={submitting || assets.length === 0}
                style={primaryButtonStyle}
              >
                {submitting
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                    ? "Update Maintenance Record"
                    : "Create Maintenance Record"}
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

          {assets.length === 0 ? (
            <p style={warningTextStyle}>
              You need at least one asset before adding maintenance records.
            </p>
          ) : null}
        </section>

        <section className="landsea-list-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>Maintenance List</h2>

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
              Showing {scopedMaintenanceRecords.length} of {maintenanceRecords.length} maintenance records
            </p>

            {isDueSoonFocus ? (
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
                  Focused view: Due in next 14 days
                </div>

                <Link href="/maintenance" style={miniButtonStyle}>
                  Show All
                </Link>
              </div>
            ) : null}
          </div>

          <div className="landsea-list-scroll" style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeadRowStyle}>
                  <th style={thStyle}>Asset</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Service Type</th>
                  <th style={thStyle}>Last Service</th>
                  <th style={thStyle}>Next Due</th>
                  <th style={thStyle}>Cost</th>
                  <th style={thStyle}>Vendor</th>
                  <th style={thStyle}>Notes</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {scopedMaintenanceRecords.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={9}>
                      {isDueSoonFocus
                        ? "No due-soon maintenance records found."
                        : "No maintenance records found."}
                    </td>
                  </tr>
                ) : (
                  scopedMaintenanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td style={tdStyle}>{record.assetCode}</td>
                      <td style={tdStyle}>{record.categoryName}</td>
                      <td style={tdStyle}>{record.serviceType}</td>
                      <td style={tdStyle}>
                        <span style={tableMetaTextStyle}>
                          {record.lastServiceDate
                            ? formatUtcDateTime(record.lastServiceDate)
                            : "-"}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={tableMetaTextStyle}>
                          {record.nextDueDate
                            ? formatUtcDateTime(record.nextDueDate)
                            : "-"}
                        </span>
                      </td>
                      <td style={tdStyle}>{record.cost || "-"}</td>
                      <td style={tdStyle}>{record.vendor || "-"}</td>
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
            Note: Maintenance records can be edited or deleted from here.
          </p>
        </section>
      </div>

      <EditorJumpButton
        targetRef={editorPanelRef}
        label="Jump to maintenance form"
      />
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

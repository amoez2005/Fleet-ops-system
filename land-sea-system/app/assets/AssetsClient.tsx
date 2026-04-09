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
  successStyle,
  tableContainerStyle,
  tableHeadRowStyle,
  tableMetaTextStyle,
  tableStyle,
  tdStyle,
  thStyle,
  warningTextStyle,
} from "@/lib/ui";

type AssetItem = {
  id: string;
  assetCode: string;
  registrationNo: string;
  brand: string;
  model: string;
  specification: string;
  ownershipStatus: string;
  operationalStatus: string;
  notes: string;
  categoryId: string;
  categoryName: string;
  createdAt: string;
  assignmentCount: number;
  maintenanceCount: number;
};

type CategoryItem = {
  id: string;
  name: string;
};

const statuses = ["AVAILABLE", "ACTIVE", "MAINTENANCE", "INACTIVE"];

export default function AssetsClient({
  assets,
  categories,
}: {
  assets: AssetItem[];
  categories: CategoryItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorPanelRef = useRef<HTMLElement | null>(null);
  const defaultCategoryId = categories[0]?.id ?? "";
  const focus = searchParams.get("focus");
  const focusedAssetStatus = focus === "available" ? "AVAILABLE" : null;

  const [assetCode, setAssetCode] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [specification, setSpecification] = useState("");
  const [ownershipStatus, setOwnershipStatus] = useState("");
  const [operationalStatus, setOperationalStatus] = useState("AVAILABLE");
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function resetForm() {
    setAssetCode("");
    setRegistrationNo("");
    setBrand("");
    setModel("");
    setSpecification("");
    setOwnershipStatus("");
    setOperationalStatus("AVAILABLE");
    setNotes("");
    setCategoryId(defaultCategoryId);
    setEditingId("");
  }

  function startEdit(asset: AssetItem) {
    setError("");
    setSuccess("");
    setEditingId(asset.id);
    setAssetCode(asset.assetCode);
    setRegistrationNo(asset.registrationNo);
    setBrand(asset.brand);
    setModel(asset.model);
    setSpecification(asset.specification);
    setOwnershipStatus(asset.ownershipStatus);
    setOperationalStatus(asset.operationalStatus);
    setNotes(asset.notes);
    setCategoryId(asset.categoryId);
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
        editingId ? `/api/assets?id=${editingId}` : "/api/assets",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assetCode,
            registrationNo,
            brand,
            model,
            specification,
            ownershipStatus,
            operationalStatus,
            notes,
            categoryId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save asset.");
        return;
      }

      resetForm();
      setSuccess(
        editingId ? "Asset updated successfully." : "Asset created successfully."
      );
      router.refresh();
    } catch {
      setError(
        editingId
          ? "Something went wrong while updating asset."
          : "Something went wrong while creating asset."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError("");
    setSuccess("");

    const confirmed = window.confirm(
      "Are you sure you want to delete this asset?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      const res = await fetch(`/api/assets?id=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete asset.");
        return;
      }

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Asset deleted successfully.");
      router.refresh();
    } catch {
      setError("Something went wrong while deleting asset.");
    } finally {
      setDeletingId("");
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setCategoryFilter("ALL");
    setStatusFilter("ALL");
  }

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const scopedAssets = focusedAssetStatus
    ? assets.filter((asset) => asset.operationalStatus === focusedAssetStatus)
    : assets;

  const filteredAssets = scopedAssets.filter((asset) => {
    const matchesCategory =
      categoryFilter === "ALL" || asset.categoryId === categoryFilter;
    const matchesStatus =
      statusFilter === "ALL" || asset.operationalStatus === statusFilter;

    const searchHaystack = [
      asset.assetCode,
      asset.registrationNo,
      asset.categoryName,
      asset.brand,
      asset.model,
      asset.specification,
      asset.ownershipStatus,
      asset.operationalStatus,
      asset.notes,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      normalizedSearchQuery.length === 0 ||
      searchHaystack.includes(normalizedSearchQuery);

    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <main className="landsea-editor-page" style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>Assets</h1>
        </div>

        <DashboardHomeLink />
      </div>

      <div className="landsea-editor-layout">
        <section ref={editorPanelRef} className="landsea-editor-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>
            {editingId ? "Edit Asset" : "Add Asset"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Asset Code
              </label>
              <input
                type="text"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                required
                placeholder="e.g. TR-002"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                style={inputStyle}
              >
                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                    style={optionStyle}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Registration No
              </label>
              <input
                type="text"
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                placeholder="Optional"
                style={inputStyle}
              />
            </div>

            <div className="landsea-form-grid-2">
              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Volvo"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. FH"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Specification
              </label>
              <input
                type="text"
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                placeholder="Optional"
                style={inputStyle}
              />
            </div>

            <div className="landsea-form-grid-2">
              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Ownership Status
                </label>
                <input
                  type="text"
                  value={ownershipStatus}
                  onChange={(e) => setOwnershipStatus(e.target.value)}
                  placeholder="e.g. Owned / Leased"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Operational Status
                </label>
                <select
                  value={operationalStatus}
                  onChange={(e) => setOperationalStatus(e.target.value)}
                  style={inputStyle}
                >
                  {statuses.map((status) => (
                    <option
                      key={status}
                      value={status}
                      style={optionStyle}
                    >
                      {status}
                    </option>
                  ))}
                </select>
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
                disabled={submitting || categories.length === 0}
                style={{
                  ...primaryButtonStyle,
                  opacity: submitting || categories.length === 0 ? 0.8 : 1,
                }}
              >
                {submitting
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                    ? "Update Asset"
                    : "Create Asset"}
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

          {categories.length === 0 ? (
            <p style={warningTextStyle}>
              You need at least one category before adding assets.
            </p>
          ) : null}
        </section>

        <section className="landsea-list-panel" style={panelStyle}>
          <h2 style={sectionTitleStyle}>Asset List</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              marginBottom: "16px",
              alignItems: "end",
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Code, registration, brand, model..."
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={inputStyle}
              >
                <option value="ALL" style={optionStyle}>
                  All categories
                </option>
                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                    style={optionStyle}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={inputStyle}
              >
                <option value="ALL" style={optionStyle}>
                  All statuses
                </option>
                {statuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                    style={optionStyle}
                  >
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              style={{
                ...secondaryButtonStyle,
                width: "100%",
                whiteSpace: "nowrap",
              }}
            >
              Clear Filters
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <p style={{ margin: 0, color: palette.mutedText, fontSize: "13px" }}>
              Showing {filteredAssets.length} of {scopedAssets.length} assets
            </p>

            {focusedAssetStatus ? (
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
                  Focused view: Available assets
                </div>

                <Link href="/assets" style={miniButtonStyle}>
                  Show All
                </Link>
              </div>
            ) : filteredAssets.length !== scopedAssets.length ? (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "999px",
                  border: `1px solid ${palette.border}`,
                  background: palette.softSurfaceStrong,
                  color: palette.charcoalBrown,
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Filters active
              </div>
            ) : null}
          </div>

          <div className="landsea-list-scroll" style={tableContainerStyle}>
            <table
              style={tableStyle}
            >
              <thead>
                <tr style={tableHeadRowStyle}>
                  <th style={thStyle}>Asset Code</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Registration</th>
                  <th style={thStyle}>Brand / Model</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Links</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {scopedAssets.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={8}>
                      No assets found.
                    </td>
                  </tr>
                ) : filteredAssets.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={8}>
                      No assets match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr key={asset.id}>
                      <td style={tdStyle}>{asset.assetCode}</td>
                      <td style={tdStyle}>{asset.categoryName}</td>
                      <td style={tdStyle}>{asset.registrationNo || "-"}</td>
                      <td style={tdStyle}>
                        {asset.brand || "-"} {asset.model ? `/ ${asset.model}` : ""}
                      </td>
                      <td style={tdStyle}>
                        <span style={getStatusBadgeStyle(asset.operationalStatus)}>
                          {asset.operationalStatus}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={infoStackStyle}>
                          <span>Assignments: {asset.assignmentCount}</span>
                          <span>Maintenance: {asset.maintenanceCount}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={tableMetaTextStyle}>
                          {formatUtcDateTime(asset.createdAt)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={actionsWrapStyle}>
                          <button
                            onClick={() => startEdit(asset)}
                            disabled={submitting || deletingId === asset.id}
                            style={{
                              ...miniButtonStyle,
                              background:
                                editingId === asset.id
                                  ? palette.softSurfaceAlt
                                  : miniButtonStyle.background,
                              opacity: submitting || deletingId === asset.id ? 0.7 : 1,
                            }}
                          >
                            {editingId === asset.id ? "Editing..." : "Edit"}
                          </button>

                          <button
                            onClick={() => handleDelete(asset.id)}
                            disabled={
                              deletingId === asset.id ||
                              asset.assignmentCount > 0 ||
                              asset.maintenanceCount > 0
                            }
                            style={{
                              ...dangerButtonStyle,
                              background:
                                asset.assignmentCount > 0 || asset.maintenanceCount > 0
                                  ? palette.softSurfaceAlt
                                  : dangerButtonStyle.background,
                              border:
                                asset.assignmentCount > 0 || asset.maintenanceCount > 0
                                  ? `1px solid ${palette.border}`
                                  : dangerButtonStyle.border,
                              color:
                                asset.assignmentCount > 0 || asset.maintenanceCount > 0
                                  ? palette.mutedText
                                  : dangerButtonStyle.color,
                              cursor:
                                asset.assignmentCount > 0 || asset.maintenanceCount > 0
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: deletingId === asset.id ? 0.7 : 1,
                            }}
                            title={
                              asset.assignmentCount > 0 || asset.maintenanceCount > 0
                                ? "Cannot delete asset with linked assignments or maintenance."
                                : "Delete asset"
                            }
                          >
                            {deletingId === asset.id ? "Deleting..." : "Delete"}
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
            Note: Assets can be edited at any time. Delete stays blocked when assignments or maintenance records are linked.
          </p>
        </section>
      </div>

      <EditorJumpButton targetRef={editorPanelRef} label="Jump to asset form" />
    </main>
  );
}

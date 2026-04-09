import type { CSSProperties } from "react";

export const palette = {
  floralWhite: "#FFFCF2",
  silver: "#CCC5B9",
  charcoalBrown: "#403D39",
  carbonBlack: "#252422",
  spicyPaprika: "#EB5E28",
  mutedText: "rgba(64, 61, 57, 0.72)",
  border: "rgba(64, 61, 57, 0.14)",
  borderStrong: "rgba(64, 61, 57, 0.24)",
  softSurface: "rgba(255, 252, 242, 0.88)",
  softSurfaceStrong: "rgba(255, 252, 242, 0.96)",
  softSurfaceAlt: "rgba(204, 197, 185, 0.22)",
  accentWash: "rgba(235, 94, 40, 0.12)",
  accentBorder: "rgba(235, 94, 40, 0.28)",
  shadow: "rgba(37, 36, 34, 0.08)",
};

export const pageStyle: CSSProperties = {
  padding: "24px",
  fontFamily: 'var(--font-geist-sans), "Segoe UI", sans-serif',
  color: palette.charcoalBrown,
  background: "var(--page-wash)",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden",
};

export const pageHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "28px",
};

export const panelStyle: CSSProperties = {
  border: `1px solid ${palette.border}`,
  borderRadius: "22px",
  padding: "24px",
  background: palette.softSurface,
  boxShadow: `0 18px 44px ${palette.shadow}`,
  backdropFilter: "blur(16px)",
};

export const pageTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 4vw, 48px)",
  lineHeight: 0.98,
  letterSpacing: "-0.065em",
  fontWeight: 900,
  color: palette.spicyPaprika,
  textShadow: "0 14px 28px rgba(235, 94, 40, 0.14)",
};

export const sectionTitleStyle: CSSProperties = {
  margin: "0 0 18px",
  fontSize: "24px",
  lineHeight: 1.08,
  letterSpacing: "-0.045em",
  fontWeight: 800,
  color: palette.carbonBlack,
};

export const navButtonStyle: CSSProperties = {
  padding: "10px 16px",
  border: `1px solid ${palette.borderStrong}`,
  borderRadius: "999px",
  color: palette.carbonBlack,
  textDecoration: "none",
  background: palette.softSurfaceStrong,
  fontWeight: 600,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "14px",
  border: `1px solid ${palette.border}`,
  background: palette.softSurfaceStrong,
  color: palette.carbonBlack,
  outline: "none",
  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.6)",
};

export const optionStyle: CSSProperties = {
  background: palette.floralWhite,
  color: palette.carbonBlack,
};

export const primaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "999px",
  border: `1px solid ${palette.carbonBlack}`,
  background: palette.carbonBlack,
  color: palette.floralWhite,
  cursor: "pointer",
  fontWeight: 700,
  boxShadow: `0 12px 24px ${palette.shadow}`,
};

export const secondaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "999px",
  border: `1px solid ${palette.borderStrong}`,
  background: palette.softSurfaceStrong,
  color: palette.carbonBlack,
  cursor: "pointer",
  fontWeight: 700,
};

export const miniButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  minWidth: "88px",
  borderRadius: "999px",
  border: `1px solid ${palette.borderStrong}`,
  background: palette.softSurfaceStrong,
  color: palette.carbonBlack,
  cursor: "pointer",
  textDecoration: "none",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

export const dangerButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  minWidth: "88px",
  borderRadius: "999px",
  border: `1px solid ${palette.accentBorder}`,
  background: palette.spicyPaprika,
  color: palette.floralWhite,
  cursor: "pointer",
  textDecoration: "none",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

export const selectionBoxStyle: CSSProperties = {
  border: `1px solid ${palette.border}`,
  borderRadius: "16px",
  padding: "12px",
  background: palette.softSurfaceStrong,
  display: "grid",
  gap: "8px",
};

export const readOnlyBoxStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "14px",
  border: `1px solid ${palette.border}`,
  background: palette.softSurfaceAlt,
  color: palette.carbonBlack,
};

export const tableStyle: CSSProperties = {
  width: "max-content",
  minWidth: "max(100%, 1080px)",
  borderCollapse: "collapse",
  border: `1px solid ${palette.border}`,
  background: "rgba(255, 252, 242, 0.72)",
  tableLayout: "auto",
};

export const tableContainerStyle: CSSProperties = {
  overflowX: "auto",
  overflowY: "auto",
  paddingBottom: "8px",
  scrollbarWidth: "thin",
  scrollbarColor: `${palette.silver} transparent`,
  WebkitOverflowScrolling: "touch",
};

export const tableHeadRowStyle: CSSProperties = {
  background: "rgba(204, 197, 185, 0.24)",
};

export const thStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  padding: "12px",
  border: `1px solid ${palette.border}`,
  textAlign: "left",
  color: palette.mutedText,
  fontSize: "13px",
  fontWeight: 700,
  background: "rgba(243, 238, 231, 0.96)",
  backdropFilter: "blur(10px)",
  boxShadow: `inset 0 -1px 0 ${palette.border}`,
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
};

export const tdStyle: CSSProperties = {
  padding: "12px",
  border: `1px solid ${palette.border}`,
  verticalAlign: "top",
  color: palette.charcoalBrown,
  lineHeight: 1.55,
  overflowWrap: "break-word",
  wordBreak: "normal",
};

export const tableMetaTextStyle: CSSProperties = {
  color: palette.mutedText,
  fontSize: "13px",
  lineHeight: 1.55,
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
};

export const actionsWrapStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  alignItems: "center",
  minWidth: "max-content",
};

export const infoStackStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
};

export const errorStyle: CSSProperties = {
  marginBottom: "16px",
  padding: "12px 14px",
  borderRadius: "14px",
  background: palette.accentWash,
  border: `1px solid ${palette.accentBorder}`,
  color: palette.carbonBlack,
};

export const successStyle: CSSProperties = {
  marginBottom: "16px",
  padding: "12px 14px",
  borderRadius: "14px",
  background: palette.softSurfaceAlt,
  border: `1px solid ${palette.borderStrong}`,
  color: palette.carbonBlack,
};

export const subtitleStyle: CSSProperties = {
  margin: 0,
  color: palette.mutedText,
};

export const noteStyle: CSSProperties = {
  color: palette.mutedText,
  marginTop: "12px",
};

export const warningTextStyle: CSSProperties = {
  color: palette.spicyPaprika,
  marginTop: "12px",
  fontWeight: 600,
};

export function getStatusBadgeStyle(value: string): CSSProperties {
  const normalizedValue = value.trim().toUpperCase();

  if (
    normalizedValue === "ACTIVE" ||
    normalizedValue === "AVAILABLE" ||
    normalizedValue === "PAID" ||
    normalizedValue === "COMPLETED" ||
    normalizedValue === "YES"
  ) {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "6px 12px",
      minWidth: "96px",
      borderRadius: "999px",
      background: palette.carbonBlack,
      color: palette.floralWhite,
      fontSize: "12px",
      fontWeight: 700,
      letterSpacing: "0.02em",
      whiteSpace: "nowrap",
    };
  }

  if (
    normalizedValue === "OVERDUE" ||
    normalizedValue === "CANCELLED" ||
    normalizedValue === "HOLD" ||
    normalizedValue === "MAINTENANCE"
  ) {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "6px 12px",
      minWidth: "96px",
      borderRadius: "999px",
      background: palette.spicyPaprika,
      color: palette.floralWhite,
      fontSize: "12px",
      fontWeight: 700,
      letterSpacing: "0.02em",
      whiteSpace: "nowrap",
    };
  }

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 12px",
    minWidth: "96px",
    borderRadius: "999px",
    border: `1px solid ${palette.borderStrong}`,
    background: palette.softSurfaceAlt,
    color: palette.carbonBlack,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
  };
}

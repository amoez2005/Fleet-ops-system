"use client";

import { palette } from "@/lib/ui";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        padding: "10px 16px",
        border: `1px solid ${palette.borderStrong}`,
        borderRadius: "999px",
        background: palette.softSurfaceStrong,
        color: palette.carbonBlack,
        cursor: "pointer",
        fontWeight: 700,
      }}
    >
      Print
    </button>
  );
}

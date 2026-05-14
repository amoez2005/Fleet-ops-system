"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { ArrowUpToLine } from "lucide-react";
import { focusEditorPanel } from "@/lib/editor";
import { palette } from "@/lib/ui";

type EditorJumpButtonProps = {
  targetRef: RefObject<HTMLElement | null>;
  label?: string;
};

export default function EditorJumpButton({
  targetRef,
  label = "Jump to form",
}: EditorJumpButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      if (typeof window === "undefined") {
        return;
      }

      const element = targetRef.current;

      if (!element) {
        setVisible(false);
        return;
      }

      const rect = element.getBoundingClientRect();
      const wideLayout = window.innerWidth > 1180;
      const panelVisibleOnDesktop = wideLayout && rect.top <= 48 && rect.bottom > 160;
      const panelVisibleOnSingleColumn =
        !wideLayout && rect.top < window.innerHeight * 0.35 && rect.bottom > 96;

      setVisible(
        window.scrollY > 220 &&
          !panelVisibleOnDesktop &&
          !panelVisibleOnSingleColumn
      );
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [targetRef]);

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => focusEditorPanel(targetRef.current)}
      aria-label={label}
      title={label}
      style={{
        position: "fixed",
        right: "clamp(12px, 3vw, 24px)",
        bottom: "clamp(12px, 3vw, 24px)",
        zIndex: 45,
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: "11px 14px",
        borderRadius: "999px",
        border: `1px solid ${palette.accentBorder}`,
        background: palette.spicyPaprika,
        color: palette.floralWhite,
        fontWeight: 700,
        boxShadow: "0 16px 28px rgba(37, 36, 34, 0.18)",
        cursor: "pointer",
      }}
    >
      <ArrowUpToLine size={18} />
      <span>{label}</span>
    </button>
  );
}

"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { palette } from "@/lib/ui";

export default function LogoutButton({
  variant = "dark",
  iconOnly = false,
}: {
  variant?: "dark" | "light";
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);

      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      aria-label={loading ? "Logging out" : "Logout"}
      title={loading ? "Logging out" : "Logout"}
      style={{
        width: iconOnly ? "48px" : undefined,
        height: iconOnly ? "48px" : undefined,
        padding: iconOnly ? 0 : "10px 16px",
        border: `1px solid ${
          variant === "light" ? palette.carbonBlack : palette.borderStrong
        }`,
        borderRadius: "999px",
        color:
          variant === "light" ? palette.floralWhite : palette.carbonBlack,
        background:
          variant === "light" ? palette.carbonBlack : palette.softSurfaceStrong,
        cursor: "pointer",
        fontWeight: 700,
        boxShadow:
          variant === "light"
            ? "0 12px 24px rgba(37, 36, 34, 0.12)"
            : "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}
    >
      {iconOnly ? <LogOut size={18} /> : loading ? "Logging out..." : "Logout"}
    </button>
  );
}

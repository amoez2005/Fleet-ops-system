import { House } from "lucide-react";
import Link from "next/link";
import { palette } from "@/lib/ui";

export default function DashboardHomeLink() {
  return (
    <Link
      href="/"
      aria-label="Go to dashboard"
      title="Go to dashboard"
      style={{
        width: "52px",
        height: "52px",
        borderRadius: "999px",
        border: `1px solid ${palette.borderStrong}`,
        background: palette.softSurfaceStrong,
        color: palette.carbonBlack,
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 12px 24px ${palette.shadow}`,
        flexShrink: 0,
      }}
    >
      <House size={20} />
    </Link>
  );
}

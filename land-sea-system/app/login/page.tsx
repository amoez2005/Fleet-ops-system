import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { getSession } from "../../lib/auth";
import { palette } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
  }>;
}) {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(235, 94, 40, 0.16), transparent 24%), radial-gradient(circle at bottom right, rgba(204, 197, 185, 0.44), transparent 32%), linear-gradient(180deg, #FFFCF2 0%, #f3eee7 100%)",
        color: palette.carbonBlack,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(16px, 3vw, 24px)",
        fontFamily: 'var(--font-geist-sans), "Segoe UI", sans-serif',
      }}
    >
      <LoginForm error={error} />
    </main>
  );
}

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import RevenuesClient from "./RevenuesClient";

export const dynamic = "force-dynamic";

export default async function RevenuesPage() {
  await requireSession();

  const [revenues, assignments] = await Promise.all([
    db.revenue.findMany({
      orderBy: {
        revenueDate: "desc",
      },
      include: {
        assignment: {
          include: {
            client: true,
          },
        },
      },
    }),
    db.assignment.findMany({
      orderBy: {
        startDate: "desc",
      },
      include: {
        client: true,
      },
    }),
  ]);

  const defaultRevenueCategories = [
    "Transport",
    "Equipment Hire",
    "Labour",
    "Maintenance Recovery",
    "Other",
  ];

  const safeRevenues = revenues.map((revenue) => ({
    id: revenue.id,
    grossAmount: revenue.grossAmount.toString(),
    deductions: revenue.deductions.toString(),
    netAmount: revenue.netAmount.toString(),
    revenueDate: revenue.revenueDate.toISOString(),
    revenueCategory: revenue.revenueCategory ?? "",
    notes: revenue.notes ?? "",
    assignmentId: revenue.assignmentId,
    assignmentTitle: revenue.assignment.title ?? "",
    clientName: revenue.assignment.client.companyName,
  }));

  const safeAssignments = assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title ?? "",
    clientName: assignment.client.companyName,
    startDate: assignment.startDate.toISOString(),
    status: assignment.status,
  }));

  const safeRevenueCategories = Array.from(
    new Set(
      [...defaultRevenueCategories, ...safeRevenues.map((revenue) => revenue.revenueCategory)]
        .map((category) => category.trim())
        .filter(Boolean)
    )
  );

  return (
    <RevenuesClient
      revenues={safeRevenues}
      assignments={safeAssignments}
      revenueCategories={safeRevenueCategories}
    />
  );
}

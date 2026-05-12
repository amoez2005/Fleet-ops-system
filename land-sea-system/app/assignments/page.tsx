import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { canManageOperations } from "@/lib/roles";
import AssignmentsClient from "./AssignmentsClient";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const session = await requireSession();
  const canManage = canManageOperations(session.role);

  const [assignments, clients, assets] = await Promise.all([
    db.assignment.findMany({
      orderBy: {
        startDate: "desc",
      },
      include: {
        client: true,
        assets: {
          include: {
            asset: true,
          },
        },
        _count: {
          select: {
            revenues: true,
            invoiceLinks: true,
          },
        },
      },
    }),
    db.client.findMany({
      orderBy: {
        companyName: "asc",
      },
    }),
    db.asset.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        assetCode: "asc",
      },
      include: {
        category: true,
      },
    }),
  ]);

  const safeAssignments = assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title ?? "",
    startDate: assignment.startDate.toISOString(),
    endDate: assignment.endDate?.toISOString() ?? "",
    location: assignment.location ?? "",
    rateType: assignment.rateType ?? "",
    rateValue: assignment.rateValue?.toString() ?? "",
    jobNotes: assignment.jobNotes ?? "",
    status: assignment.status,
    clientId: assignment.clientId,
    clientName: assignment.client.companyName,
    assetIds: assignment.assets.map((item) => item.assetId),
    assetCodes: assignment.assets.map((item) => item.asset.assetCode),
    revenueCount: assignment._count.revenues,
    invoiceLinkCount: assignment._count.invoiceLinks,
  }));

  const safeClients = clients.map((client) => ({
    id: client.id,
    clientCode: client.clientCode,
    companyName: client.companyName,
    status: client.status,
  }));

  const safeAssets = assets.map((asset) => ({
    id: asset.id,
    assetCode: asset.assetCode,
    categoryName: asset.category.name,
    operationalStatus: asset.operationalStatus,
  }));

  return (
    <AssignmentsClient
      assignments={safeAssignments}
      clients={safeClients}
      assets={safeAssets}
      canManage={canManage}
    />
  );
}

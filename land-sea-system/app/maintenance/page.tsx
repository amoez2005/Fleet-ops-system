import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import MaintenanceClient from "./MaintenanceClient";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  await requireSession();

  const [maintenanceRecords, assets] = await Promise.all([
    db.maintenanceRecord.findMany({
      where: {
        asset: {
          is: {
            deletedAt: null,
          },
        },
      },
      orderBy: [
        {
          nextDueDate: "asc",
        },
        {
          lastServiceDate: "desc",
        },
      ],
      include: {
        asset: {
          include: {
            category: true,
          },
        },
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

  const safeMaintenanceRecords = maintenanceRecords.map((record) => ({
    id: record.id,
    serviceType: record.serviceType,
    lastServiceDate: record.lastServiceDate?.toISOString() ?? "",
    nextDueDate: record.nextDueDate?.toISOString() ?? "",
    cost: record.cost?.toString() ?? "",
    vendor: record.vendor ?? "",
    notes: record.notes ?? "",
    assetId: record.assetId,
    assetCode: record.asset.assetCode,
    categoryName: record.asset.category.name,
  }));

  const safeAssets = assets.map((asset) => ({
    id: asset.id,
    assetCode: asset.assetCode,
    categoryName: asset.category.name,
    operationalStatus: asset.operationalStatus,
  }));

  return (
    <MaintenanceClient
      maintenanceRecords={safeMaintenanceRecords}
      assets={safeAssets}
    />
  );
}

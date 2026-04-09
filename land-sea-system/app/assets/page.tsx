import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import AssetsClient from "./AssetsClient";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  await requireSession();

  const [assets, categories] = await Promise.all([
    db.asset.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        assetCode: "asc",
      },
      include: {
        category: true,
        _count: {
          select: {
            assignments: true,
            maintenanceRecords: true,
          },
        },
      },
    }),
    db.category.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const safeAssets = assets.map((asset) => ({
    id: asset.id,
    assetCode: asset.assetCode,
    registrationNo: asset.registrationNo ?? "",
    brand: asset.brand ?? "",
    model: asset.model ?? "",
    specification: asset.specification ?? "",
    ownershipStatus: asset.ownershipStatus ?? "",
    operationalStatus: asset.operationalStatus,
    notes: asset.notes ?? "",
    categoryId: asset.categoryId,
    categoryName: asset.category.name,
    assignmentCount: asset._count.assignments,
    maintenanceCount: asset._count.maintenanceRecords,
    createdAt: asset.createdAt.toISOString(),
  }));
  const safeCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  return <AssetsClient assets={safeAssets} categories={safeCategories} />;
}

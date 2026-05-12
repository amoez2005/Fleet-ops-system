import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { canManageOperations } from "@/lib/roles";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const session = await requireSession();
  const canManage = canManageOperations(session.role);

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: {
      assets: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
        },
      },
    },
  });

  const safeCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description ?? "",
    assetCount: category.assets.length,
    createdAt: category.createdAt.toISOString(),
  }));

  return <CategoriesClient categories={safeCategories} canManage={canManage} />;
}

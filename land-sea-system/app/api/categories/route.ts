import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { canManageOperations } from "@/lib/roles";

const forbiddenResponse = () =>
  NextResponse.json(
    { error: "You do not have permission to modify categories." },
    { status: 403 }
  );

export async function GET(req: Request) {
  await requireSession();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const category = await db.category.findUnique({
      where: { id },
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

    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    return NextResponse.json({
      ...category,
      assetCount: category.assets.length,
    });
  }

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

  return NextResponse.json(
    categories.map((category) => ({
      ...category,
      assetCount: category.assets.length,
    }))
  );
}

export async function POST(req: Request) {
  const session = await requireSession();

  if (!canManageOperations(session.role)) {
    return forbiddenResponse();
  }

  try {
    const body = await req.json();

    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required." },
        { status: 400 }
      );
    }

    const existing = await db.category.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Category with this name already exists." },
        { status: 409 }
      );
    }

    const category = await db.category.create({
      data: {
        name,
        description: description || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create category." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await requireSession();

  if (!canManageOperations(session.role)) {
    return forbiddenResponse();
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category id is required." },
        { status: 400 }
      );
    }

    const category = await db.category.findUnique({
      where: { id },
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

    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    if (category.assets.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete a category with linked assets." },
        { status: 400 }
      );
    }

    await db.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete category." },
      { status: 500 }
    );
  }

}

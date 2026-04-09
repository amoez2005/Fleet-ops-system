import { NextResponse } from "next/server";
import { AssetStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const validStatuses = new Set(Object.values(AssetStatus));

export async function GET(req: Request) {
  await requireSession();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const asset = await db.asset.findFirst({
      where: {
        id,
        deletedAt: null,
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
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    return NextResponse.json(asset);
  }

  const assets = await db.asset.findMany({
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
  });

  return NextResponse.json(assets);
}

export async function POST(req: Request) {
  await requireSession();

  try {
    const body = await req.json();

    const assetCode = String(body.assetCode || "").trim();
    const registrationNo = String(body.registrationNo || "").trim();
    const brand = String(body.brand || "").trim();
    const model = String(body.model || "").trim();
    const specification = String(body.specification || "").trim();
    const ownershipStatus = String(body.ownershipStatus || "").trim();
    const notes = String(body.notes || "").trim();
    const categoryId = String(body.categoryId || "").trim();
    const operationalStatus = String(body.operationalStatus || "AVAILABLE").trim();

    if (!assetCode) {
      return NextResponse.json(
        { error: "Asset code is required." },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 }
      );
    }

    if (!validStatuses.has(operationalStatus as AssetStatus)) {
      return NextResponse.json(
        { error: "Invalid operational status." },
        { status: 400 }
      );
    }

    const category = await db.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Selected category was not found." },
        { status: 404 }
      );
    }

    const existingAssetCode = await db.asset.findUnique({
      where: {
        assetCode,
      },
    });

    if (existingAssetCode) {
      return NextResponse.json(
        { error: "Asset with this asset code already exists." },
        { status: 409 }
      );
    }

    if (registrationNo) {
      const existingRegistration = await db.asset.findUnique({
        where: {
          registrationNo,
        },
      });

      if (existingRegistration) {
        return NextResponse.json(
          { error: "Asset with this registration number already exists." },
          { status: 409 }
        );
      }
    }

    const asset = await db.asset.create({
      data: {
        assetCode,
        registrationNo: registrationNo || null,
        brand: brand || null,
        model: model || null,
        specification: specification || null,
        ownershipStatus: ownershipStatus || null,
        operationalStatus: operationalStatus as AssetStatus,
        notes: notes || null,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create asset." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  await requireSession();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Asset id is required." },
        { status: 400 }
      );
    }

    const existingAsset = await db.asset.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingAsset) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    const body = await req.json();

    const assetCode = String(body.assetCode || "").trim();
    const registrationNo = String(body.registrationNo || "").trim();
    const brand = String(body.brand || "").trim();
    const model = String(body.model || "").trim();
    const specification = String(body.specification || "").trim();
    const ownershipStatus = String(body.ownershipStatus || "").trim();
    const notes = String(body.notes || "").trim();
    const categoryId = String(body.categoryId || "").trim();
    const operationalStatus = String(body.operationalStatus || "AVAILABLE").trim();

    if (!assetCode) {
      return NextResponse.json(
        { error: "Asset code is required." },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 }
      );
    }

    if (!validStatuses.has(operationalStatus as AssetStatus)) {
      return NextResponse.json(
        { error: "Invalid operational status." },
        { status: 400 }
      );
    }

    const category = await db.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Selected category was not found." },
        { status: 404 }
      );
    }

    const existingAssetCode = await db.asset.findUnique({
      where: {
        assetCode,
      },
    });

    if (existingAssetCode && existingAssetCode.id !== id) {
      return NextResponse.json(
        { error: "Asset with this asset code already exists." },
        { status: 409 }
      );
    }

    if (registrationNo) {
      const existingRegistration = await db.asset.findUnique({
        where: {
          registrationNo,
        },
      });

      if (existingRegistration && existingRegistration.id !== id) {
        return NextResponse.json(
          { error: "Asset with this registration number already exists." },
          { status: 409 }
        );
      }
    }

    const asset = await db.asset.update({
      where: {
        id,
      },
      data: {
        assetCode,
        registrationNo: registrationNo || null,
        brand: brand || null,
        model: model || null,
        specification: specification || null,
        ownershipStatus: ownershipStatus || null,
        operationalStatus: operationalStatus as AssetStatus,
        notes: notes || null,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(asset);
  } catch {
    return NextResponse.json(
      { error: "Failed to update asset." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  await requireSession();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Asset id is required." },
        { status: 400 }
      );
    }

    const asset = await db.asset.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            assignments: true,
            maintenanceRecords: true,
          },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    if (asset._count.assignments > 0 || asset._count.maintenanceRecords > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete an asset with linked assignments or maintenance records.",
        },
        { status: 400 }
      );
    }

    await db.asset.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete asset." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const maintenanceInclude = {
  asset: {
    include: {
      category: true,
    },
  },
};

export async function GET(req: Request) {
  await requireSession();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const maintenanceRecord = await db.maintenanceRecord.findFirst({
      where: {
        id,
        asset: {
          is: {
            deletedAt: null,
          },
        },
      },
      include: maintenanceInclude,
    });

    if (!maintenanceRecord) {
      return NextResponse.json(
        { error: "Maintenance record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(maintenanceRecord);
  }

  const maintenanceRecords = await db.maintenanceRecord.findMany({
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
    include: maintenanceInclude,
  });

  return NextResponse.json(maintenanceRecords);
}

export async function POST(req: Request) {
  await requireSession();

  try {
    const body = await req.json();
    const validation = await validateMaintenanceInput(body);

    if ("error" in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const maintenanceRecord = await db.maintenanceRecord.create({
      data: {
        assetId: validation.assetId,
        serviceType: validation.serviceType,
        lastServiceDate: validation.lastServiceDate,
        nextDueDate: validation.nextDueDate,
        cost: validation.cost,
        vendor: validation.vendor || null,
        notes: validation.notes || null,
      },
      include: maintenanceInclude,
    });

    return NextResponse.json(maintenanceRecord, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create maintenance record." },
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
        { error: "Maintenance record id is required." },
        { status: 400 }
      );
    }

    const existingRecord = await db.maintenanceRecord.findUnique({
      where: {
        id,
      },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Maintenance record not found." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validation = await validateMaintenanceInput(body);

    if ("error" in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const maintenanceRecord = await db.maintenanceRecord.update({
      where: {
        id,
      },
      data: {
        assetId: validation.assetId,
        serviceType: validation.serviceType,
        lastServiceDate: validation.lastServiceDate,
        nextDueDate: validation.nextDueDate,
        cost: validation.cost,
        vendor: validation.vendor || null,
        notes: validation.notes || null,
      },
      include: maintenanceInclude,
    });

    return NextResponse.json(maintenanceRecord);
  } catch {
    return NextResponse.json(
      { error: "Failed to update maintenance record." },
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
        { error: "Maintenance record id is required." },
        { status: 400 }
      );
    }

    const maintenanceRecord = await db.maintenanceRecord.findUnique({
      where: {
        id,
      },
    });

    if (!maintenanceRecord) {
      return NextResponse.json(
        { error: "Maintenance record not found." },
        { status: 404 }
      );
    }

    await db.maintenanceRecord.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete maintenance record." },
      { status: 500 }
    );
  }
}

async function validateMaintenanceInput(body: unknown) {
  const data = body as Record<string, unknown>;

  const assetId = String(data.assetId || "").trim();
  const serviceType = String(data.serviceType || "").trim();
  const lastServiceDateRaw = String(data.lastServiceDate || "").trim();
  const nextDueDateRaw = String(data.nextDueDate || "").trim();
  const costRaw = String(data.cost || "").trim();
  const vendor = String(data.vendor || "").trim();
  const notes = String(data.notes || "").trim();

  if (!assetId) {
    return {
      error: "Asset is required.",
      status: 400,
    };
  }

  if (!serviceType) {
    return {
      error: "Service type is required.",
      status: 400,
    };
  }

  let lastServiceDate: Date | null = null;

  if (lastServiceDateRaw) {
    lastServiceDate = new Date(lastServiceDateRaw);

    if (Number.isNaN(lastServiceDate.getTime())) {
      return {
        error: "Last service date is invalid.",
        status: 400,
      };
    }
  }

  let nextDueDate: Date | null = null;

  if (nextDueDateRaw) {
    nextDueDate = new Date(nextDueDateRaw);

    if (Number.isNaN(nextDueDate.getTime())) {
      return {
        error: "Next due date is invalid.",
        status: 400,
      };
    }
  }

  if (lastServiceDate && nextDueDate && nextDueDate < lastServiceDate) {
    return {
      error: "Next due date cannot be earlier than last service date.",
      status: 400,
    };
  }

  let cost: Prisma.Decimal | null = null;

  if (costRaw) {
    if (!/^\d+(\.\d{1,2})?$/.test(costRaw)) {
      return {
        error: "Cost must be a valid number with up to 2 decimals.",
        status: 400,
      };
    }

    cost = new Prisma.Decimal(costRaw);
  }

  const asset = await db.asset.findFirst({
    where: {
      id: assetId,
      deletedAt: null,
    },
  });

  if (!asset) {
    return {
      error: "Selected asset was not found.",
      status: 404,
    };
  }

  return {
    assetId,
    serviceType,
    lastServiceDate,
    nextDueDate,
    cost,
    vendor,
    notes,
  };
}

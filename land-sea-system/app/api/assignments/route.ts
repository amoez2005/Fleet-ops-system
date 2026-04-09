import { NextResponse } from "next/server";
import { AssignmentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const validStatuses = new Set(Object.values(AssignmentStatus));

const assignmentInclude = {
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
};

export async function GET(req: Request) {
  await requireSession();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const assignment = await db.assignment.findUnique({
      where: { id },
      include: assignmentInclude,
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    return NextResponse.json(assignment);
  }

  const assignments = await db.assignment.findMany({
    orderBy: {
      startDate: "desc",
    },
    include: assignmentInclude,
  });

  return NextResponse.json(assignments);
}

export async function POST(req: Request) {
  await requireSession();

  try {
    const body = await req.json();
    const validation = await validateAssignmentInput(body);

    if ("error" in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const assignment = await db.assignment.create({
      data: {
        title: validation.title || null,
        startDate: validation.startDate,
        endDate: validation.endDate,
        location: validation.location || null,
        rateType: validation.rateType || null,
        rateValue: validation.rateValue,
        jobNotes: validation.jobNotes || null,
        status: validation.assignmentStatus,
        clientId: validation.clientId,
        assets: {
          create: validation.assetIds.map((assetId) => ({
            assetId,
          })),
        },
      },
      include: assignmentInclude,
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create assignment." },
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
        { error: "Assignment id is required." },
        { status: 400 }
      );
    }

    const existingAssignment = await db.assignment.findUnique({
      where: {
        id,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const body = await req.json();
    const validation = await validateAssignmentInput(body);

    if ("error" in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const assignment = await db.assignment.update({
      where: {
        id,
      },
      data: {
        title: validation.title || null,
        startDate: validation.startDate,
        endDate: validation.endDate,
        location: validation.location || null,
        rateType: validation.rateType || null,
        rateValue: validation.rateValue,
        jobNotes: validation.jobNotes || null,
        status: validation.assignmentStatus,
        clientId: validation.clientId,
        assets: {
          deleteMany: {},
          create: validation.assetIds.map((assetId) => ({
            assetId,
          })),
        },
      },
      include: assignmentInclude,
    });

    return NextResponse.json(assignment);
  } catch {
    return NextResponse.json(
      { error: "Failed to update assignment." },
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
        { error: "Assignment id is required." },
        { status: 400 }
      );
    }

    const assignment = await db.assignment.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            revenues: true,
            invoiceLinks: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    if (assignment._count.revenues > 0 || assignment._count.invoiceLinks > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete an assignment with linked revenue or invoice records.",
        },
        { status: 400 }
      );
    }

    await db.assignment.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete assignment." },
      { status: 500 }
    );
  }
}

async function validateAssignmentInput(body: unknown) {
  const data = body as Record<string, unknown>;

  const title = String(data.title || "").trim();
  const startDateRaw = String(data.startDate || "").trim();
  const endDateRaw = String(data.endDate || "").trim();
  const location = String(data.location || "").trim();
  const rateType = String(data.rateType || "").trim();
  const rateValueRaw = String(data.rateValue || "").trim();
  const jobNotes = String(data.jobNotes || "").trim();
  const status = String(data.status || "PLANNED").trim();
  const clientId = String(data.clientId || "").trim();
  const assetIds = getUniqueAssetIds(data.assetIds);

  if (!startDateRaw) {
    return {
      error: "Start date is required.",
      status: 400,
    };
  }

  if (!clientId) {
    return {
      error: "Client is required.",
      status: 400,
    };
  }

  if (!validStatuses.has(status as AssignmentStatus)) {
    return {
      error: "Invalid assignment status.",
      status: 400,
    };
  }

  const startDate = new Date(startDateRaw);

  if (Number.isNaN(startDate.getTime())) {
    return {
      error: "Start date is invalid.",
      status: 400,
    };
  }

  let endDate: Date | null = null;

  if (endDateRaw) {
    endDate = new Date(endDateRaw);

    if (Number.isNaN(endDate.getTime())) {
      return {
        error: "End date is invalid.",
        status: 400,
      };
    }

    if (endDate < startDate) {
      return {
        error: "End date cannot be earlier than start date.",
        status: 400,
      };
    }
  }

  let rateValue: Prisma.Decimal | null = null;

  if (rateValueRaw) {
    if (!/^\d+(\.\d{1,2})?$/.test(rateValueRaw)) {
      return {
        error: "Rate value must be a valid number with up to 2 decimals.",
        status: 400,
      };
    }

    rateValue = new Prisma.Decimal(rateValueRaw);
  }

  const [client, assets] = await Promise.all([
    db.client.findUnique({
      where: {
        id: clientId,
      },
    }),
    assetIds.length > 0
      ? db.asset.findMany({
          where: {
            id: {
              in: assetIds,
            },
            deletedAt: null,
          },
        })
      : Promise.resolve([]),
  ]);

  if (!client) {
    return {
      error: "Selected client was not found.",
      status: 404,
    };
  }

  if (assets.length !== assetIds.length) {
    return {
      error: "One or more selected assets were not found.",
      status: 404,
    };
  }

  return {
    title,
    startDate,
    endDate,
    location,
    rateType,
    rateValue,
    jobNotes,
    assignmentStatus: status as AssignmentStatus,
    clientId,
    assetIds,
  };
}

function getUniqueAssetIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );
}

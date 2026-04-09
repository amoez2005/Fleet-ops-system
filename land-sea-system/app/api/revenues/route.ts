import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const revenueInclude = {
  assignment: {
    include: {
      client: true,
    },
  },
};

export async function GET(req: Request) {
  await requireSession();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const revenue = await db.revenue.findUnique({
      where: { id },
      include: revenueInclude,
    });

    if (!revenue) {
      return NextResponse.json({ error: "Revenue not found." }, { status: 404 });
    }

    return NextResponse.json(revenue);
  }

  const revenues = await db.revenue.findMany({
    orderBy: {
      revenueDate: "desc",
    },
    include: revenueInclude,
  });

  return NextResponse.json(revenues);
}

export async function POST(req: Request) {
  await requireSession();

  try {
    const body = await req.json();
    const validation = await validateRevenueInput(body);

    if ("error" in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const revenue = await db.revenue.create({
      data: {
        grossAmount: validation.grossAmount,
        deductions: validation.deductions,
        netAmount: validation.netAmount,
        revenueDate: validation.revenueDate,
        revenueCategory: validation.revenueCategory || null,
        notes: validation.notes || null,
        assignmentId: validation.assignmentId,
      },
      include: revenueInclude,
    });

    return NextResponse.json(revenue, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create revenue." },
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
        { error: "Revenue id is required." },
        { status: 400 }
      );
    }

    const existingRevenue = await db.revenue.findUnique({
      where: {
        id,
      },
    });

    if (!existingRevenue) {
      return NextResponse.json({ error: "Revenue not found." }, { status: 404 });
    }

    const body = await req.json();
    const validation = await validateRevenueInput(body);

    if ("error" in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const revenue = await db.revenue.update({
      where: {
        id,
      },
      data: {
        grossAmount: validation.grossAmount,
        deductions: validation.deductions,
        netAmount: validation.netAmount,
        revenueDate: validation.revenueDate,
        revenueCategory: validation.revenueCategory || null,
        notes: validation.notes || null,
        assignmentId: validation.assignmentId,
      },
      include: revenueInclude,
    });

    return NextResponse.json(revenue);
  } catch {
    return NextResponse.json(
      { error: "Failed to update revenue." },
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
        { error: "Revenue id is required." },
        { status: 400 }
      );
    }

    const revenue = await db.revenue.findUnique({
      where: {
        id,
      },
    });

    if (!revenue) {
      return NextResponse.json({ error: "Revenue not found." }, { status: 404 });
    }

    await db.revenue.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete revenue." },
      { status: 500 }
    );
  }
}

async function validateRevenueInput(body: unknown) {
  const data = body as Record<string, unknown>;

  const assignmentId = String(data.assignmentId || "").trim();
  const revenueDateRaw = String(data.revenueDate || "").trim();
  const grossAmountRaw = String(data.grossAmount || "").trim();
  const deductionsRaw = String(data.deductions || "0").trim();
  const revenueCategory = String(data.revenueCategory || "").trim();
  const notes = String(data.notes || "").trim();

  if (!assignmentId) {
    return {
      error: "Assignment is required.",
      status: 400,
    };
  }

  if (!revenueDateRaw) {
    return {
      error: "Revenue date is required.",
      status: 400,
    };
  }

  if (!grossAmountRaw) {
    return {
      error: "Gross amount is required.",
      status: 400,
    };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(grossAmountRaw)) {
    return {
      error: "Gross amount must be a valid number with up to 2 decimals.",
      status: 400,
    };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(deductionsRaw)) {
    return {
      error: "Deductions must be a valid number with up to 2 decimals.",
      status: 400,
    };
  }

  const revenueDate = new Date(revenueDateRaw);

  if (Number.isNaN(revenueDate.getTime())) {
    return {
      error: "Revenue date is invalid.",
      status: 400,
    };
  }

  const grossAmount = new Prisma.Decimal(grossAmountRaw);
  const deductions = new Prisma.Decimal(deductionsRaw || "0");
  const netAmount = grossAmount.minus(deductions);

  if (netAmount.lessThan(0)) {
    return {
      error: "Deductions cannot be greater than gross amount.",
      status: 400,
    };
  }

  const assignment = await db.assignment.findUnique({
    where: {
      id: assignmentId,
    },
  });

  if (!assignment) {
    return {
      error: "Selected assignment was not found.",
      status: 404,
    };
  }

  return {
    assignmentId,
    revenueDate,
    grossAmount,
    deductions,
    netAmount,
    revenueCategory,
    notes,
  };
}

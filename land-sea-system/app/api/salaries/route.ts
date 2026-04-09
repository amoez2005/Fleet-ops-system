import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET(req: Request) {
  await requireSession();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const salaryRecord = await db.salaryRecord.findUnique({
      where: { id },
    });

    if (!salaryRecord) {
      return NextResponse.json(
        { error: "Salary record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(salaryRecord);
  }

  const salaryRecords = await db.salaryRecord.findMany({
    orderBy: [
      {
        salaryMonth: "desc",
      },
      {
        employeeName: "asc",
      },
    ],
  });

  return NextResponse.json(salaryRecords);
}

export async function POST(req: Request) {
  await requireSession();

  try {
    const body = await req.json();
    const validation = validateSalaryInput(body);

    if ("error" in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const salaryRecord = await db.salaryRecord.create({
      data: {
        employeeName: validation.employeeName,
        roleTitle: validation.roleTitle || null,
        salaryMonth: validation.salaryMonth,
        amount: validation.amount,
        paymentDate: validation.paymentDate,
        notes: validation.notes || null,
      },
    });

    return NextResponse.json(salaryRecord, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create salary record." },
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
        { error: "Salary record id is required." },
        { status: 400 }
      );
    }

    const existingRecord = await db.salaryRecord.findUnique({
      where: {
        id,
      },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Salary record not found." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validation = validateSalaryInput(body);

    if ("error" in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const salaryRecord = await db.salaryRecord.update({
      where: {
        id,
      },
      data: {
        employeeName: validation.employeeName,
        roleTitle: validation.roleTitle || null,
        salaryMonth: validation.salaryMonth,
        amount: validation.amount,
        paymentDate: validation.paymentDate,
        notes: validation.notes || null,
      },
    });

    return NextResponse.json(salaryRecord);
  } catch {
    return NextResponse.json(
      { error: "Failed to update salary record." },
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
        { error: "Salary record id is required." },
        { status: 400 }
      );
    }

    const salaryRecord = await db.salaryRecord.findUnique({
      where: {
        id,
      },
    });

    if (!salaryRecord) {
      return NextResponse.json(
        { error: "Salary record not found." },
        { status: 404 }
      );
    }

    await db.salaryRecord.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete salary record." },
      { status: 500 }
    );
  }
}

function validateSalaryInput(body: unknown) {
  const data = body as Record<string, unknown>;

  const employeeName = String(data.employeeName || "").trim();
  const roleTitle = String(data.roleTitle || "").trim();
  const salaryMonthRaw = String(data.salaryMonth || "").trim();
  const amountRaw = String(data.amount || "").trim();
  const paymentDateRaw = String(data.paymentDate || "").trim();
  const notes = String(data.notes || "").trim();

  if (!employeeName) {
    return {
      error: "Employee name is required.",
      status: 400,
    };
  }

  if (!salaryMonthRaw) {
    return {
      error: "Salary month is required.",
      status: 400,
    };
  }

  if (!amountRaw) {
    return {
      error: "Amount is required.",
      status: 400,
    };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(amountRaw)) {
    return {
      error: "Amount must be a valid number with up to 2 decimals.",
      status: 400,
    };
  }

  const salaryMonth = new Date(salaryMonthRaw);

  if (Number.isNaN(salaryMonth.getTime())) {
    return {
      error: "Salary month is invalid.",
      status: 400,
    };
  }

  let paymentDate: Date | null = null;

  if (paymentDateRaw) {
    paymentDate = new Date(paymentDateRaw);

    if (Number.isNaN(paymentDate.getTime())) {
      return {
        error: "Payment date is invalid.",
        status: 400,
      };
    }
  }

  return {
    employeeName,
    roleTitle,
    salaryMonth,
    amount: new Prisma.Decimal(amountRaw),
    paymentDate,
    notes,
  };
}

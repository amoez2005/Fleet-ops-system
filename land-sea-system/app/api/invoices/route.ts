import { NextResponse } from "next/server";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { parseJsonBody } from "@/lib/request";
import { canAccessFinancials } from "@/lib/roles";

const validStatuses = new Set(Object.values(InvoiceStatus));

const invoiceInclude = {
  client: true,
  assignments: {
    include: {
      assignment: true,
    },
  },
};
const forbiddenResponse = () =>
  NextResponse.json(
    { error: "You do not have permission to access invoices." },
    { status: 403 }
  );

export async function GET(req: Request) {
  const session = await requireSession();

  if (!canAccessFinancials(session.role)) {
    return forbiddenResponse();
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const mode = searchParams.get("mode");

  if (mode === "next-number") {
    const invoiceNo = await getNextInvoiceNo(searchParams.get("issueDate"));

    return NextResponse.json({ invoiceNo });
  }

  if (id) {
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    return NextResponse.json(invoice);
  }

  const invoices = await db.invoice.findMany({
    orderBy: {
      issueDate: "desc",
    },
    include: invoiceInclude,
  });

  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const session = await requireSession();

  if (!canAccessFinancials(session.role)) {
    return forbiddenResponse();
  }

  try {
    const body = await parseJsonBody(req);
    const validation = await validateInvoiceInput(body);

    if ("error" in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const invoice = await db.invoice.create({
      data: {
        invoiceNo: validation.invoiceNo,
        issueDate: validation.issueDate,
        dueDate: validation.dueDate,
        subtotal: validation.subtotal,
        taxAmount: validation.taxAmount,
        totalAmount: validation.totalAmount,
        status: validation.invoiceStatus,
        paymentDate: validation.paymentDate,
        notes: validation.notes || null,
        clientId: validation.clientId,
        assignments: {
          create: validation.assignmentIds.map((assignmentId) => ({
            assignmentId,
          })),
        },
      },
      include: invoiceInclude,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create invoice." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const session = await requireSession();

  if (!canAccessFinancials(session.role)) {
    return forbiddenResponse();
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Invoice id is required." },
        { status: 400 }
      );
    }

    const existingInvoice = await db.invoice.findUnique({
      where: {
        id,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    const body = await parseJsonBody(req);
    const validation = await validateInvoiceInput(body, id);

    if ("error" in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const invoice = await db.invoice.update({
      where: {
        id,
      },
      data: {
        invoiceNo: validation.invoiceNo,
        issueDate: validation.issueDate,
        dueDate: validation.dueDate,
        subtotal: validation.subtotal,
        taxAmount: validation.taxAmount,
        totalAmount: validation.totalAmount,
        status: validation.invoiceStatus,
        paymentDate: validation.paymentDate,
        notes: validation.notes || null,
        clientId: validation.clientId,
        assignments: {
          deleteMany: {},
          create: validation.assignmentIds.map((assignmentId) => ({
            assignmentId,
          })),
        },
      },
      include: invoiceInclude,
    });

    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json(
      { error: "Failed to update invoice." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await requireSession();

  if (!canAccessFinancials(session.role)) {
    return forbiddenResponse();
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Invoice id is required." },
        { status: 400 }
      );
    }

    const invoice = await db.invoice.findUnique({
      where: {
        id,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    await db.invoice.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete invoice." },
      { status: 500 }
    );
  }
}

async function validateInvoiceInput(body: unknown, currentInvoiceId?: string) {
  const data = body as Record<string, unknown>;

  const invoiceNoRaw = getTrimmedString(data.invoiceNo);
  const issueDateRaw = getTrimmedString(data.issueDate);
  const dueDateRaw = getTrimmedString(data.dueDate);
  const subtotalRaw = getTrimmedString(data.subtotal);
  const taxAmountRaw = getTrimmedString(data.taxAmount) || "0";
  const status = getTrimmedString(data.status) || "DRAFT";
  const paymentDateRaw = getTrimmedString(data.paymentDate);
  const notes = getTrimmedString(data.notes);
  const clientId = getTrimmedString(data.clientId);
  const assignmentIds = getUniqueAssignmentIds(data.assignmentIds);

  if (!clientId) {
    return {
      error: "Client is required.",
      status: 400,
    };
  }

  if (!issueDateRaw) {
    return {
      error: "Issue date is required.",
      status: 400,
    };
  }

  if (!dueDateRaw) {
    return {
      error: "Due date is required.",
      status: 400,
    };
  }

  if (!subtotalRaw) {
    return {
      error: "Subtotal is required.",
      status: 400,
    };
  }

  if (!validStatuses.has(status as InvoiceStatus)) {
    return {
      error: "Invalid invoice status.",
      status: 400,
    };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(subtotalRaw)) {
    return {
      error: "Subtotal must be a valid number with up to 2 decimals.",
      status: 400,
    };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(taxAmountRaw)) {
    return {
      error: "Tax amount must be a valid number with up to 2 decimals.",
      status: 400,
    };
  }

  const issueDate = new Date(issueDateRaw);
  const dueDate = new Date(dueDateRaw);

  if (Number.isNaN(issueDate.getTime())) {
    return {
      error: "Issue date is invalid.",
      status: 400,
    };
  }

  if (Number.isNaN(dueDate.getTime())) {
    return {
      error: "Due date is invalid.",
      status: 400,
    };
  }

  if (dueDate < issueDate) {
    return {
      error: "Due date cannot be earlier than issue date.",
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

    if (paymentDate < issueDate) {
      return {
        error: "Payment date cannot be earlier than issue date.",
        status: 400,
      };
    }
  }

  const subtotal = new Prisma.Decimal(subtotalRaw);
  const taxAmount = new Prisma.Decimal(taxAmountRaw);
  const totalAmount = subtotal.plus(taxAmount);
  const invoiceNo =
    invoiceNoRaw || (currentInvoiceId ? "" : await getNextInvoiceNo(issueDateRaw));

  if (!invoiceNo) {
    return {
      error: "Invoice number is required.",
      status: 400,
    };
  }

  const [duplicateInvoice, client, assignments] = await Promise.all([
    db.invoice.findFirst({
      where: {
        invoiceNo,
        ...(currentInvoiceId
          ? {
              NOT: {
                id: currentInvoiceId,
              },
            }
          : {}),
      },
    }),
    db.client.findUnique({
      where: {
        id: clientId,
      },
    }),
    assignmentIds.length > 0
      ? db.assignment.findMany({
          where: {
            id: {
              in: assignmentIds,
            },
          },
        })
      : Promise.resolve([]),
  ]);

  if (duplicateInvoice) {
    return {
      error: "Invoice number already exists.",
      status: 400,
    };
  }

  if (!client) {
    return {
      error: "Selected client was not found.",
      status: 404,
    };
  }

  if (assignments.length !== assignmentIds.length) {
    return {
      error: "One or more selected assignments were not found.",
      status: 404,
    };
  }

  if (assignments.some((assignment) => assignment.clientId !== clientId)) {
    return {
      error: "All selected assignments must belong to the selected client.",
      status: 400,
    };
  }

  return {
    invoiceNo,
    issueDate,
    dueDate,
    subtotal,
    taxAmount,
    totalAmount,
    invoiceStatus: status as InvoiceStatus,
    paymentDate,
    notes,
    clientId,
    assignmentIds,
  };
}

function getTrimmedString(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function getUniqueAssignmentIds(value: unknown) {
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

async function getNextInvoiceNo(issueDateRaw?: string | null) {
  const issueDate = issueDateRaw ? new Date(issueDateRaw) : new Date();
  const now = new Date();
  const year = Number.isNaN(issueDate.getTime())
    ? now.getUTCFullYear()
    : issueDate.getUTCFullYear();
  const prefix = `INV-${year}-`;

  const existingInvoices = await db.invoice.findMany({
    where: {
      invoiceNo: {
        startsWith: prefix,
      },
    },
    select: {
      invoiceNo: true,
    },
    orderBy: {
      invoiceNo: "desc",
    },
    take: 250,
  });

  let highestNumber = 0;

  for (const invoice of existingInvoices) {
    const suffix = invoice.invoiceNo.slice(prefix.length);

    if (!/^\d+$/.test(suffix)) {
      continue;
    }

    highestNumber = Math.max(highestNumber, Number(suffix));
  }

  return `${prefix}${String(highestNumber + 1).padStart(4, "0")}`;
}

import { NextResponse } from "next/server";
import { ClientStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const validStatuses = new Set(Object.values(ClientStatus));

export async function GET(req: Request) {
  await requireSession();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const client = await db.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignments: true,
            invoices: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    return NextResponse.json(client);
  }

  const clients = await db.client.findMany({
    orderBy: {
      companyName: "asc",
    },
    include: {
      _count: {
        select: {
          assignments: true,
          invoices: true,
        },
      },
    },
  });

  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  await requireSession();

  try {
    const body = await req.json();

    const clientCode = String(body.clientCode || "").trim();
    const companyName = String(body.companyName || "").trim();
    const contactPerson = String(body.contactPerson || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const address = String(body.address || "").trim();
    const contractNotes = String(body.contractNotes || "").trim();
    const invoiceTerms = String(body.invoiceTerms || "").trim();
    const status = String(body.status || "ACTIVE").trim();

    if (!clientCode) {
      return NextResponse.json(
        { error: "Client code is required." },
        { status: 400 }
      );
    }

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required." },
        { status: 400 }
      );
    }

    if (!validStatuses.has(status as ClientStatus)) {
      return NextResponse.json(
        { error: "Invalid client status." },
        { status: 400 }
      );
    }

    const existingClient = await db.client.findUnique({
      where: {
        clientCode,
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "Client with this client code already exists." },
        { status: 409 }
      );
    }

    const client = await db.client.create({
      data: {
        clientCode,
        companyName,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        contractNotes: contractNotes || null,
        invoiceTerms: invoiceTerms || null,
        status: status as ClientStatus,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create client." },
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
        { error: "Client id is required." },
        { status: 400 }
      );
    }

    const existingClientRecord = await db.client.findUnique({
      where: {
        id,
      },
    });

    if (!existingClientRecord) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    const body = await req.json();

    const clientCode = String(body.clientCode || "").trim();
    const companyName = String(body.companyName || "").trim();
    const contactPerson = String(body.contactPerson || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const address = String(body.address || "").trim();
    const contractNotes = String(body.contractNotes || "").trim();
    const invoiceTerms = String(body.invoiceTerms || "").trim();
    const status = String(body.status || "ACTIVE").trim();

    if (!clientCode) {
      return NextResponse.json(
        { error: "Client code is required." },
        { status: 400 }
      );
    }

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required." },
        { status: 400 }
      );
    }

    if (!validStatuses.has(status as ClientStatus)) {
      return NextResponse.json(
        { error: "Invalid client status." },
        { status: 400 }
      );
    }

    const existingClientCode = await db.client.findUnique({
      where: {
        clientCode,
      },
    });

    if (existingClientCode && existingClientCode.id !== id) {
      return NextResponse.json(
        { error: "Client with this client code already exists." },
        { status: 409 }
      );
    }

    const client = await db.client.update({
      where: {
        id,
      },
      data: {
        clientCode,
        companyName,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        contractNotes: contractNotes || null,
        invoiceTerms: invoiceTerms || null,
        status: status as ClientStatus,
      },
    });

    return NextResponse.json(client);
  } catch {
    return NextResponse.json(
      { error: "Failed to update client." },
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
        { error: "Client id is required." },
        { status: 400 }
      );
    }

    const client = await db.client.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            assignments: true,
            invoices: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    if (client._count.assignments > 0 || client._count.invoices > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete a client with linked assignments or invoices.",
        },
        { status: 400 }
      );
    }

    await db.client.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete client." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { formatUtcDateTime } from "@/lib/format";
import { canAccessFinancials } from "@/lib/roles";

export async function GET(req: Request) {
  const session = await requireSession();

  if (!canAccessFinancials(session.role)) {
    return NextResponse.json(
      { error: "You do not have permission to access invoice PDFs." },
      { status: 403 }
    );
  }

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
    include: {
      client: true,
      assignments: {
        include: {
          assignment: true,
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  let y = 20;

  function ensureSpace(height = 8) {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = 20;
    }
  }

  function addLine(text: string, options?: { bold?: boolean; size?: number }) {
    ensureSpace(options?.size ? options.size / 2 + 4 : 8);
    doc.setFont("helvetica", options?.bold ? "bold" : "normal");
    doc.setFontSize(options?.size ?? 11);
    doc.text(text, margin, y);
    y += (options?.size ?? 11) * 0.45 + 3;
  }

  function addKeyValue(label: string, value: string) {
    ensureSpace(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value || "-", margin + 34, y);
    y += 7;
  }

  function addWrapped(label: string, value: string) {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value || "-", pageWidth - margin * 2 - 34);
    doc.text(lines, margin + 34, y);
    y += lines.length * 5 + 2;
  }

  addLine("Land and Sea System", { bold: true, size: 16 });
  addLine("Invoice", { bold: true, size: 22 });
  y += 2;

  addKeyValue("Invoice No", invoice.invoiceNo);
  addKeyValue("Status", invoice.status);
  addKeyValue("Client", invoice.client.companyName);
  addKeyValue("Client Code", invoice.client.clientCode);
  addKeyValue("Issue Date", formatUtcDateTime(invoice.issueDate.toISOString()));
  addKeyValue("Due Date", formatUtcDateTime(invoice.dueDate.toISOString()));
  addKeyValue(
    "Payment Date",
    invoice.paymentDate
      ? formatUtcDateTime(invoice.paymentDate.toISOString())
      : "-"
  );
  y += 3;

  addLine("Linked Assignments", { bold: true, size: 14 });

  if (invoice.assignments.length === 0) {
    addLine("- None");
  } else {
    for (const item of invoice.assignments) {
      addWrapped(
        "Assignment",
        item.assignment.title || "Untitled Assignment"
      );
    }
  }

  y += 3;
  addWrapped("Notes", invoice.notes || "-");
  y += 3;

  doc.setDrawColor(40, 40, 40);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  addKeyValue("Subtotal", invoice.subtotal.toString());
  addKeyValue("Tax Amount", invoice.taxAmount.toString());
  addKeyValue("Total Amount", invoice.totalAmount.toString());

  const fileName = `${invoice.invoiceNo.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;
  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

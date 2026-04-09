import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { formatUtcDateTime } from "@/lib/format";

export async function GET(req: Request) {
  await requireSession();

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
    include: {
      assignment: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!revenue) {
    return NextResponse.json({ error: "Revenue not found." }, { status: 404 });
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
  addLine("Revenue Record", { bold: true, size: 22 });
  y += 2;

  addKeyValue("Client", revenue.assignment.client.companyName);
  addKeyValue(
    "Assignment",
    revenue.assignment.title || "Untitled Assignment"
  );
  addKeyValue("Category", revenue.revenueCategory || "-");
  addKeyValue("Revenue Date", formatUtcDateTime(revenue.revenueDate.toISOString()));
  y += 3;

  addWrapped("Notes", revenue.notes || "-");
  y += 3;

  doc.setDrawColor(40, 40, 40);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  addKeyValue("Gross Amount", revenue.grossAmount.toString());
  addKeyValue("Deductions", revenue.deductions.toString());
  addKeyValue("Net Amount", revenue.netAmount.toString());

  const dateSlug = revenue.revenueDate.toISOString().slice(0, 10);
  const fileName = `revenue-${dateSlug}.pdf`;
  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

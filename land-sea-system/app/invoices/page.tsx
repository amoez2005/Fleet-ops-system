import { db } from "@/lib/db";
import { requireRoles } from "@/lib/auth";
import { FINANCIAL_ROLES } from "@/lib/roles";
import InvoicesClient from "./InvoicesClient";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  await requireRoles(FINANCIAL_ROLES);

  const [invoices, clients, assignments] = await Promise.all([
    db.invoice.findMany({
      orderBy: {
        issueDate: "desc",
      },
      include: {
        client: true,
        assignments: {
          include: {
            assignment: true,
          },
        },
      },
    }),
    db.client.findMany({
      orderBy: {
        companyName: "asc",
      },
    }),
    db.assignment.findMany({
      orderBy: {
        startDate: "desc",
      },
      include: {
        client: true,
      },
    }),
  ]);

  const safeInvoices = invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    subtotal: invoice.subtotal.toString(),
    taxAmount: invoice.taxAmount.toString(),
    totalAmount: invoice.totalAmount.toString(),
    status: invoice.status,
    paymentDate: invoice.paymentDate?.toISOString() ?? "",
    notes: invoice.notes ?? "",
    clientId: invoice.clientId,
    clientName: invoice.client.companyName,
    assignmentIds: invoice.assignments.map((item) => item.assignmentId),
    assignmentTitles: invoice.assignments.map(
      (item) => item.assignment.title || "Untitled Assignment"
    ),
  }));

  const safeClients = clients.map((client) => ({
    id: client.id,
    clientCode: client.clientCode,
    companyName: client.companyName,
    status: client.status,
  }));

  const safeAssignments = assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title ?? "",
    clientId: assignment.clientId,
    clientName: assignment.client.companyName,
    startDate: assignment.startDate.toISOString(),
    status: assignment.status,
  }));

  return (
    <InvoicesClient
      invoices={safeInvoices}
      clients={safeClients}
      assignments={safeAssignments}
    />
  );
}

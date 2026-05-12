import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { canManageOperations } from "@/lib/roles";
import ClientsClient from "./ClientsClient";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const session = await requireSession();
  const canManage = canManageOperations(session.role);

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

  const safeClients = clients.map((client) => ({
    id: client.id,
    clientCode: client.clientCode,
    companyName: client.companyName,
    contactPerson: client.contactPerson ?? "",
    phone: client.phone ?? "",
    email: client.email ?? "",
    address: client.address ?? "",
    contractNotes: client.contractNotes ?? "",
    invoiceTerms: client.invoiceTerms ?? "",
    status: client.status,
    createdAt: client.createdAt.toISOString(),
    assignmentCount: client._count.assignments,
    invoiceCount: client._count.invoices,
  }));

  return <ClientsClient clients={safeClients} canManage={canManage} />;
}

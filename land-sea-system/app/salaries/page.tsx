import { db } from "@/lib/db";
import { requireRoles } from "@/lib/auth";
import { SALARY_ROLES } from "@/lib/roles";
import SalariesClient from "./SalariesClient";

export const dynamic = "force-dynamic";

export default async function SalariesPage() {
  await requireRoles(SALARY_ROLES);

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

  const safeSalaryRecords = salaryRecords.map((record) => ({
    id: record.id,
    employeeName: record.employeeName,
    roleTitle: record.roleTitle ?? "",
    salaryMonth: record.salaryMonth.toISOString(),
    amount: record.amount.toString(),
    paymentDate: record.paymentDate?.toISOString() ?? "",
    notes: record.notes ?? "",
  }));

  return <SalariesClient salaryRecords={safeSalaryRecords} />;
}

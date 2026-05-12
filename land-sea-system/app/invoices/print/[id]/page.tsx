import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/auth";
import { formatUtcDateTime } from "@/lib/format";
import PrintButton from "@/components/PrintButton";
import { FINANCIAL_ROLES } from "@/lib/roles";
import { palette } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRoles(FINANCIAL_ROLES);

  const { id } = await params;

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
    notFound();
  }

  return (
    <main
      style={{
        padding: "32px",
        background:
          "radial-gradient(circle at top right, rgba(235, 94, 40, 0.08), transparent 24%), linear-gradient(180deg, #FFFCF2 0%, #f3eee7 100%)",
        minHeight: "100vh",
        fontFamily: 'var(--font-geist-sans), "Segoe UI", sans-serif',
        color: palette.carbonBlack,
      }}
    >
      <style>{`
        @page {
          size: A4;
          margin: 12mm;
        }

        @media print {
          .print-hide {
            display: none !important;
          }

          body {
            background: #fff !important;
          }

          .print-sheet {
            box-shadow: none !important;
            border: 1px solid rgba(64, 61, 57, 0.18) !important;
          }
        }
      `}</style>

      <div
        className="print-hide"
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          maxWidth: "960px",
          margin: "0 auto 24px",
        }}
      >
        <Link href="/invoices" style={backLinkStyle}>
          Back to Invoices
        </Link>

        <a href={`/api/invoices/pdf?id=${invoice.id}`} style={backLinkStyle}>
          Download PDF
        </a>

        <PrintButton />
      </div>

      <section
        className="print-sheet"
        style={{
          background: palette.floralWhite,
          maxWidth: "960px",
          margin: "0 auto",
          border: `1px solid ${palette.border}`,
          borderRadius: "22px",
          overflow: "hidden",
          boxShadow: "0 18px 40px rgba(37, 36, 34, 0.08)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: "24px",
            padding: "32px",
            background: "linear-gradient(180deg, #252422 0%, #403D39 100%)",
            color: palette.floralWhite,
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "6px 10px",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: "999px",
                color: "rgba(255, 252, 242, 0.78)",
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "14px",
              }}
            >
              Land and Sea System
            </div>
            <h1 style={{ margin: "0 0 10px", fontSize: "36px" }}>Invoice</h1>
            <p style={{ margin: 0, color: "rgba(255, 252, 242, 0.76)", maxWidth: "460px" }}>
              Clean printable invoice record for client billing and internal
              finance tracking.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: "10px",
              justifyItems: "end",
              alignContent: "start",
            }}
          >
            <div style={metaBadgeStyle}>Invoice No: {invoice.invoiceNo}</div>
            <div style={metaBadgeStyle}>Status: {invoice.status}</div>
            <div style={metaBadgeStyle}>
              Issue: {formatUtcDateTime(invoice.issueDate.toISOString())}
            </div>
            <div style={metaBadgeStyle}>
              Due: {formatUtcDateTime(invoice.dueDate.toISOString())}
            </div>
          </div>
        </div>

        <div style={{ padding: "32px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            <div style={infoCardStyle}>
              <h2 style={cardHeadingStyle}>Client</h2>
              <div style={primaryValueStyle}>{invoice.client.companyName}</div>
              <div style={secondaryTextStyle}>
                Client Code: {invoice.client.clientCode}
              </div>
            </div>

            <div style={infoCardStyle}>
              <h2 style={cardHeadingStyle}>Payment</h2>
              <div style={primaryValueStyle}>
                {invoice.paymentDate
                  ? formatUtcDateTime(invoice.paymentDate.toISOString())
                  : "Not paid"}
              </div>
              <div style={secondaryTextStyle}>Payment date</div>
            </div>

            <div style={infoCardStyle}>
              <h2 style={cardHeadingStyle}>Notes</h2>
              <div style={{ ...primaryValueStyle, fontSize: "15px" }}>
                {invoice.notes || "-"}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <h2 style={sectionHeadingStyle}>Linked Assignments</h2>

            {invoice.assignments.length === 0 ? (
              <div style={emptyBoxStyle}>No assignments linked.</div>
            ) : (
              <div style={tableWrapStyle}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr style={{ background: palette.carbonBlack, color: palette.floralWhite }}>
                      <th style={tableHeadStyle}>Assignment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.assignments.map((item) => (
                      <tr key={item.id}>
                        <td style={tableCellStyle}>
                          {item.assignment.title || "Untitled Assignment"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 320px",
              gap: "24px",
              alignItems: "start",
            }}
          >
            <div style={summaryCardStyle}>
              <div style={summaryRowStyle}>
                <span>Subtotal</span>
                <strong>{invoice.subtotal.toString()}</strong>
              </div>
              <div style={summaryRowStyle}>
                <span>Tax</span>
                <strong>{invoice.taxAmount.toString()}</strong>
              </div>
              <div style={summaryTotalStyle}>
                <span>Total</span>
                <strong>{invoice.totalAmount.toString()}</strong>
              </div>
            </div>

            <div
              style={{
                paddingTop: "24px",
              }}
            >
              <div
                style={{
                  borderTop: `1px solid ${palette.silver}`,
                  paddingTop: "10px",
                  color: palette.mutedText,
                  fontSize: "13px",
                }}
              >
                Authorized Signature
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const backLinkStyle: React.CSSProperties = {
  padding: "10px 16px",
  border: `1px solid ${palette.borderStrong}`,
  borderRadius: "999px",
  background: palette.softSurfaceStrong,
  color: palette.carbonBlack,
  textDecoration: "none",
  fontWeight: 700,
};

const metaBadgeStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.05)",
  fontSize: "13px",
};

const infoCardStyle: React.CSSProperties = {
  border: `1px solid ${palette.border}`,
  borderRadius: "16px",
  padding: "18px",
  background: "rgba(255, 252, 242, 0.84)",
};

const cardHeadingStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: palette.mutedText,
};

const primaryValueStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  marginBottom: "6px",
};

const secondaryTextStyle: React.CSSProperties = {
  color: palette.mutedText,
  fontSize: "14px",
};

const sectionHeadingStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "20px",
};

const emptyBoxStyle: React.CSSProperties = {
  border: `1px dashed ${palette.silver}`,
  borderRadius: "16px",
  padding: "18px",
  color: palette.mutedText,
};

const tableWrapStyle: React.CSSProperties = {
  border: `1px solid ${palette.border}`,
  borderRadius: "16px",
  overflow: "hidden",
};

const tableHeadStyle: React.CSSProperties = {
  padding: "14px 16px",
  textAlign: "left",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tableCellStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderTop: `1px solid ${palette.border}`,
};

const summaryCardStyle: React.CSSProperties = {
  border: `1px solid ${palette.accentBorder}`,
  borderRadius: "18px",
  padding: "18px",
  background: palette.carbonBlack,
  color: palette.floralWhite,
};

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "24px",
  padding: "8px 0",
  color: "rgba(255, 252, 242, 0.76)",
};

const summaryTotalStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "24px",
  paddingTop: "14px",
  marginTop: "10px",
  borderTop: "1px solid rgba(255,255,255,0.2)",
  fontSize: "22px",
};

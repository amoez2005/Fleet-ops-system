import Link from "next/link";
import { AssetStatus, AssignmentStatus, InvoiceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  canAccessFinancials,
  canAccessSalaries,
  canAccessUsers,
} from "@/lib/roles";

export const dynamic = "force-dynamic";

const palette = {
  hunterGreen: "#252422",
  sageGreen: "#403D39",
  yellowGreen: "#CCC5B9",
  champagneMist: "#FFFCF2",
  blushedBrick: "#EB5E28",
  carbonBlack: "#252422",
  charcoalBrown: "#403D39",
  silver: "#CCC5B9",
  floralWhite: "#FFFCF2",
  spicyPaprika: "#EB5E28",
  mutedText: "rgba(64, 61, 57, 0.72)",
};

const quickActions = [
  {
    label: "Create Invoice",
    href: "/invoices",
    note: "Billing and PDF export",
    scope: "finance",
  },
  {
    label: "Add Revenue",
    href: "/revenues",
    note: "Record assignment earnings",
    scope: "finance",
  },
  {
    label: "Schedule Maintenance",
    href: "/maintenance",
    note: "Service fleet and equipment",
    scope: "operations",
  },
  {
    label: "Review Assignments",
    href: "/assignments",
    note: "Track active jobs",
    scope: "operations",
  },
];

export default async function Home() {
  const session = await requireSession();
  const canViewFinance = canAccessFinancials(session.role);
  const canViewSalaries = canAccessSalaries(session.role);
  const canViewUsers = canAccessUsers(session.role);
  const now = new Date();
  const currentMonthStart = startOfUtcMonth(now);
  const nextTwoWeeks = addUtcDays(now, 14);
  const monthStarts = Array.from({ length: 12 }, (_, index) =>
    addUtcMonths(currentMonthStart, index - 11)
  );
  const historyStart = monthStarts[0];
  const nextMonthStart = addUtcMonths(currentMonthStart, 1);

  const [
    userCount,
    categoryCount,
    assetCount,
    clientCount,
    assignmentCount,
    revenueCount,
    salaryCount,
    maintenanceCount,
    invoiceCount,
    activeAssignmentCount,
    availableAssetCount,
    overdueInvoiceCount,
    dueSoonMaintenanceCount,
    revenueTotals,
    salaryTotals,
    maintenanceTotals,
    outstandingInvoiceTotals,
    recentInvoices,
    recentRevenues,
    recentSalaries,
    recentMaintenance,
    monthlyRevenues,
  ] = await Promise.all([
    db.user.count(),
    db.category.count(),
    db.asset.count({
      where: {
        deletedAt: null,
      },
    }),
    db.client.count(),
    db.assignment.count(),
    db.revenue.count(),
    db.salaryRecord.count(),
    db.maintenanceRecord.count({
      where: {
        asset: {
          is: {
            deletedAt: null,
          },
        },
      },
    }),
    db.invoice.count(),
    db.assignment.count({
      where: {
        status: AssignmentStatus.ACTIVE,
      },
    }),
    db.asset.count({
      where: {
        deletedAt: null,
        operationalStatus: AssetStatus.AVAILABLE,
      },
    }),
    db.invoice.count({
      where: {
        status: InvoiceStatus.OVERDUE,
      },
    }),
    db.maintenanceRecord.count({
      where: {
        asset: {
          is: {
            deletedAt: null,
          },
        },
        nextDueDate: {
          gte: now,
          lte: nextTwoWeeks,
        },
      },
    }),
    db.revenue.aggregate({
      _sum: {
        netAmount: true,
      },
    }),
    db.salaryRecord.aggregate({
      _sum: {
        amount: true,
      },
    }),
    db.maintenanceRecord.aggregate({
      where: {
        asset: {
          is: {
            deletedAt: null,
          },
        },
      },
      _sum: {
        cost: true,
      },
    }),
    db.invoice.aggregate({
      where: {
        status: {
          in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.OVERDUE],
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    db.invoice.findMany({
      orderBy: {
        issueDate: "desc",
      },
      take: 4,
      include: {
        client: true,
      },
    }),
    db.revenue.findMany({
      orderBy: {
        revenueDate: "desc",
      },
      take: 4,
      include: {
        assignment: {
          include: {
            client: true,
          },
        },
      },
    }),
    db.salaryRecord.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
      select: {
        id: true,
        employeeName: true,
        roleTitle: true,
        salaryMonth: true,
        amount: true,
        paymentDate: true,
      },
    }),
    db.maintenanceRecord.findMany({
      where: {
        asset: {
          is: {
            deletedAt: null,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 4,
      include: {
        asset: true,
      },
    }),
    db.revenue.findMany({
      where: {
        revenueDate: {
          gte: historyStart,
          lt: nextMonthStart,
        },
      },
      select: {
        revenueDate: true,
        netAmount: true,
      },
    }),
  ]);

  const totalIncome = toNumber(revenueTotals._sum.netAmount);
  const salaryCost = toNumber(salaryTotals._sum.amount);
  const maintenanceCost = toNumber(maintenanceTotals._sum.cost);
  const totalExpenses = salaryCost + maintenanceCost;
  const netPosition = totalIncome - totalExpenses;
  const outstandingAmount = toNumber(outstandingInvoiceTotals._sum.totalAmount);

  const revenueSeries = buildRevenueSeries(monthStarts, monthlyRevenues);
  const revenueChart = buildLineChart(revenueSeries.map((item) => item.value));
  const expenseSplit = buildDonutSegments([
    {
      label: "Salaries",
      value: salaryCost,
      color: palette.sageGreen,
    },
    {
      label: "Maintenance",
      value: maintenanceCost,
      color: palette.blushedBrick,
    },
  ]);

  const summaryCards = canViewFinance
    ? [
        {
          label: "Total Income",
          value: formatAmount(totalIncome),
          note: "Net revenue booked across assignments",
          accent: palette.hunterGreen,
        },
        {
          label: "Total Expenses",
          value: formatAmount(totalExpenses),
          note: "Salary and maintenance obligations",
          accent: palette.blushedBrick,
        },
        {
          label: "Net",
          value: formatAmount(netPosition),
          note: netPosition >= 0 ? "+ healthy position" : "- needs attention",
          accent: netPosition >= 0 ? palette.yellowGreen : palette.blushedBrick,
        },
      ]
    : [
        {
          label: "Active Assignments",
          value: String(activeAssignmentCount),
          note: "Current operational workload",
          accent: palette.hunterGreen,
        },
        {
          label: "Available Assets",
          value: String(availableAssetCount),
          note: "Ready for dispatch",
          accent: palette.yellowGreen,
        },
        {
          label: "Due Soon Maintenance",
          value: String(dueSoonMaintenanceCount),
          note: dueSoonMaintenanceCount > 0 ? "Needs scheduling" : "Nothing urgent",
          accent:
            dueSoonMaintenanceCount > 0
              ? palette.blushedBrick
              : palette.sageGreen,
        },
      ];

  const radarItems = [
    ...(canViewFinance
      ? [
          {
            label: "Overdue Invoices",
            value: overdueInvoiceCount,
            note: "Needs finance follow-up",
            href: "/invoices?focus=overdue",
            urgent: overdueInvoiceCount > 0,
          },
        ]
      : []),
    {
      label: "Due Soon Maintenance",
      value: dueSoonMaintenanceCount,
      note: "Next 14 days",
      href: "/maintenance?focus=due-soon",
      urgent: dueSoonMaintenanceCount > 0,
    },
    {
      label: "Active Assignments",
      value: activeAssignmentCount,
      note: "Operational workload",
      href: "/assignments?focus=active",
      urgent: false,
    },
    {
      label: "Available Assets",
      value: availableAssetCount,
      note: "Ready for dispatch",
      href: "/assets?focus=available",
      urgent: false,
    },
  ];

  const moduleSnapshot = [
    ...(canViewFinance
      ? [
          {
            label: "Invoices",
            description: "billing pipeline",
            href: "/invoices",
            value: invoiceCount,
          },
          {
            label: "Revenues",
            description: "confirmed earnings",
            href: "/revenues",
            value: revenueCount,
          },
        ]
      : []),
    {
      label: "Assignments",
      description: "active job records",
      href: "/assignments",
      value: assignmentCount,
    },
    {
      label: "Assets",
      description: "fleet and equipment",
      href: "/assets",
      value: assetCount,
    },
    ...(canViewSalaries
      ? [
          {
            label: "Salaries",
            description: "payroll records",
            href: "/salaries",
            value: salaryCount,
          },
        ]
      : []),
    {
      label: "Clients",
      description: "account relationships",
      href: "/clients",
      value: clientCount,
    },
    {
      label: "Maintenance",
      description: "service workload",
      href: "/maintenance",
      value: maintenanceCount,
    },
  ];

  const recentActivity = [
    ...(canViewFinance
      ? recentInvoices.map((invoice) => ({
          id: `invoice-${invoice.id}`,
          date: invoice.issueDate,
          description: `${invoice.invoiceNo} for ${invoice.client.companyName}`,
          category: `Invoice / ${invoice.status}`,
          amount: formatAmount(invoice.totalAmount),
        }))
      : []),
    ...(canViewFinance
      ? recentRevenues.map((revenue) => ({
          id: `revenue-${revenue.id}`,
          date: revenue.revenueDate,
          description: `${revenue.assignment.title || "Untitled Assignment"} / ${revenue.assignment.client.companyName}`,
          category: `Revenue / ${revenue.revenueCategory || "General"}`,
          amount: formatAmount(revenue.netAmount),
        }))
      : []),
    ...(canViewSalaries
      ? recentSalaries.map((salary) => ({
          id: `salary-${salary.id}`,
          date: salary.paymentDate ?? salary.salaryMonth,
          description: `${salary.employeeName} salary record`,
          category: `Salary / ${salary.roleTitle || "Payroll"}`,
          amount: formatAmount(salary.amount),
        }))
      : []),
    ...recentMaintenance.map((record) => ({
      id: `maintenance-${record.id}`,
      date: record.nextDueDate ?? record.lastServiceDate ?? record.createdAt,
      description: `${record.asset.assetCode} ${record.serviceType}`,
      category: `Maintenance / ${record.vendor || "Internal"}`,
      amount: record.cost ? formatAmount(record.cost) : "-",
    })),
  ]
    .sort((left, right) => right.date.getTime() - left.date.getTime())
    .slice(0, 8);

  const visibleQuickActions = quickActions.filter((item) =>
    item.scope === "finance" ? canViewFinance : true
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right, rgba(235, 94, 40, 0.10), transparent 24%), radial-gradient(circle at top left, rgba(204, 197, 185, 0.42), transparent 28%), linear-gradient(180deg, #FFFCF2 0%, #f3eee7 100%)",
        color: palette.hunterGreen,
        fontFamily: 'var(--font-geist-sans), "Segoe UI", sans-serif',
      }}
    >
      <style>{`
        .dashboard-shell {
          max-width: 1480px;
          margin: 0 auto;
          min-height: 100vh;
          padding: clamp(16px, 2.4vw, 32px);
        }

        .dashboard-topbar {
          display: grid;
          gap: 18px;
          padding: clamp(18px, 2vw, 24px);
          border: 1px solid rgba(64, 61, 57, 0.14);
          border-radius: 22px;
          background: rgba(255, 252, 242, 0.88);
          box-shadow: 0 18px 44px rgba(37, 36, 34, 0.08);
          backdrop-filter: blur(16px);
          margin-bottom: 18px;
        }

        .dashboard-topbar-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .dashboard-content {
          display: grid;
          gap: 16px;
        }

        .dashboard-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .utility-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .insight-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(260px, 1fr) minmax(260px, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .activity-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 6px;
        }

        @media (max-width: 1180px) {
          .summary-grid,
          .utility-grid,
          .insight-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 980px) {
          .dashboard-topbar-main {
            flex-direction: column;
            align-items: stretch;
          }

          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .dashboard-content {
            gap: 14px;
          }

          .dashboard-hero {
            gap: 14px;
          }
        }
      `}</style>

      <div className="dashboard-shell">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-main">
            <div
              style={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: palette.carbonBlack,
                  marginBottom: "10px",
                }}
              >
                Land & Sea
              </div>
              <div
                style={{
                  color: palette.blushedBrick,
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Overview
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  letterSpacing: "-0.05em",
                  color: palette.carbonBlack,
                  marginBottom: "6px",
                }}
              >
                Calm operations and finance snapshot
              </div>
              <p style={{ margin: 0, color: palette.mutedText, maxWidth: "620px" }}>
                A lighter, more minimal dashboard that keeps the same palette and
                softer surfaces as the rest of the app.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={topbarMetaCardStyle}>
                <div style={{ fontWeight: 700 }}>{formatHeaderDate(now)}</div>
                <div style={topbarMetaSubtleStyle}>Live dashboard</div>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: `1px solid ${palette.sageGreen}33`,
                  background: "rgba(255, 252, 242, 0.86)",
                  minWidth: "min(100%, 170px)",
                }}
              >
                <div style={{ fontWeight: 700 }}>{session.name}</div>
                <div style={{ color: palette.sageGreen, fontSize: "12px" }}>
                  {formatRole(session.role)}
                </div>
              </div>

            </div>
            </div>

          </header>

          <div className="dashboard-content">
            <div className="dashboard-hero">
              <div style={{ maxWidth: "640px" }}>
                <div
                  style={{
                    color: palette.blushedBrick,
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                  }}
                >
                  System Pulse
                </div>
                <h1
                  style={{
                    margin: "0 0 8px",
                    fontSize: "clamp(24px, 5vw, 30px)",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    fontFamily: 'var(--font-geist-sans), "Segoe UI", sans-serif',
                  }}
                >
                  A quieter view of daily operations
                </h1>
                <p style={{ margin: 0, color: palette.sageGreen, lineHeight: 1.6 }}>
                  Finance, payroll, fleet, maintenance, and recent activity all in
                  one place, with the same restrained tone as the rest of the
                  product.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    ...heroMetricCardStyle,
                    minWidth: "min(100%, 220px)",
                    flex: "1 1 220px",
                  }}
                >
                  <div style={heroMetricLabelStyle}>
                    {canViewFinance ? "Outstanding invoices" : "Due soon maintenance"}
                  </div>
                  <div style={heroMetricValueStyle}>
                    {canViewFinance
                      ? formatAmount(outstandingAmount)
                      : String(dueSoonMaintenanceCount)}
                  </div>
                </div>

                {canViewFinance ? (
                  <div style={heroMiniPillStyle}>
                    <span>Overdue</span>
                    <strong>{overdueInvoiceCount}</strong>
                  </div>
                ) : null}

                <div style={heroMiniPillStyle}>
                  <span>Available assets</span>
                  <strong>{availableAssetCount}</strong>
                </div>
              </div>
            </div>

            <div className="summary-grid">
              {summaryCards.map((card) => (
                <section
                  key={card.label}
                  style={{
                    border: `1px solid ${palette.sageGreen}33`,
                    borderRadius: "20px",
                    padding: "20px",
                    background: "rgba(255, 252, 242, 0.92)",
                    boxShadow: "0 14px 30px rgba(37, 36, 34, 0.06)",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "4px",
                      borderRadius: "999px",
                      background: card.accent,
                      marginBottom: "14px",
                    }}
                  />
                  <div
                    style={{
                      color: palette.sageGreen,
                      marginBottom: "10px",
                      fontSize: "13px",
                    }}
                  >
                    {card.label}
                  </div>
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: 800,
                      letterSpacing: "-0.04em",
                      marginBottom: "10px",
                    }}
                  >
                    {card.value}
                  </div>
                  <div
                    style={{
                      color: card.accent,
                      fontWeight: 700,
                      fontSize: "13px",
                    }}
                  >
                    {card.note}
                  </div>
                </section>
              ))}
            </div>

            <div className="utility-grid">
              <section style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div>
                    <h2 style={panelTitleStyle}>Quick Actions</h2>
                    <p style={panelSubtitleStyle}>
                      Jump straight into the busiest workflows.
                    </p>
                  </div>
                </div>

                <div style={quickActionGridStyle}>
                  {visibleQuickActions.map((item) => (
                    <Link key={item.href} href={item.href} style={quickActionCardStyle}>
                      <div style={quickActionLabelStyle}>{item.label}</div>
                      <div style={quickActionNoteStyle}>{item.note}</div>
                    </Link>
                  ))}
                </div>
              </section>

              <section style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div>
                    <h2 style={panelTitleStyle}>Operational Focus</h2>
                    <p style={panelSubtitleStyle}>
                      A simple read on what needs attention next.
                    </p>
                  </div>
                </div>

                <div style={radarGridStyle}>
                  {radarItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      style={{
                        ...radarRowStyle,
                        border: item.urgent
                          ? `1px solid ${palette.blushedBrick}55`
                          : radarRowStyle.border,
                        background: item.urgent
                          ? "rgba(235, 94, 40, 0.10)"
                          : radarRowStyle.background,
                        boxShadow: item.urgent
                          ? "0 14px 30px rgba(235, 94, 40, 0.08)"
                          : "none",
                        textDecoration: "none",
                        color: palette.hunterGreen,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            ...radarLabelStyle,
                            color: item.urgent
                              ? palette.blushedBrick
                              : radarLabelStyle.color,
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            ...radarNoteStyle,
                            color: item.urgent
                              ? palette.charcoalBrown
                              : radarNoteStyle.color,
                          }}
                        >
                          {item.note}
                        </div>
                      </div>
                      <div
                        style={{
                          ...radarValueStyle,
                          background: item.urgent
                            ? palette.blushedBrick
                            : radarValueStyle.background,
                          color: item.urgent
                            ? palette.floralWhite
                            : radarValueStyle.color,
                        }}
                      >
                        {item.value}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <div className="insight-grid">
              {canViewFinance ? (
              <section style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div>
                    <h2 style={panelTitleStyle}>Revenue (12 months)</h2>
                    <p style={panelSubtitleStyle}>Updated monthly</p>
                  </div>
                </div>

                <svg
                  viewBox="0 0 540 240"
                  style={{
                    width: "100%",
                    height: "240px",
                    display: "block",
                    marginBottom: "14px",
                  }}
                >
                  {revenueChart.gridLines.map((line) => (
                    <line
                      key={line.key}
                      x1="36"
                      x2="504"
                      y1={line.y}
                      y2={line.y}
                      stroke="rgba(64, 61, 57, 0.12)"
                      strokeWidth="1"
                    />
                  ))}

                  <path
                    d={revenueChart.areaPath}
                    fill="rgba(204, 197, 185, 0.26)"
                  />
                  <path
                    d={revenueChart.linePath}
                    fill="none"
                    stroke={palette.hunterGreen}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {revenueChart.points.map((point) => (
                    <circle
                      key={point.key}
                      cx={point.x}
                      cy={point.y}
                      r="3.5"
                      fill={palette.champagneMist}
                      stroke={palette.hunterGreen}
                      strokeWidth="2"
                    />
                  ))}
                </svg>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                    gap: "6px",
                    color: palette.sageGreen,
                    fontSize: "11px",
                    textAlign: "center",
                  }}
                >
                  {revenueSeries.map((item) => (
                    <div key={item.key}>{item.label}</div>
                  ))}
                </div>
              </section>
              ) : null}

              {canViewFinance || canViewSalaries ? (
              <section style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div>
                    <h2 style={panelTitleStyle}>Expense Split</h2>
                    <p style={panelSubtitleStyle}>
                      Salary vs maintenance costs
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    justifyItems: "center",
                    gap: "18px",
                    paddingTop: "8px",
                  }}
                >
                  <svg
                    viewBox="0 0 160 160"
                    style={{ width: "220px", maxWidth: "100%" }}
                  >
                    <circle
                      cx="80"
                      cy="80"
                      r="42"
                      fill="none"
                      stroke="rgba(204, 197, 185, 0.32)"
                      strokeWidth="18"
                    />

                    {expenseSplit.segments.map((segment) => (
                      <circle
                        key={segment.label}
                        cx="80"
                        cy="80"
                        r="42"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="18"
                        strokeLinecap="round"
                        strokeDasharray={`${segment.length} ${expenseSplit.circumference}`}
                        strokeDashoffset={-segment.offset}
                        transform="rotate(-90 80 80)"
                      />
                    ))}
                  </svg>

                  <div
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "16px",
                      border: `1px solid ${palette.sageGreen}22`,
                      background: "rgba(255, 252, 242, 0.82)",
                      display: "grid",
                      gap: "6px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        color: palette.sageGreen,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        fontWeight: 700,
                      }}
                    >
                      Total expense pool
                    </div>
                    <div
                      style={{
                        fontSize: "26px",
                        fontWeight: 800,
                        letterSpacing: "-0.04em",
                        color: palette.carbonBlack,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatAmount(totalExpenses)}
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: "12px", width: "100%" }}>
                    {expenseSplit.segments.map((segment) => (
                      <div
                        key={segment.label}
                        style={{
                          display: "grid",
                          gap: "8px",
                          padding: "12px 14px",
                          borderRadius: "16px",
                          border: `1px solid ${palette.sageGreen}22`,
                          background: "rgba(255, 252, 242, 0.74)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              color: palette.hunterGreen,
                            }}
                          >
                            <span
                              style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "999px",
                                background: segment.color,
                                display: "inline-block",
                                flexShrink: 0,
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: 700 }}>{segment.label}</div>
                              <div
                                style={{
                                  color: palette.sageGreen,
                                  fontSize: "12px",
                                }}
                              >
                                {formatExpenseShare(segment.value, totalExpenses)} of total
                              </div>
                            </div>
                          </div>
                          <strong
                            style={{
                              color: palette.carbonBlack,
                              fontSize: "15px",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {formatAmount(segment.value)}
                          </strong>
                        </div>
                        <div
                          style={{
                            height: "8px",
                            borderRadius: "999px",
                            background: "rgba(204, 197, 185, 0.24)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${getExpenseShareWidth(segment.value, totalExpenses)}%`,
                              height: "100%",
                              borderRadius: "999px",
                              background: segment.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
              ) : null}

              <section style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div>
                    <h2 style={panelTitleStyle}>Modules</h2>
                    <p style={panelSubtitleStyle}>Core areas with live counts</p>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  {moduleSnapshot.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        paddingBottom: "12px",
                        borderBottom: "1px solid rgba(64, 61, 57, 0.1)",
                        textDecoration: "none",
                        color: palette.hunterGreen,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                          {item.label}
                        </div>
                        <div
                          style={{ color: palette.sageGreen, fontSize: "13px" }}
                        >
                          {item.description}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, fontSize: "18px" }}>
                          {item.value}
                        </div>
                        <div
                          style={{ color: palette.sageGreen, fontSize: "12px" }}
                        >
                          open
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <section style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <h2 style={panelTitleStyle}>Recent Activity</h2>
                  <p style={panelSubtitleStyle}>
                    Latest records visible to your role.
                  </p>
                </div>

                <div style={{ color: palette.sageGreen, fontSize: "13px" }}>
                  {canViewUsers
                    ? `Users ${userCount} / Categories ${categoryCount}`
                    : `Categories ${categoryCount}`}
                </div>
              </div>

              <div className="activity-wrap">
                <table
                  style={{
                    width: "100%",
                    minWidth: "640px",
                    borderCollapse: "collapse",
                    border: `1px solid ${palette.sageGreen}33`,
                    borderRadius: "14px",
                    overflow: "hidden",
                    background: "rgba(255, 252, 242, 0.78)",
                  }}
                >
                  <thead>
                    <tr style={{ background: "rgba(204, 197, 185, 0.26)" }}>
                      <th style={tableHeadStyle}>Date</th>
                      <th style={tableHeadStyle}>Description</th>
                      <th style={tableHeadStyle}>Category</th>
                      <th style={tableHeadStyle}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.length === 0 ? (
                      <tr>
                        <td style={tableCellStyle} colSpan={4}>
                          No recent records found.
                        </td>
                      </tr>
                    ) : (
                      recentActivity.map((item) => (
                        <tr key={item.id}>
                          <td style={tableCellStyle}>
                            {formatDashboardDate(item.date)}
                          </td>
                          <td style={tableCellStyle}>{item.description}</td>
                          <td style={tableCellStyle}>{item.category}</td>
                          <td style={{ ...tableCellStyle, textAlign: "right" }}>
                            {item.amount}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
      </div>
    </main>
  );
}

const panelStyle: React.CSSProperties = {
  border: `1px solid ${palette.sageGreen}33`,
  borderRadius: "22px",
  padding: "22px",
  background: "rgba(255, 252, 242, 0.9)",
  boxShadow: "0 18px 44px rgba(37, 36, 34, 0.08)",
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const panelTitleStyle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "18px",
};

const panelSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: palette.sageGreen,
  fontSize: "13px",
};

const topbarMetaCardStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: `1px solid ${palette.sageGreen}33`,
  background: "rgba(255, 252, 242, 0.86)",
  minWidth: "112px",
};

const topbarMetaSubtleStyle: React.CSSProperties = {
  color: palette.sageGreen,
  fontSize: "12px",
};

const heroMetricCardStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: "18px",
  border: `1px solid rgba(235, 94, 40, 0.18)`,
  background: "rgba(235, 94, 40, 0.08)",
};

const heroMetricLabelStyle: React.CSSProperties = {
  color: palette.mutedText,
  fontSize: "13px",
  marginBottom: "6px",
};

const heroMetricValueStyle: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 800,
  letterSpacing: "-0.04em",
};

const heroMiniPillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px 14px",
  borderRadius: "999px",
  border: `1px solid ${palette.sageGreen}22`,
  background: "rgba(255, 252, 242, 0.84)",
  color: palette.hunterGreen,
  fontSize: "13px",
};

const quickActionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
};

const quickActionCardStyle: React.CSSProperties = {
  padding: "16px",
  borderRadius: "16px",
  border: `1px solid ${palette.sageGreen}33`,
  background: "rgba(255, 252, 242, 0.82)",
  textDecoration: "none",
  color: palette.hunterGreen,
};

const quickActionLabelStyle: React.CSSProperties = {
  fontWeight: 800,
  marginBottom: "6px",
};

const quickActionNoteStyle: React.CSSProperties = {
  color: palette.sageGreen,
  fontSize: "13px",
  lineHeight: 1.4,
};

const radarGridStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const radarRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "14px 16px",
  borderRadius: "16px",
  border: `1px solid ${palette.sageGreen}33`,
  background: "rgba(255, 252, 242, 0.82)",
};

const radarLabelStyle: React.CSSProperties = {
  color: palette.sageGreen,
  fontSize: "13px",
  marginBottom: "4px",
};

const radarValueStyle: React.CSSProperties = {
  minWidth: "44px",
  textAlign: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(204, 197, 185, 0.24)",
  fontSize: "16px",
  fontWeight: 800,
  color: palette.carbonBlack,
};

const radarNoteStyle: React.CSSProperties = {
  color: palette.sageGreen,
  fontSize: "12px",
};

const tableHeadStyle: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  borderBottom: `1px solid ${palette.sageGreen}33`,
  color: palette.sageGreen,
  fontSize: "13px",
};

const tableCellStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid rgba(64, 61, 57, 0.1)",
  color: palette.hunterGreen,
  fontSize: "14px",
};

function buildRevenueSeries(
  monthStarts: Date[],
  revenues: Array<{ revenueDate: Date; netAmount: { toString(): string } }>
) {
  const buckets = new Map(
    monthStarts.map((monthStart) => [
      getMonthKey(monthStart),
      {
        key: getMonthKey(monthStart),
        label: formatMonthLabel(monthStart),
        value: 0,
      },
    ])
  );

  for (const revenue of revenues) {
    const bucket = buckets.get(getMonthKey(revenue.revenueDate));

    if (bucket) {
      bucket.value += toNumber(revenue.netAmount);
    }
  }

  return monthStarts.map((monthStart) => buckets.get(getMonthKey(monthStart))!);
}

function buildLineChart(values: number[]) {
  const width = 540;
  const height = 240;
  const paddingX = 36;
  const paddingTop = 20;
  const paddingBottom = 28;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(1, ...values);

  const points = values.map((value, index) => {
    const x = paddingX + (index / Math.max(values.length - 1, 1)) * innerWidth;
    const y = paddingTop + innerHeight - (value / maxValue) * innerHeight;

    return {
      key: `${index}-${value}`,
      x,
      y,
    };
  });

  const linePath = points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1]?.x.toFixed(2) ?? paddingX} ${(height - paddingBottom).toFixed(2)} L ${points[0]?.x.toFixed(2) ?? paddingX} ${(height - paddingBottom).toFixed(2)} Z`;

  const gridLines = Array.from({ length: 4 }, (_, index) => ({
    key: `grid-${index}`,
    y: paddingTop + (innerHeight / 3) * index,
  }));

  return {
    points,
    linePath,
    areaPath,
    gridLines,
  };
}

function buildDonutSegments(
  items: Array<{ label: string; value: number; color: string }>
) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;

  return {
    segments: items.map((item) => ({
      ...item,
      length: total > 0 ? (item.value / total) * circumference : 0,
      offset: (() => {
        const currentOffset = offset;
        offset += total > 0 ? (item.value / total) * circumference : 0;
        return currentOffset;
      })(),
    })),
    circumference,
  };
}

function toNumber(value: { toString(): string } | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  const numericValue = Number(value.toString());

  return Number.isNaN(numericValue) ? 0 : numericValue;
}

function formatAmount(value: number | { toString(): string } | null | undefined) {
  const numericValue = typeof value === "number" ? value : toNumber(value);

  return numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatExpenseShare(value: number, total: number) {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function getExpenseShareWidth(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.max((value / total) * 100, 6);
}

function startOfUtcMonth(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function addUtcMonths(value: Date, months: number) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, 1)
  );
}

function addUtcDays(value: Date, days: number) {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate() + days
    )
  );
}

function getMonthKey(value: Date) {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function formatMonthLabel(value: Date) {
  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${monthLabels[value.getUTCMonth()]} ${String(
    value.getUTCFullYear()
  ).slice(-2)}`;
}

function formatDashboardDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatHeaderDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatRole(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

import { db } from "../../lib/db";
import { requireSession } from "../../lib/auth";
import DashboardHomeLink from "@/components/DashboardHomeLink";
import { formatUtcDateTime } from "@/lib/format";
import {
  getStatusBadgeStyle,
  noteStyle,
  pageHeaderStyle,
  pageStyle,
  panelStyle,
  pageTitleStyle,
  tableContainerStyle,
  tableHeadRowStyle,
  tableMetaTextStyle,
  tableStyle,
  tdStyle,
  thStyle,
} from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireSession();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={pageStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={pageTitleStyle}>Users</h1>
        </div>

        <DashboardHomeLink />
      </div>

      <div className="landsea-list-panel" style={panelStyle}>
        <div className="landsea-list-scroll" style={tableContainerStyle}>
          <table
            style={tableStyle}
          >
            <thead>
              <tr style={tableHeadRowStyle}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Active</th>
                <th style={thStyle}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={tdStyle}>{user.name}</td>
                  <td style={tdStyle}>{user.email}</td>
                  <td style={tdStyle}>{user.role}</td>
                  <td style={tdStyle}>
                    <span style={getStatusBadgeStyle(user.isActive ? "YES" : "NO")}>
                      {user.isActive ? "Yes" : "No"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={tableMetaTextStyle}>
                      {formatUtcDateTime(user.createdAt.toISOString())}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p style={noteStyle}>User management remains read-only from this page.</p>
    </main>
  );
}

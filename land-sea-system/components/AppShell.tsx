"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  BriefcaseBusiness,
  CircleDollarSign,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Truck,
  UserSquare2,
  Users,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import { palette } from "@/lib/ui";

type AppShellProps = {
  children: ReactNode;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Categories", href: "/categories", icon: FolderKanban },
  { label: "Assets", href: "/assets", icon: Truck },
  { label: "Clients", href: "/clients", icon: UserSquare2 },
  { label: "Assignments", href: "/assignments", icon: BriefcaseBusiness },
  { label: "Revenues", href: "/revenues", icon: CircleDollarSign },
  { label: "Salaries", href: "/salaries", icon: Users },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
  { label: "Invoices", href: "/invoices", icon: FileText },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!pathname || shouldHideSidebar(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <style>{`
        .landsea-shell-frame {
          --sidebar-expanded: 272px;
          --sidebar-collapsed: 96px;
          min-height: 100vh;
          background: var(--page-wash);
        }

        .landsea-shell-sidebar {
          position: fixed;
          top: 16px;
          left: 16px;
          bottom: 16px;
          width: var(--sidebar-expanded);
          border: 1px solid rgba(255, 252, 242, 0.08);
          border-radius: 32px;
          background:
            radial-gradient(circle at top right, rgba(235, 94, 40, 0.14), transparent 24%),
            linear-gradient(180deg, #252422 0%, #403D39 100%);
          box-shadow: 0 24px 54px rgba(37, 36, 34, 0.16);
          backdrop-filter: blur(16px);
          z-index: 60;
          display: flex;
          flex-direction: column;
          padding: 18px 14px;
          gap: 12px;
          transition:
            width 180ms ease,
            transform 180ms ease,
            opacity 180ms ease;
          overflow: hidden;
        }

        .landsea-shell-main {
          min-width: 0;
          min-height: 100vh;
          padding-left: calc(var(--sidebar-collapsed) + 8px);
          padding-right: 8px;
          background: var(--page-wash);
          overflow-x: clip;
        }

        .landsea-shell-main > * {
          min-width: 0;
          max-width: 100%;
        }

        .landsea-shell-overlay {
          position: fixed;
          inset: 0;
          background: rgba(37, 36, 34, 0.18);
          opacity: 0;
          pointer-events: none;
          transition: opacity 180ms ease;
          z-index: 50;
        }

        .landsea-shell-brand-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .landsea-shell-brand-mark {
          width: 48px;
          height: 48px;
          border-radius: 18px;
          background: ${palette.spicyPaprika};
          color: ${palette.floralWhite};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          letter-spacing: -0.04em;
          flex-shrink: 0;
        }

        .landsea-shell-brand-copy {
          min-width: 0;
          flex: 1;
        }

        .landsea-shell-brand-title {
          font-weight: 800;
          letter-spacing: -0.04em;
          color: ${palette.floralWhite};
          margin-bottom: 2px;
        }

        .landsea-shell-brand-note {
          color: rgba(255, 252, 242, 0.68);
          font-size: 12px;
        }

        .landsea-shell-icon-button {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          border: 1px solid rgba(255, 252, 242, 0.1);
          background: rgba(255, 252, 242, 0.06);
          color: ${palette.floralWhite};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .landsea-shell-mobile-toggle {
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 55;
          width: 46px;
          height: 46px;
          border-radius: 16px;
          border: 1px solid rgba(255, 252, 242, 0.12);
          background: rgba(37, 36, 34, 0.92);
          color: ${palette.floralWhite};
          box-shadow: 0 16px 34px rgba(37, 36, 34, 0.22);
          display: none;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .landsea-shell-mobile-close {
          display: none;
        }

        .landsea-shell-nav {
          display: grid;
          gap: 10px;
          min-height: 0;
          padding: 6px 2px 0;
          margin-bottom: 4px;
          overflow-y: auto;
          overflow-x: hidden;
          align-content: start;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .landsea-shell-nav::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }

        .landsea-shell-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          width: 52px;
          height: 52px;
          margin: 0 auto;
          padding: 0;
          border-radius: 999px;
          text-decoration: none;
          color: rgba(255, 252, 242, 0.82);
          border: 1px solid rgba(255, 252, 242, 0.06);
          background: transparent;
          font-weight: 600;
        }

        .landsea-shell-link:hover {
          background: rgba(255, 252, 242, 0.08);
          border-color: rgba(255, 252, 242, 0.12);
        }

        .landsea-shell-link.is-active {
          background: ${palette.spicyPaprika};
          color: ${palette.floralWhite};
          border-color: rgba(255, 252, 242, 0.18);
          box-shadow: 0 14px 28px rgba(235, 94, 40, 0.24);
        }

        .landsea-shell-link-icon {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
        }

        .landsea-shell-link-copy {
          min-width: 0;
          white-space: nowrap;
        }

        .landsea-shell-footer {
          margin-top: auto;
          padding-top: 12px;
          display: grid;
          gap: 12px;
        }

        @media (min-width: 981px) {
          .landsea-shell-sidebar {
            width: var(--sidebar-collapsed);
          }

          .landsea-shell-sidebar:hover {
            width: var(--sidebar-expanded);
          }

          .landsea-shell-brand-copy,
          .landsea-shell-link-copy,
          .landsea-shell-footer .landsea-shell-logout-full {
            opacity: 0;
            width: 0;
            max-width: 0;
            height: 0;
            min-height: 0;
            overflow: hidden;
            pointer-events: none;
            margin: 0;
            padding-left: 0;
            padding-right: 0;
            padding-top: 0;
            padding-bottom: 0;
            border: 0;
          }

          .landsea-shell-brand-row {
            justify-content: center;
          }

          .landsea-shell-footer {
            justify-items: center;
          }

          .landsea-shell-footer .landsea-shell-logout-compact {
            display: inline-flex;
          }

          .landsea-shell-sidebar:hover .landsea-shell-brand-copy,
          .landsea-shell-sidebar:hover .landsea-shell-link-copy,
          .landsea-shell-sidebar:hover .landsea-shell-footer .landsea-shell-logout-full {
            opacity: 1;
            width: auto;
            max-width: none;
            height: auto;
            min-height: initial;
            overflow: visible;
            pointer-events: auto;
            margin: initial;
            padding-left: initial;
            padding-right: initial;
            padding-top: initial;
            padding-bottom: initial;
            border: initial;
          }

          .landsea-shell-sidebar:hover .landsea-shell-link {
            width: 100%;
            margin: 0;
            padding: 0 16px;
            gap: 14px;
            justify-content: flex-start;
            border-radius: 999px;
          }

          .landsea-shell-sidebar:hover .landsea-shell-brand-row {
            justify-content: flex-start;
          }

          .landsea-shell-sidebar:hover .landsea-shell-footer {
            justify-items: stretch;
          }

          .landsea-shell-sidebar:hover .landsea-shell-footer .landsea-shell-logout-compact {
            display: none;
          }
        }

        .landsea-shell-logout-compact {
          display: none;
        }

        @media (max-width: 980px) {
          .landsea-shell-mobile-toggle {
            display: inline-flex;
          }

          .landsea-shell-sidebar {
            transform: translateX(calc(-100% - 24px));
            width: min(82vw, 300px);
          }

          .landsea-shell-frame.is-mobile-open .landsea-shell-sidebar {
            transform: translateX(0);
          }

          .landsea-shell-frame.is-mobile-open .landsea-shell-overlay {
            opacity: 1;
            pointer-events: auto;
          }

          .landsea-shell-main {
            padding-left: 0;
            padding-top: 52px;
            padding-right: 0;
          }

          .landsea-shell-mobile-close {
            display: inline-flex;
          }

          .landsea-shell-link {
            width: 100%;
            height: 56px;
            margin: 0;
            padding: 0 16px;
            gap: 14px;
            justify-content: flex-start;
          }

          .landsea-shell-logout-compact {
            display: none !important;
          }

          .landsea-shell-footer .landsea-shell-logout-full {
            opacity: 1;
            width: auto;
            max-width: none;
            height: auto;
            pointer-events: auto;
          }
        }
      `}</style>

      <button
        type="button"
        className="landsea-shell-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      <div
        className={`landsea-shell-frame${mobileOpen ? " is-mobile-open" : ""}`}
      >
        <div
          className="landsea-shell-overlay"
          onClick={() => setMobileOpen(false)}
        />

        <aside className="landsea-shell-sidebar">
          <div className="landsea-shell-brand-row">
            <div className="landsea-shell-brand-mark">LS</div>

            <div className="landsea-shell-brand-copy">
              <div className="landsea-shell-brand-title">Land & Sea</div>
              <div className="landsea-shell-brand-note">
                Shared navigation
              </div>
            </div>

            <button
              type="button"
              className="landsea-shell-icon-button landsea-shell-mobile-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="landsea-shell-nav">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`landsea-shell-link${active ? " is-active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon className="landsea-shell-link-icon" />
                  <span className="landsea-shell-link-copy">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="landsea-shell-footer">
            <div className="landsea-shell-logout-full">
              <LogoutButton />
            </div>

            <div className="landsea-shell-logout-compact">
              <LogoutButton iconOnly />
            </div>
          </div>
        </aside>

        <div className="landsea-shell-main">{children}</div>
      </div>
    </>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function shouldHideSidebar(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/invoices/print") ||
    pathname.startsWith("/revenues/print")
  );
}

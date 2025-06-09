"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, DollarSign, ClipboardList, Users, Building2, FileText, LogOut, Tags } from "lucide-react";
import { useAuth } from "@/lib/auth";
 

export function MainNav() {
  const pathname = usePathname();
  
  const  {isAuthenticated, isAdmin, isAccountant, logout} =  useAuth();

  const routes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "My Ledger",
      href: "/transactions",
      icon: BookOpen,
    },
    {
      name: "New Transaction",
      href: "/transactions/new",
      icon: DollarSign,
    },
    ...(isAdmin() || isAccountant()
      ? [
          {
            name: "Orders",
            href: "/orders",
            icon: ClipboardList,
          },
        ]
      : []),
    ...(isAdmin()
      ? [
          {
            name: "Employees",
            href: "/employees",
            icon: Users,
          },
          {
            name: "Bank Accounts",
            href: "/settings/bank-accounts",
            icon: Building2,
          },
          {
            name: "Expense Categories",
            href: "/settings/expense-categories",
            icon: Tags,
          },
          {
            name: "Audit Logs",
            href: "/audit",
            icon: FileText,
          },
        ]
      : []),
  ];

  return (
    <div className="flex-1">      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
        {isAuthenticated() ? (
          <>
            {routes.map((route) => {
              const Icon = route.icon;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5",
                    pathname === route.href
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {route.name}
                </Link>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1.5"
              onClick={() => logout()}
              asChild
            >
              <Link href="/">
                <LogOut className="h-4 w-4" />
                Logout
              </Link>
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1.5"
            asChild
          >
            <Link href="/login">
              <LogOut className="h-4 w-4" />
              Login
            </Link>
          </Button>
        )}
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex overflow-x-auto pb-2 gap-2">
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-md transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{route.name}</span>
            </Link>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center justify-center px-3 py-2"
          onClick={() => logout()}
          asChild
        >
          <Link href="/">
            <LogOut className="h-5 w-5" />
            <span className="text-xs mt-1">Logout</span>
          </Link>
        </Button>
      </nav>
    </div>
  );
}
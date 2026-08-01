"use client";
import { DashboardShell, NavItem } from "@/components/dashboard-shell";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  Receipt,
} from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Patients", href: "/admin/patients", icon: Users },
  { label: "Doctors", href: "/admin/doctors", icon: Stethoscope },
  { label: "Receptionists", href: "/admin/receptionists", icon: Users },
  { label: "Appointments", href: "/admin/appointments", icon: CalendarDays },
  { label: "Billing", href: "/admin/billing", icon: Receipt },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell navItems={navItems} roleLabel="Admin">
      {children}
    </DashboardShell>
  );
}

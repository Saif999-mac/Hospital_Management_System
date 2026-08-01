"use client";
import { DashboardShell, NavItem } from "@/components/dashboard-shell";
import { LayoutDashboard, CalendarDays, Users, Receipt } from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/receptionist", icon: LayoutDashboard },
  {
    label: "Appointments",
    href: "/receptionist/appointments",
    icon: CalendarDays,
  },
  { label: "Patients", href: "/receptionist/patients", icon: Users },
  { label: "Billing", href: "/receptionist/billing", icon: Receipt },
];

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell navItems={navItems} roleLabel="Receptionist">
      {children}
    </DashboardShell>
  );
}

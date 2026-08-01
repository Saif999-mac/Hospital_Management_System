"use client";
import { DashboardShell, NavItem } from "@/components/dashboard-shell";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Pill,
  Receipt,
  User,
} from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/patient", icon: LayoutDashboard },
  {
    label: "My Appointments",
    href: "/patient/appointments",
    icon: CalendarDays,
  },
  { label: "Medical Records", href: "/patient/records", icon: FileText },
  { label: "Prescriptions", href: "/patient/prescriptions", icon: Pill },
  { label: "Billing", href: "/patient/billing", icon: Receipt },
  { label: "Profile", href: "/patient/profile", icon: User },
];

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell navItems={navItems} roleLabel="Patient">
      {children}
    </DashboardShell>
  );
}

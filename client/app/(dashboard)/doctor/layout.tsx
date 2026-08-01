"use client";
import { DashboardShell, NavItem } from "@/components/dashboard-shell";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FileText,
  Pill,
} from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/doctor", icon: LayoutDashboard },
  {
    label: "My Appointments",
    href: "/doctor/appointments",
    icon: CalendarDays,
  },
  { label: "My Schedule", href: "/doctor/availability", icon: CalendarDays },
  { label: "My Patients", href: "/doctor/patients", icon: Users },
  { label: "Medical Records", href: "/doctor/records", icon: FileText },
  { label: "Prescriptions", href: "/doctor/prescriptions", icon: Pill },
];

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell navItems={navItems} roleLabel="Doctor">
      {children}
    </DashboardShell>
  );
}

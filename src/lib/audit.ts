import { supabase } from "@/lib/supabase/client";

export const AUDIT_MODULES = [
  "Auth",
  "Events",
  "Petugas",
  "Finance",
  "Donasi",
  "Settings",
  "Backup",
  "Media",
  "QRIS",
  "Announcements",
] as const;

export const AUDIT_ACTIONS = [
  "Login",
  "Logout",
  "Create Event",
  "Update Event",
  "Delete Event",
  "Add Officer",
  "Update Officer",
  "Delete Officer",
  "Create Officer Schedule",
  "Delete Officer Schedule",
  "Create Finance",
  "Update Finance",
  "Delete Finance",
  "Create Donation",
  "Update Donation",
  "Delete Donation",
  "Settings Update",
  "Backup Export",
  "Logo Upload",
  "Slide Upload",
  "Slide Delete",
  "QRIS Update",
  "Create Announcement",
  "Update Announcement",
  "Delete Announcement",
] as const;

export type AuditModule = (typeof AUDIT_MODULES)[number];
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

type AuditMetadata = Record<string, string | number | boolean | null | undefined>;

type LogAuditInput = {
  action: AuditAction;
  module: AuditModule;
  metadata?: AuditMetadata;
};

export async function logAuditAction({ action, module, metadata = {} }: LogAuditInput) {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) return;

    const response = await fetch("/api/audit", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, module, metadata }),
    });

    if (!response.ok) {
      console.warn("Audit log failed", await response.text());
    }
  } catch (error) {
    console.warn("Audit log failed", error);
  }
}

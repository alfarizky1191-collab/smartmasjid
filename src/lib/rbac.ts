export type Role =
  | "super_admin"
  | "admin_masjid"
  | "bendahara"
  | "operator_tv"
  | "sekretaris";

export const KNOWN_ROLES: Role[] = [
  "super_admin",
  "admin_masjid",
  "bendahara",
  "operator_tv",
  "sekretaris",
];

export function isKnownRole(value: string | null | undefined): value is Role {
  return KNOWN_ROLES.includes(value as Role);
}

/** Routes each role is permitted to access. */
export const ROLE_ROUTES: Record<Role, string[]> = {
  super_admin:  ["/dashboard", "/dashboard/settings", "/dashboard/finance", "/dashboard/donasi", "/dashboard/events", "/dashboard/petugas", "/dashboard/backup", "/dashboard/audit"],
  admin_masjid: ["/dashboard", "/dashboard/settings", "/dashboard/finance", "/dashboard/donasi", "/dashboard/events", "/dashboard/petugas", "/dashboard/backup", "/dashboard/audit"],
  bendahara:    ["/dashboard/finance", "/dashboard/donasi", "/dashboard/backup"],
  operator_tv:  ["/dashboard"],
  sekretaris:   ["/dashboard/events", "/dashboard/petugas"],
};

/** Returns true if the role may visit the given pathname. */
export function canAccess(role: Role, pathname: string): boolean {
  return (ROLE_ROUTES[role] ?? []).some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
}

/** First permitted route for a role — used for post-guard redirects. */
export function defaultRoute(role: Role): string {
  return ROLE_ROUTES[role]?.[0] ?? "/dashboard";
}

/** Backup modules each role is allowed to export. null = all modules. */
export const BACKUP_MODULES_BY_ROLE: Record<Role, string[] | null> = {
  super_admin:  null,
  admin_masjid: null,
  bendahara:    ["finance", "donations"],
  operator_tv:  [],
  sekretaris:   [],
};

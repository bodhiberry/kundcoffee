import { Session } from "next-auth";

export const PERMISSIONS = {
  POS_ACCESS: "pos_access",
  MANAGE_MENU: "manage_menu",
  MANAGE_CORE: "manage_core",
  MANAGE_CUSTOMERS: "manage_customers",
  MANAGE_STAFF: "manage_staff",
  MANAGE_INVENTORY: "manage_inventory",
  VIEW_FINANCE: "view_finance",
  MANAGE_SETTINGS: "manage_settings",
  EDIT_ORDERS: "edit_orders",
} as const;

/**
 * Validates if the given session has the required permission.
 * Admins inherently bypass all permission checks, ensuring they have full access.
 */
export function hasPermission(
  session: Session | null | undefined,
  requiredPermission: string,
): boolean {
  if (!session || !session.user) return false;

  // Admin access completely overrides permission checks
  if (session.user.role === "ADMIN") return true;

  const permissions = (session.user.permissions as string[]) || [];
  return permissions.includes(requiredPermission);
}

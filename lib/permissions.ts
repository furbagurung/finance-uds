export function isAdmin(role?: string | null) {
  return role === "ADMIN";
}

export function canManageFinance(role?: string | null) {
  return role === "ADMIN";
}

export function canCreateExpense(role?: string | null) {
  return role === "ADMIN" || role === "STAFF";
}
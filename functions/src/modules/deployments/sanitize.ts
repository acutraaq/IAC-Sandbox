export function sanitizeStorageName(base: string): string {
  return base.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
}

export function sanitizeKeyVaultName(base: string): string {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[^a-z]+/, "")
    .replace(/-+$/, "")
    .slice(0, 24);
}

export function sanitizeGenericName(base: string, maxLen: number): string {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
}

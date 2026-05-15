export function sanitizeStorageName(base: string): string {
  const result = base.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
  return result.length >= 3 ? result : "";
}

export function sanitizeKeyVaultName(base: string): string {
  const result = base
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[^a-z]+/, "")
    .replace(/-+$/, "")
    .slice(0, 24);
  return result.length >= 3 ? result : "";
}

export function sanitizeGenericName(base: string, maxLen: number): string {
  const result = base
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
  return result.length >= 3 ? result : "";
}

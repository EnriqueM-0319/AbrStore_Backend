export function getPositiveInteger(
  value: number | undefined,
  fallback: number,
) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(Math.trunc(value as number), 1);
}

export function getPagination(pageInput?: number, limitInput?: number) {
  const page = getPositiveInteger(pageInput, 1);
  const limit = Math.min(getPositiveInteger(limitInput, 10), 50);
  return { page, limit, skip: (page - 1) * limit };
}

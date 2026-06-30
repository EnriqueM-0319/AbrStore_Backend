export function toNumber(value: string | number | null | undefined) {
  return value == null ? 0 : Number(value);
}

export function money(value: number) {
  return value.toFixed(2);
}

export function quantity(value: number, unit?: string) {
  return unit === 'KILOGRAM' ? value.toFixed(3) : value.toFixed(0);
}

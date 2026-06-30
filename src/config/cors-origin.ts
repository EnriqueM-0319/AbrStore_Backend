function splitCsv(value: string | undefined) {
  return (
    value
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function normalizeSuffix(value: string) {
  return value.startsWith('.') ? value : `.${value}`;
}

function hostnameFromOrigin(origin: string) {
  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}

export function isCorsOriginAllowed(
  origin: string | undefined,
  allowedOrigins = process.env.CORS_ORIGIN,
  allowedPreviewSuffixes = process.env.CORS_PREVIEW_SUFFIXES,
) {
  if (!origin) return true;

  const exactOrigins = splitCsv(allowedOrigins);
  if (exactOrigins.includes(origin)) return true;

  const hostname = hostnameFromOrigin(origin);
  if (!hostname) return false;

  return splitCsv(allowedPreviewSuffixes)
    .map(normalizeSuffix)
    .some((suffix) => hostname.endsWith(suffix));
}

export function createCorsOriginResolver() {
  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    callback(null, isCorsOriginAllowed(origin));
  };
}

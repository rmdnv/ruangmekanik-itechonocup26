import { getServerEnv } from "@/lib/env";

export interface GeoInfo {
  city: string | null;
  region: string | null;
  country: string | null;
}

interface IpinfoLiteResponse {
  city?: string;
  region?: string;
  country?: string;
  country_code?: string;
}

const GEO_TIMEOUT_MS = 2500;

/**
 * Resolve a city/region/country for a given client IP using IPinfo (Lite plan).
 * Note: the Lite plan only exposes country-level data for arbitrary IPs, so
 * city/region usually come back null. Returns nulls gracefully when no token is
 * configured or the request fails, so the rest of the app is never blocked by
 * geolocation.
 */
export async function resolveGeo(ip: string | null): Promise<GeoInfo> {
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return { city: null, region: null, country: null };
  }

  const env = getServerEnv();
  const token = env.IPINFO_TOKEN;
  if (!token) return { city: null, region: null, country: null };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
    const res = await fetch(`https://api.ipinfo.io/lite/${encodeURIComponent(ip)}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) return { city: null, region: null, country: null };
    const data = (await res.json()) as IpinfoLiteResponse;
    return {
      city: data.city ?? null,
      region: data.region ?? null,
      country: data.country ?? data.country_code ?? null,
    };
  } catch {
    return { city: null, region: null, country: null };
  }
}

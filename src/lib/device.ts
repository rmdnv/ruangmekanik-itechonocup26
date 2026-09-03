export interface DeviceInfo {
  device: string;
  os: string;
  browser: string;
}

/** Parse a User-Agent header into device, OS, and browser labels. */
export function parseUserAgent(ua: string | null | undefined): DeviceInfo {
  const s = (ua ?? "").toString();
  const lower = s.toLowerCase();

  let device = "Desktop";
  if (/iPhone|iPad|iPod/.test(s)) device = "iPhone/iPad";
  else if (/Android/.test(s) && /Mobile/.test(s)) device = "Ponsel";
  else if (/Android/.test(s)) device = "Tablet/Android";
  else if (/Windows Phone|IEMobile/.test(s)) device = "Ponsel";
  else if (/Macintosh/.test(s)) device = "Mac";
  else if (/Windows/.test(s)) device = "Windows PC";
  else if (/Linux/.test(s) && !/Android/.test(s)) device = "Linux PC";

  let os = "Lainnya";
  if (lower.includes("windows nt 10.0")) os = "Windows 10/11";
  else if (lower.includes("windows nt 6.3")) os = "Windows 8.1";
  else if (lower.includes("windows nt 6.1")) os = "Windows 7";
  else if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("iphone")) os = "iOS (iPhone)";
  else if (lower.includes("ipad")) os = "iPadOS";
  else if (lower.includes("mac os x")) os = "macOS";
  else if (lower.includes("linux")) os = "Linux";

  let browser = "Lainnya";
  if (lower.includes("edg/") || lower.includes("edgios")) browser = "Edge";
  else if (lower.includes("opr/") || lower.includes("opera")) browser = "Opera";
  else if (lower.includes("chrome") && !lower.includes("edg") && !lower.includes("opr")) browser = "Chrome";
  else if (lower.includes("samsungbrowser")) browser = "Samsung Internet";
  else if (lower.includes("firefox")) browser = "Firefox";
  else if (lower.includes("safari") && !lower.includes("chrome")) browser = "Safari";

  return { device, os, browser };
}

export const runtime = "nodejs";

type Preview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

function pickMeta(html: string, key: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function siteFromUrl(input: string): string {
  try {
    return new URL(input).hostname.replace(/^www\./, "");
  } catch {
    return input;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url")?.trim() ?? "";
  if (!url) return Response.json({ error: "Missing url" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return Response.json({ error: "Invalid url" }, { status: 400 });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return Response.json({ error: "Invalid protocol" }, { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: { "user-agent": "RuangMekanik Link Preview/1.0" },
      cache: "no-store",
    });
    const html = await res.text();

    const title = pickMeta(html, "og:title") || pickMeta(html, "twitter:title") || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || null;
    const description = pickMeta(html, "og:description") || pickMeta(html, "twitter:description") || stripTags(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] || "") || null;
    const image = pickMeta(html, "og:image") || pickMeta(html, "twitter:image") || null;
    const siteName = pickMeta(html, "og:site_name") || siteFromUrl(target.toString());

    const payload: Preview = {
      url: target.toString(),
      title,
      description,
      image,
      siteName,
    };

    return Response.json(payload, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return Response.json(
      {
        url: target.toString(),
        title: target.hostname.replace(/^www\./, ""),
        description: null,
        image: null,
        siteName: siteFromUrl(target.toString()),
      },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  }
}

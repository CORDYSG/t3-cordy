import { NextResponse } from "next/server";
import { api } from "@/trpc/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://app.cordy.sg";

  try {
    const communities = await api.community.getAllCommunities();

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${communities
          .map(
            (community) => `
          <url>
            <loc>${baseUrl}/c/${community.abbreviation}</loc>
            <lastmod>${new Date(community.created_at || new Date()).toISOString()}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.9</priority>
          </url>
        `,
          )
          .join("")}
      </urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating communities sitemap:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}

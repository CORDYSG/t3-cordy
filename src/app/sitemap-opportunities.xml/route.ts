import { NextResponse } from "next/server";
import { api } from "@/trpc/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://app.cordy.sg";

  try {
    const opportunities = await api.opp.getAllOpportunities();

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${opportunities
          .map(
            (opp) => `
          <url>
            <loc>${baseUrl}/opportunities/${opp.airtable_id}</loc>
            <lastmod>${new Date(opp.created_at || new Date()).toISOString()}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
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
    console.error("Error generating opportunities sitemap:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}

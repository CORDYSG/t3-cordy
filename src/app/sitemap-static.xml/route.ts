import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://app.cordy.sg";

  const staticUrls = [
    { url: baseUrl, priority: 1.0, changefreq: "daily" },
    { url: `${baseUrl}/feedback`, priority: 0.8, changefreq: "monthly" },
    { url: `${baseUrl}/opportunities`, priority: 1, changefreq: "daily" },
    {
      url: `${baseUrl}/opportunities/for-you`,
      priority: 1,
      changefreq: "daily",
    },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticUrls
        .map(
          ({ url, priority, changefreq }) => `
        <url>
          <loc>${url}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>${changefreq}</changefreq>
          <priority>${priority}</priority>
        </url>
      `,
        )
        .join("")}
    </urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

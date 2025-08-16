import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://app.cordy.sg";

  return [
    {
      url: `${baseUrl}/sitemap-static.xml`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/sitemap-opportunities.xml`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/sitemap-communities.xml`,
      lastModified: new Date(),
    },
  ];
}

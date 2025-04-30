import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CORDY",
    short_name: "CORDY",
    description: "Cordy",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF7E7",
    theme_color: "#fff7e7",
  };
}

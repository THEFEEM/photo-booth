import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AHLAN GROUP Photo Booth",
    short_name: "AHLAN",
    description: "ระบบจองคิว Photo Booth by AHLAN GROUP",
    start_url: "/app",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [{ src: "/logo.png", sizes: "any", type: "image/png" }],
  };
}

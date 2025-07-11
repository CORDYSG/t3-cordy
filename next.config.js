/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: ["fdxmtgmsbebfggxtkfkg.supabase.co", "images.ctfassets.net"],
  },
};

export default config;

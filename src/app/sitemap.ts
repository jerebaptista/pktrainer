import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const BASE_URL = "https://pktrainer.com";
const PATHS = ["/", "/pokedex"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    PATHS.map((path) => {
      const localizedPath = locale === routing.defaultLocale ? path : `/${locale}${path === "/" ? "" : path}`;
      return {
        url: `${BASE_URL}${localizedPath}`,
        lastModified: new Date(),
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((alt) => [
              alt,
              `${BASE_URL}${alt === routing.defaultLocale ? path : `/${alt}${path === "/" ? "" : path}`}`,
            ])
          ),
        },
      };
    })
  );
}

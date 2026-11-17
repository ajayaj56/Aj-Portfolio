import type { Locale } from "../../i18n/types";

export const projectIds = [
  "website-development",
  "ui-ux-design",
  "logo-brand-identity",
  "poster-graphic-design",
  "excel-data-quality-control",
];
//export const projectIds = ["streakon", "cubewar", "quibbo", "sharkie", "pokedex"];

function simplifyModules(glob: Record<string, any>) {
  const result: Record<string, any> = {};
  for (const [path, mod] of Object.entries(glob)) {
    const match = path.match(/\/([a-z0-9_-]+)\.ts$/i);
    if (match) result[match[1] as string] = mod;
  }
  return result;
}

export const projectModules = {
  de: simplifyModules(import.meta.glob("./de/*.ts", { eager: true })),
  en: simplifyModules(import.meta.glob("./en/*.ts", { eager: true })),
} as const satisfies Record<Locale, Record<string, any>>;

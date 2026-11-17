export const social = [
  { url: "mailto:me@david-hckh.com", name: "mail" },
  { url: "https://github.com/davidhckh", name: "github" },
  { url: "https://www.linkedin.com/in/david-heckhoff/", name: "linkedin" },
  { url: "https://www.instagram.com/", name: "instagram" },
] as const satisfies { url: string; name: "mail" | "github" | "instagram" | "linkedin" }[];

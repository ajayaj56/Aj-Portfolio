export const social = [
  { url: "", name: "mail" },
  { url: "", name: "github" },
  { url: "", name: "linkedin" },
  { url: "", name: "instagram" },
] as const satisfies { url: string; name: "mail" | "github" | "instagram" | "linkedin" }[];

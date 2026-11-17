export const social = [
  { url: "mailto:ajayguvva@gmail.com", name: "mail" },
  { url: "", name: "github" },
  { url: "", name: "linkedin" },
  { url: "https://www.instagram.com/ajay_aj_1206?cplk=MTQwdm42b2F6aGUwdQ==", name: "instagram" },
] as const satisfies { url: string; name: "mail" | "github" | "instagram" | "linkedin" }[];

import type { ProjectPreview } from "../../types";

export default [
  {
    title: "Website Development",
    slug: "website-development",
    thumbnail: "/projects/website%20development.png",
    description: "Modern Websites & Responsive Web Experiences",
  },
  {
    title: "UI/UX Design",
    slug: "ui-ux-design",
    thumbnail: "/projects/uiux%20design.png",
    description: "User Interfaces & Digital Experiences",
  },
  {
    title: "Logo & Brand Identity",
    slug: "logo-brand-identity",
    thumbnail: "/projects/logo.png",
    description: "Creative Logos & Visual Branding",
  },
  {
    title: "Poster & Graphic Design",
    slug: "poster-graphic-design",
    thumbnail: "/projects/poster%20design.png",
    description: "Creative Posters & Digital Graphics",
  },
  {
    title: "Excel Data Quality Control",
    slug: "excel-data-quality-control",
    thumbnail: "/projects/quality%20control.png",
    description: "Data Validation, Quality Checks & Accuracy",
  },
] as const satisfies ProjectPreview[];

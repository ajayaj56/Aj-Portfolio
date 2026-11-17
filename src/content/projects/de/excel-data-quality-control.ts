import type { ProjectContent } from "../../types";

export default {
  title: "Excel Data Quality Control",
  theme: "dark",
  tags: ["gray", "node"],
  description:
    "Datenvalidierung, Qualitätsprüfungen & Genauigkeit.<br/><br/>Verwaltung von über 50.000 Datensätzen für gründliche Datenbereinigung und Schemavalidierung.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: "/projects/quality%20control.png",
        alt: "Excel Data Quality Control",
        caption: "Datenqualität & Validierung",
      },
    },
  ],
} as const satisfies ProjectContent;

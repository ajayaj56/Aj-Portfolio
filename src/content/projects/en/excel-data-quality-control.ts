import type { ProjectContent } from "../../types";

export default {
  title: "Excel Data Quality Control",
  theme: "dark",
  tags: ["excel", "data-validation", "data-cleaning", "quality-checks"],
  subtitle: "Data Validation, Quality Checks & Accuracy.",
  description:
    "Managing structured data through Excel, performing data validation, identifying inconsistencies, checking data accuracy and maintaining reliable records.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: "/projects/quality%20control.png",
        alt: "Excel Data Quality Control",
        caption: "Data Quality & Validation",
      },
    },
  ],
} as const satisfies ProjectContent;

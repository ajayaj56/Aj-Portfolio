import type { ProjectContent } from "../../types";

export default {
  title: "Excel Data Quality Control",
  theme: "dark",
  tags: ["gray", "node"],
  description:
    "Data Validation, Quality Checks & Accuracy.<br/><br/>Handled 50K+ records for rigorous data cleaning, schema validation, and reporting.",
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

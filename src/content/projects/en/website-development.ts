import type { ProjectContent } from "../../types";

export default {
  title: "Website Development",
  theme: "dark",
  tags: ["html", "css", "javascript", "react"],
  description:
    "Modern Websites & Responsive Web Experiences.<br/><br/>Crafting fast, accessible, and responsive web experiences tailored to modern standards.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: "/projects/website%20development.png",
        alt: "Website Development",
        caption: "Website Development Overview",
      },
    },
  ],
} as const satisfies ProjectContent;

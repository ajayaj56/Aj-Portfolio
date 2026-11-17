import type { ProjectContent } from "../../types";

export default {
  title: "Website Development",
  theme: "dark",
  tags: ["html", "css", "javascript", "react", "next"],
  subtitle: "Modern Websites & Responsive Web Experiences.",
  description:
    "Creating modern, responsive and high-performance websites with clean layouts, intuitive navigation and engaging user experiences.",
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

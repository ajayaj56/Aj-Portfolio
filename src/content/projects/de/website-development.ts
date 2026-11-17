import type { ProjectContent } from "../../types";

export default {
  title: "Website Development",
  theme: "dark",
  tags: ["html", "css", "javascript", "react"],
  description:
    "Moderne Websites & responsive Web-Erlebnisse.<br/><br/>Entwicklung schneller, zugänglicher und responsiver Web-Erlebnisse nach modernen Standards.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: "/projects/website%20development.png",
        alt: "Website Development",
        caption: "Website Development Übersicht",
      },
    },
  ],
} as const satisfies ProjectContent;

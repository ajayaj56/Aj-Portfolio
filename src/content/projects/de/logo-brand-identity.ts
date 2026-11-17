import type { ProjectContent } from "../../types";

export default {
  title: "Logo & Brand Identity",
  theme: "dark",
  tags: ["gray", "html"],
  description:
    "Kreative Logos & visuelles Branding.<br/><br/>Entwicklung markanter visueller Markenidentitäten und zeitloser Logos.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: "/projects/logo.png",
        alt: "Logo & Brand Identity",
        caption: "Markenidentität Design",
      },
    },
  ],
} as const satisfies ProjectContent;

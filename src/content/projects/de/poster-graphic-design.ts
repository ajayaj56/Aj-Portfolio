import type { ProjectContent } from "../../types";

export default {
  title: "Poster & Graphic Design",
  theme: "light",
  tags: ["gray", "html"],
  description:
    "Kreative Poster & digitale Grafiken.<br/><br/>Gestaltung fesselnder Poster, Marketinggrafiken und visueller Inhalte.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: "/projects/poster%20design.png",
        alt: "Poster & Graphic Design",
        caption: "Poster & Graphic Design Showcase",
      },
    },
  ],
} as const satisfies ProjectContent;

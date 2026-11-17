import type { ProjectContent } from "../../types";

export default {
  title: "UI/UX Design",
  theme: "light",
  tags: ["html", "css", "javascript"],
  description:
    "Benutzeroberflächen & digitale Erlebnisse.<br/><br/>Gestaltung intuitiver und ansprechender Benutzererfahrungen mit Figma.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: "/projects/uiux%20design.png",
        alt: "UI/UX Design",
        caption: "UI/UX Design Showcase",
      },
    },
  ],
} as const satisfies ProjectContent;

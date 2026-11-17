import type { ProjectContent } from "../../types";

export default {
  title: "UI/UX Design",
  theme: "light",
  tags: ["figma", "wireframing", "prototyping", "user-research"],
  subtitle: "User Interfaces & Digital Experiences.",
  description:
    "Designing clean, intuitive and visually engaging user interfaces with thoughtful layouts, seamless user journeys and interactive prototypes using Figma.",
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

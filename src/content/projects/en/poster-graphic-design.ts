import type { ProjectContent } from "../../types";

export default {
  title: "Poster & Graphic Design",
  theme: "light",
  tags: ["gray", "html"],
  description:
    "Creative Posters & Digital Graphics.<br/><br/>Crafting captivating posters, marketing graphics, and visual storytelling assets.",
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

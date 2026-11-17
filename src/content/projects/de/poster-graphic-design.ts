import type { ProjectContent } from "../../types";

export default {
  title: "Poster & Graphic Design",
  theme: "light",
  tags: ["canva", "photoshop", "graphic-design", "social-media"],
  subtitle: "Creative Posters & Digital Graphics.",
  description:
    "Designing visually appealing posters, promotional creatives, social media graphics and marketing materials with engaging compositions.",
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

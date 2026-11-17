import type { ProjectContent } from "../../types";

export default {
  title: "Logo & Brand Identity",
  theme: "dark",
  tags: ["logo-design", "branding", "typography", "color-theory"],
  subtitle: "Creative Logos & Visual Branding.",
  description:
    "Creating distinctive brand identities through creative logo concepts, meaningful typography, balanced color palettes and consistent visual design.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: "/projects/logo.png",
        alt: "Logo & Brand Identity",
        caption: "Brand Identity Design",
      },
    },
  ],
} as const satisfies ProjectContent;

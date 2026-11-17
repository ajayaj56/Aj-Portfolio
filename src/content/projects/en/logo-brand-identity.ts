import type { ProjectContent } from "../../types";

export default {
  title: "Logo & Brand Identity",
  theme: "dark",
  tags: ["gray", "html"],
  description:
    "Creative Logos & Visual Branding.<br/><br/>Building distinctive visual brand identities and timeless logos that resonate.",
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

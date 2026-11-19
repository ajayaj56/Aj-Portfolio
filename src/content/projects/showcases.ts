export interface ShowcaseItem {
  title: string;
  thumbnail: string;
  description: string;
  category?: string;
}

export interface ShowcaseData {
  title: string;
  banner: string;
  subtitle: string;
  hideLabels?: boolean;
  items: ShowcaseItem[];
}

export const projectShowcases: Record<string, ShowcaseData> = {
  "website-development": {
    title: "Client Websites & Web Experiences",
    banner: "Website Showcase",
    subtitle: "Interactive 3D Ribbon Gallery • Drag to rotate & explore client websites",
    hideLabels: false,
    items: [
      {
        title: "Cresta Global",
        thumbnail: "/my%20websites/Cresta%20Globa.png",
        description: "Corporate & Consulting Website",
      },
      {
        title: "Elevate Rootz",
        thumbnail: "/my%20websites/Elevate%20Rootz.png",
        description: "Modern Business & Brand Website",
      },
      {
        title: "Hanova Life Sciences",
        thumbnail: "/my%20websites/Hanova%20life%20sciences.png",
        description: "Life Sciences & Healthcare Portal",
      },
      {
        title: "Kolli Graphics",
        thumbnail: "/my%20websites/Kolli%20Graphics.png",
        description: "Creative Studio & Portfolio",
      },
      {
        title: "Land Power",
        thumbnail: "/my%20websites/Land%20Power.png",
        description: "Energy & Infrastructure Website",
      },
      {
        title: "Proeveron",
        thumbnail: "/my%20websites/Proeveron.png",
        description: "Enterprise Technology Platform",
      },
      {
        title: "RSN Infra Properties",
        thumbnail: "/my%20websites/RSN%20Infra%20Properties.png",
        description: "Real Estate & Construction Portal",
      },
      {
        title: "Samineni Foods",
        thumbnail: "/my%20websites/Samineni%20Foods.png",
        description: "Food Products & Brand Website",
      },
      {
        title: "Srikari Atirudram",
        thumbnail: "/my%20websites/Srikari%20Atirudram.png",
        description: "Spiritual & Cultural Website",
      },
      {
        title: "Trichova",
        thumbnail: "/my%20websites/Trichova.png",
        description: "Healthcare & Wellness Platform",
      },
    ],
  },

  "logo-brand-identity": {
    title: "Brand Logos & Visual Identities",
    banner: "Logo Showcase",
    subtitle: "Interactive 3D Ribbon Gallery • Drag to rotate & explore custom brand marks",
    hideLabels: true,
    items: [
      {
        title: "Brand Logo 01",
        thumbnail: "/my%20logos/1.png",
        description: "Modern Minimalist Brand Identity",
      },
      {
        title: "Brand Logo 02",
        thumbnail: "/my%20logos/2.png",
        description: "Creative Typography & Emblem",
      },
      {
        title: "Brand Logo 03",
        thumbnail: "/my%20logos/3.png",
        description: "Geometric Vector Brandmark",
      },
      {
        title: "Brand Logo 04",
        thumbnail: "/my%20logos/4.png",
        description: "Abstract Symbol & Creative Mark",
      },
      {
        title: "Brand Logo 05",
        thumbnail: "/my%20logos/5.png",
        description: "Corporate Monogram Design",
      },
      {
        title: "Brand Logo 06",
        thumbnail: "/my%20logos/6.png",
        description: "Elegant Brand Emblem",
      },
      {
        title: "Brand Logo 07",
        thumbnail: "/my%20logos/7.png",
        description: "Dynamic Identity Mark",
      },
      {
        title: "Brand Logo 08",
        thumbnail: "/my%20logos/8.png",
        description: "Iconic Visual Identity",
      },
      {
        title: "Brand Logo 09",
        thumbnail: "/my%20logos/9.png",
        description: "Contemporary Brand Symbol",
      },
      {
        title: "Brand Logo 10",
        thumbnail: "/my%20logos/10.png",
        description: "Vector Brand Insignia",
      },
    ],
  },

  "poster-graphic-design": {
    title: "Posters & Graphic Design",
    banner: "10 Posters 3D Showcase",
    subtitle: "Curved Bend 3D Gallery • Drag or scroll to browse all 10 creative posters",
    hideLabels: false,
    items: [
      {
        title: "Creative Artwork 34",
        thumbnail: "/my%20posters/34.png",
        description: "Visual Concept & Graphic Poster",
      },
      {
        title: "Digital Promo",
        thumbnail: "/my%20posters/@abhivorn.com.png",
        description: "Social Media Promotional Graphic",
      },
      {
        title: "Cherish The Moment",
        thumbnail: "/my%20posters/Cherish%20the.png",
        description: "Typography & Inspirational Poster",
      },
      {
        title: "Diwali Celebration",
        thumbnail: "/my%20posters/diwali.png",
        description: "Festive Social Media Creative",
      },
      {
        title: "Friday Vibes",
        thumbnail: "/my%20posters/FRIDAY.png",
        description: "Weekly Social Campaign Poster",
      },
      {
        title: "Saturday Special",
        thumbnail: "/my%20posters/saturday.png",
        description: "Weekend Feature Graphic",
      },
      {
        title: "Sunday Spotlight",
        thumbnail: "/my%20posters/sunday.png",
        description: "Digital Creative Composition",
      },
      {
        title: "Gandhi Jayanti",
        thumbnail: "/my%20posters/Teal%20Black%20and%20White%20Minimalist%20Gandhi%20Jayanti%20Instagram%20Post.png",
        description: "Minimalist Tribute Artwork",
      },
      {
        title: "Hiring Campaign",
        thumbnail: "/my%20posters/testing%20intern.png",
        description: "Internship & Career Announcement",
      },
      {
        title: "Tuesday Insight",
        thumbnail: "/my%20posters/tuesday.png",
        description: "Midweek Creative Graphic",
      },
    ],
  },
};

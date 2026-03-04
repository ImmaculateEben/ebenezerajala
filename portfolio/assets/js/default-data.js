export const AVAILABLE_TECH_STACKS = [
  { id: "html5", name: "HTML5", icon: "devicon-html5-plain" },
  { id: "css3", name: "CSS3", icon: "devicon-css3-plain" },
  { id: "javascript", name: "JavaScript", icon: "devicon-javascript-plain" },
  { id: "php", name: "PHP", icon: "devicon-php-plain" },
  { id: "mysql", name: "MySQL", icon: "devicon-mysql-plain" },
  { id: "wordpress", name: "WordPress", icon: "devicon-wordpress-plain" },
  { id: "react", name: "React", icon: "devicon-react-original" },
  { id: "nodejs", name: "Node.js", icon: "devicon-nodejs-plain" },
  { id: "bootstrap", name: "Bootstrap", icon: "devicon-bootstrap-plain" },
  { id: "tailwind", name: "Tailwind CSS", icon: "devicon-tailwindcss-original" },
  { id: "figma", name: "Figma", icon: "devicon-figma-plain" },
  { id: "photoshop", name: "Photoshop", icon: "devicon-photoshop-plain" },
  { id: "illustrator", name: "Illustrator", icon: "devicon-illustrator-plain" },
  { id: "premierepro", name: "Premiere Pro", icon: "devicon-premierepro-plain" },
  { id: "aftereffects", name: "After Effects", icon: "devicon-aftereffects-plain" },
  { id: "coreldraw", name: "CorelDRAW", icon: "fa-solid fa-pen-nib" }
];

export const DEFAULT_SITE_CONTENT = {
  profile: {
    name: "Ebenezer Ajala",
    animatedTitles: ["WordPress Website Developer", "Graphics Designer", "SEO Specialist"],
    tagline: "Building high-performance websites that improve user experience and drive measurable growth.",
    location: "Lagos, Nigeria",
    email: "ebenezerajala1305@gmail.com",
    phone1: "+234 815 217 8472",
    phone2: "+234 912 003 7255",
    linkedin: "https://www.linkedin.com/in/ebenezer-ajala13",
    github: "https://github.com/ImmaculateEben",
    githubUsername: "ImmaculateEben",
    bio: "I am a WordPress developer and graphics designer with more than four years of hands-on experience building fast, conversion-focused websites for businesses, nonprofits, and growing brands.",
    bio2: "My work spans custom WordPress builds, SEO foundations, hosting management, performance optimization, and visual design systems that help clients look credible and sell clearly.",
    bio3: "I currently support the Institute for Industrial Technology (IIT) as a Website Developer and IT Support professional while continuing to take on freelance client work.",
    profileImage: "assets/images/profile-placeholder.svg",
    yearsExperience: "4+",
    clientsServed: "30+",
    avgSpeedImprovement: "40%",
    avgTrafficIncrease: "30%",
    availableForFreelance: true
  },
  techStacks: ["html5", "css3", "javascript", "wordpress", "php", "figma"],
  skills: {
    technical: [
      {
        id: "wordpress-dev",
        category: "WordPress Development",
        icon: "fa-brands fa-wordpress",
        items: ["Custom Themes", "Custom Plugins", "Elementor", "WooCommerce", "Site Migrations"]
      },
      {
        id: "frontend-dev",
        category: "Front-End Development",
        icon: "fa-solid fa-code",
        items: ["Semantic HTML", "Responsive CSS", "JavaScript", "Accessibility", "Performance Tuning"]
      },
      {
        id: "ops-seo",
        category: "Hosting and SEO",
        icon: "fa-solid fa-server",
        items: ["cPanel and DNS", "SSL Setup", "Technical SEO", "Analytics Setup", "Core Web Vitals"]
      }
    ],
    soft: [
      {
        id: "problem-solving",
        title: "Problem-Solving",
        icon: "fa-solid fa-brain",
        desc: "Strong debugging and troubleshooting habits across content, frontend, and infrastructure layers."
      },
      {
        id: "communication",
        title: "Communication",
        icon: "fa-solid fa-comments",
        desc: "Clear communication with clients and non-technical stakeholders throughout delivery."
      },
      {
        id: "project-management",
        title: "Project Management",
        icon: "fa-solid fa-list-check",
        desc: "Comfortable balancing multiple deadlines while keeping execution and expectations aligned."
      }
    ]
  },
  experience: [
    {
      id: "youthup",
      role: "Volunteer WordPress Developer (Pro Bono)",
      company: "Youthup Global",
      type: "Remote",
      badge: "Current",
      badgeClass: "badge-gold",
      date: "Oct 2025 - Present",
      summary: "Supporting the Youthup Global and Utidia platforms with maintenance, improvements, and technical support.",
      bullets: [
        "Manage WordPress updates, backups, and reliability tasks.",
        "Collaborate on UX improvements and feature changes.",
        "Troubleshoot plugin and content issues quickly."
      ]
    },
    {
      id: "iit",
      role: "Website Developer and IT Support",
      company: "Institute for Industrial Technology (IIT)",
      type: "Onsite",
      badge: "NYSC",
      badgeClass: "badge-blue",
      date: "Apr 2025 - Mar 2026",
      summary: "Handled website work, internal support, and broader technical operations during NYSC service.",
      bullets: [
        "Maintained and improved the institute website.",
        "Supported staff with hardware, software, and connectivity issues.",
        "Handled hosting, email, and operational troubleshooting."
      ]
    },
    {
      id: "jotel",
      role: "WordPress Developer",
      company: "Jotel Quick Computer Solutions",
      type: "Onsite",
      badge: "",
      badgeClass: "",
      date: "Jun 2022 - Mar 2025",
      summary: "Delivered websites for more than 30 client projects with a strong focus on speed and SEO.",
      bullets: [
        "Built and maintained WordPress sites for multiple industries.",
        "Improved average page speed performance by roughly 40 percent.",
        "Implemented SEO improvements that increased traffic and lead quality."
      ]
    }
  ],
  education: [
    {
      degree: "B.Sc. Statistics",
      school: "Federal University Wukari, Taraba State",
      period: "2019 - 2024",
      icon: "fa-solid fa-graduation-cap"
    },
    {
      degree: "Senior Secondary School",
      school: "Loyola College, Ibadan, Oyo State",
      period: "2016 - 2019",
      icon: "fa-solid fa-school"
    }
  ],
  settings: {
    contactRecipientEmail: "ebenezerajala1305@gmail.com",
    notificationSenderName: "Ebenezer Ajala Portfolio",
    analyticsMeasurementId: "",
    adminContactLabel: "Primary inbox"
  }
};

export const DEFAULT_PROJECTS = [
  {
    id: "prolific-safety",
    title: "Prolific Safety Nigeria",
    shortDesc: "A safety consultancy website with a strong service structure, polished presentation, and faster performance.",
    longDesc: "<p>Prolific Safety Nigeria needed a professional web presence that communicated authority and made their services easy to understand.</p><p>The build focused on clean content architecture, responsive layouts, and strong speed improvements so users could reach key service pages quickly.</p>",
    tags: ["WordPress", "Elementor", "SEO", "cPanel"],
    url: "https://www.prolificsafety.com.ng",
    github: "",
    image: "",
    featured: true,
    gradient: "linear-gradient(135deg, #1a1a2e, #16213e)"
  },
  {
    id: "lamata",
    title: "LAMATA",
    shortDesc: "A public-facing transport authority website with structured content, stability, and performance improvements.",
    longDesc: "<p>This project involved rebuilding and stabilizing a public sector website with content-heavy pages, service information, and performance expectations.</p><p>Work included hosting migration, SEO cleanup, and a clearer user journey for visitors looking for transport information.</p>",
    tags: ["WordPress", "Performance", "Hosting", "SEO"],
    url: "https://www.lamata-ng.com",
    github: "",
    image: "",
    featured: true,
    gradient: "linear-gradient(135deg, #0f2027, #203a43)"
  },
  {
    id: "coreview-checks",
    title: "Coreview Checks",
    shortDesc: "A verification services site designed for credibility, clarity, and lead generation.",
    longDesc: "<p>Coreview Checks needed a trust-building lead generation website. The structure prioritized clear service breakdowns, confidence-building copy, and easy enquiry flows.</p><p>The implementation also focused on fast load times and a reliable contact workflow.</p>",
    tags: ["WordPress", "SEO", "Lead Gen", "Elementor"],
    url: "https://www.coreviewchecks.com",
    github: "",
    image: "",
    featured: false,
    gradient: "linear-gradient(135deg, #1a1a2e, #2d1b69)"
  },
  {
    id: "shop-inverse",
    title: "Shop Inverse",
    shortDesc: "A WooCommerce storefront designed for product discovery, conversion, and maintainability.",
    longDesc: "<p>Shop Inverse is an ecommerce build that focused on product catalog clarity, smooth shopping flows, and reliable performance across category and checkout pages.</p><p>The project included WooCommerce setup, UX refinements, and conversion-minded optimization.</p>",
    tags: ["WordPress", "WooCommerce", "Speed", "Ecommerce"],
    url: "https://www.shopinverse.com",
    github: "",
    image: "",
    featured: true,
    gradient: "linear-gradient(135deg, #0a0a0c, #1a2a1a)"
  }
];

export const DEFAULT_TESTIMONIALS = [
  {
    id: "t1",
    name: "John Okafor",
    role: "CEO, Prolific Safety",
    content: "Ebenezer transformed our online presence. The new site is faster, cleaner, and much easier for clients to use.",
    image: "",
    published: true
  },
  {
    id: "t2",
    name: "Sarah Jenkins",
    role: "Founder, Shop Inverse",
    content: "He delivered a strong ecommerce setup and made the entire process clear from planning through launch.",
    image: "",
    published: true
  },
  {
    id: "t3",
    name: "Ahmad Bello",
    role: "Director, Coreview Checks",
    content: "Professional, responsive, and very strong technically. The redesign improved both trust and performance.",
    image: "",
    published: true
  }
];

export const DEFAULT_MESSAGES = [];

export function getDefaultState() {
  return JSON.parse(
    JSON.stringify({
      siteContent: DEFAULT_SITE_CONTENT,
      projects: DEFAULT_PROJECTS,
      testimonials: DEFAULT_TESTIMONIALS,
      messages: DEFAULT_MESSAGES
    })
  );
}

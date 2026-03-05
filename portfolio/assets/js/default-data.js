export const AVAILABLE_TECH_STACKS = [
  { id: "html5", slug: "html5", name: "HTML5", icon: "devicon-html5-plain", fallbackIcon: "fa-brands fa-html5", category: "frontend", url: "https://developer.mozilla.org/docs/Web/HTML" },
  { id: "css3", slug: "css3", name: "CSS3", icon: "devicon-css3-plain", fallbackIcon: "fa-brands fa-css3-alt", category: "frontend", url: "https://developer.mozilla.org/docs/Web/CSS" },
  { id: "javascript", slug: "javascript", name: "JavaScript", icon: "devicon-javascript-plain", fallbackIcon: "fa-brands fa-js", category: "frontend", url: "https://developer.mozilla.org/docs/Web/JavaScript" },
  { id: "typescript", slug: "typescript", name: "TypeScript", icon: "devicon-typescript-plain", fallbackIcon: "fa-solid fa-code", category: "frontend", url: "https://www.typescriptlang.org" },
  { id: "react", slug: "react", name: "React", icon: "devicon-react-original", fallbackIcon: "fa-brands fa-react", category: "frontend", url: "https://react.dev" },
  { id: "nextjs", slug: "nextjs", name: "Next.js", icon: "devicon-nextjs-original", fallbackIcon: "fa-solid fa-n", category: "frontend", url: "https://nextjs.org" },
  { id: "vue", slug: "vue", name: "Vue", icon: "devicon-vuejs-plain", fallbackIcon: "fa-solid fa-v", category: "frontend", url: "https://vuejs.org" },
  { id: "bootstrap", slug: "bootstrap", name: "Bootstrap", icon: "devicon-bootstrap-plain", fallbackIcon: "fa-brands fa-bootstrap", category: "frontend", url: "https://getbootstrap.com" },
  { id: "tailwind", slug: "tailwind-css", name: "Tailwind CSS", icon: "devicon-tailwindcss-plain", fallbackIcon: "fa-solid fa-wind", category: "frontend", url: "https://tailwindcss.com" },
  { id: "sass", slug: "sass", name: "Sass", icon: "devicon-sass-original", fallbackIcon: "fa-brands fa-sass", category: "frontend", url: "https://sass-lang.com" },
  { id: "webpack", slug: "webpack", name: "Webpack", icon: "devicon-webpack-plain", fallbackIcon: "fa-solid fa-cubes", category: "frontend", url: "https://webpack.js.org" },
  { id: "vite", slug: "vite", name: "Vite", icon: "devicon-vitejs-plain", fallbackIcon: "fa-solid fa-bolt", category: "frontend", url: "https://vite.dev" },
  { id: "wordpress", slug: "wordpress", name: "WordPress", icon: "devicon-wordpress-plain", fallbackIcon: "fa-brands fa-wordpress", category: "cms", url: "https://wordpress.org" },
  { id: "woocommerce", slug: "woocommerce", name: "WooCommerce", icon: "devicon-woocommerce-plain", fallbackIcon: "fa-solid fa-cart-shopping", category: "cms", url: "https://woocommerce.com" },
  { id: "shopify", slug: "shopify", name: "Shopify", icon: "devicon-shopify-plain", fallbackIcon: "fa-brands fa-shopify", category: "cms", url: "https://www.shopify.com" },
  { id: "php", slug: "php", name: "PHP", icon: "devicon-php-plain", fallbackIcon: "fa-brands fa-php", category: "backend", url: "https://www.php.net" },
  { id: "nodejs", slug: "nodejs", name: "Node.js", icon: "devicon-nodejs-plain", fallbackIcon: "fa-brands fa-node-js", category: "backend", url: "https://nodejs.org" },
  { id: "express", slug: "express", name: "Express", icon: "devicon-express-original", fallbackIcon: "fa-solid fa-server", category: "backend", url: "https://expressjs.com" },
  { id: "python", slug: "python", name: "Python", icon: "devicon-python-plain", fallbackIcon: "fa-brands fa-python", category: "backend", url: "https://www.python.org" },
  { id: "supabase", slug: "supabase", name: "Supabase", icon: "devicon-supabase-plain", fallbackIcon: "fa-solid fa-database", category: "backend", url: "https://supabase.com" },
  { id: "firebase", slug: "firebase", name: "Firebase", icon: "devicon-firebase-plain", fallbackIcon: "fa-solid fa-fire", category: "backend", url: "https://firebase.google.com" },
  { id: "mysql", slug: "mysql", name: "MySQL", icon: "devicon-mysql-plain", fallbackIcon: "fa-solid fa-database", category: "database", url: "https://www.mysql.com" },
  { id: "postgresql", slug: "postgresql", name: "PostgreSQL", icon: "devicon-postgresql-plain", fallbackIcon: "fa-solid fa-database", category: "database", url: "https://www.postgresql.org" },
  { id: "mongodb", slug: "mongodb", name: "MongoDB", icon: "devicon-mongodb-plain", fallbackIcon: "fa-solid fa-leaf", category: "database", url: "https://www.mongodb.com" },
  { id: "redis", slug: "redis", name: "Redis", icon: "devicon-redis-plain", fallbackIcon: "fa-solid fa-memory", category: "database", url: "https://redis.io" },
  { id: "docker", slug: "docker", name: "Docker", icon: "devicon-docker-plain", fallbackIcon: "fa-brands fa-docker", category: "devops", url: "https://www.docker.com" },
  { id: "nginx", slug: "nginx", name: "Nginx", icon: "devicon-nginx-original", fallbackIcon: "fa-solid fa-network-wired", category: "devops", url: "https://nginx.org" },
  { id: "linux", slug: "linux", name: "Linux", icon: "devicon-linux-plain", fallbackIcon: "fa-brands fa-linux", category: "devops", url: "https://kernel.org" },
  { id: "git", slug: "git", name: "Git", icon: "devicon-git-plain", fallbackIcon: "fa-brands fa-git-alt", category: "tooling", url: "https://git-scm.com" },
  { id: "github", slug: "github", name: "GitHub", icon: "devicon-github-original", fallbackIcon: "fa-brands fa-github", category: "tooling", url: "https://github.com" },
  { id: "vercel", slug: "vercel", name: "Vercel", icon: "devicon-vercel-original", fallbackIcon: "fa-solid fa-cloud", category: "tooling", url: "https://vercel.com" },
  { id: "netlify", slug: "netlify", name: "Netlify", icon: "devicon-netlify-plain", fallbackIcon: "fa-solid fa-cloud-arrow-up", category: "tooling", url: "https://www.netlify.com" },
  { id: "figma", slug: "figma", name: "Figma", icon: "devicon-figma-plain", fallbackIcon: "fa-brands fa-figma", category: "design", url: "https://www.figma.com" },
  { id: "photoshop", slug: "photoshop", name: "Photoshop", icon: "devicon-photoshop-plain", fallbackIcon: "fa-solid fa-image", category: "design", url: "https://www.adobe.com/products/photoshop.html" },
  { id: "illustrator", slug: "illustrator", name: "Illustrator", icon: "devicon-illustrator-plain", fallbackIcon: "fa-solid fa-pen-ruler", category: "design", url: "https://www.adobe.com/products/illustrator.html" },
  { id: "premierepro", slug: "premiere-pro", name: "Premiere Pro", icon: "devicon-premierepro-plain", fallbackIcon: "fa-solid fa-film", category: "design", url: "https://www.adobe.com/products/premiere.html" },
  { id: "aftereffects", slug: "after-effects", name: "After Effects", icon: "devicon-aftereffects-plain", fallbackIcon: "fa-solid fa-clapperboard", category: "design", url: "https://www.adobe.com/products/aftereffects.html" },
  { id: "coreldraw", slug: "coreldraw", name: "CorelDRAW", icon: "fa-solid fa-pen-nib", fallbackIcon: "fa-solid fa-pen-nib", category: "design", url: "https://www.coreldraw.com" }
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
  techStacks: ["html5", "css3", "javascript", "wordpress", "php", "mysql", "figma", "github"],
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
      },
      {
        id: "attention-to-detail",
        title: "Attention to Detail",
        icon: "fa-solid fa-magnifying-glass",
        desc: "Careful eye for consistency in layout, typography, spacing, and code quality across every deliverable."
      },
      {
        id: "adaptability",
        title: "Adaptability",
        icon: "fa-solid fa-arrows-spin",
        desc: "Quick to adjust to shifting project requirements, new tools, and evolving client priorities without losing momentum."
      },
      {
        id: "client-focus",
        title: "Client-Focused Mindset",
        icon: "fa-solid fa-handshake",
        desc: "Committed to understanding client goals first and translating them into websites that serve real business outcomes."
      },
      {
        id: "creativity",
        title: "Creativity",
        icon: "fa-solid fa-lightbulb",
        desc: "Bringing original thinking to design decisions, layout choices, and content structure to make projects stand out."
      },
      {
        id: "self-learning",
        title: "Continuous Learning",
        icon: "fa-solid fa-book-open",
        desc: "Consistently updating skills through practice, research, and hands-on experimentation with new tools and techniques."
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
  },
  projectCategories: ["WordPress", "UI/UX Design", "Graphic Design", "HTML/CSS", "Web App", "SEO"]
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

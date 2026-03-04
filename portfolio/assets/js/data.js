/**
 * data.js — Portfolio data store using localStorage
 * All portfolio content lives here and can be edited via admin.html
 */

const AVAILABLE_TECH_STACKS = [
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
    { id: "coreldraw", name: "CorelDRAW", icon: "fa-solid fa-pen-nib" } // Fallback for CorelDRAW
];

const DEFAULT_DATA = {
    profile: {
        name: "Ebenezer Ajala",
        animatedTitles: ["WordPress Website Developer", "Graphics Designer", "SEO Specialist"],
        tagline: "Building high-performance websites that enhance user experience and drive business growth.",
        location: "Lagos, Nigeria",
        email: "ebenezerajala1305@gmail.com",
        phone1: "08152178472",
        phone2: "09120037255",
        linkedin: "https://www.linkedin.com/in/ebenezer-ajala13",
        github: "",
        githubUsername: "ImmaculateEben",
        bio: "I am a passionate WordPress Website Developer and Graphics Designer based in Lagos, Nigeria, with over 4 years of hands-on experience designing, developing, and optimising websites for a wide variety of clients. My expertise covers both front-end and back-end WordPress development — from custom themes and plugins, to hosting management, server configuration, and performance tuning.",
        bio2: "I also find creative fulfilment in graphic design, using tools like Adobe Photoshop, Illustrator, and CorelDRAW to craft visual assets that bring brands to life across both digital and print media.",
        bio3: "Currently serving as a Website Developer and IT Support Officer under the NYSC program at the Institute for Industrial Technology (IIT).",
        profileImage: "assets/images/profile.jpg",
        yearsExperience: "4+",
        clientsServed: "30+",
        avgSpeedImprovement: "40%",
        avgTrafficIncrease: "30%",
        availableForFreelance: true
    },
    techStacks: ["html5", "css3", "javascript", "wordpress", "figma", "photoshop"], // Default selected stack
    testimonials: [
        {
            id: "t1",
            name: "John Okafor",
            role: "CEO, Prolific Safety",
            content: "Ebenezer completely transformed our digital presence. Our new website is not only beautiful but extremely fast and easy to navigate. Highly recommended!",
            image: ""
        },
        {
            id: "t2",
            name: "Sarah Jenkins",
            role: "Founder, Shop Inverse",
            content: "We needed an e-commerce solution that could scale. He delivered a flawless WooCommerce setup that has already increased our monthly conversions by 30%.",
            image: ""
        },
        {
            id: "t3",
            name: "Ahmad Bello",
            role: "Director, Coreview Checks",
            content: "Professional, timely, and deeply knowledgeable. Ebenezer handled our SEO audit and redesign perfectly. Traffic is up and bounce rates are way down.",
            image: ""
        }
    ],
    projects: [
        {
            id: "prolific-safety",
            title: "Prolific Safety Nigeria",
            shortDesc: "Safety consultancy website with a professional layout, responsive design, and rich service pages.",
            longDesc: "Prolific Safety Nigeria is a safety consultancy company. The project involved designing and developing a full WordPress website from scratch with a professional layout, mobile-first responsive design, and rich service pages that clearly communicate their offerings. Implemented on-page SEO, optimised loading speed by over 35%, and set up cPanel hosting from scratch.",
            tags: ["WordPress", "Elementor", "SEO", "cPanel"],
            url: "https://www.prolificsafety.com.ng",
            github: "",
            image: "",
            gallery: [],
            featured: true,
            gradient: "linear-gradient(135deg, #1a1a2e, #16213e)"
        },
        {
            id: "lamata",
            title: "LAMATA",
            shortDesc: "Lagos Metropolitan Area Transport Authority — government transportation website.",
            longDesc: "LAMATA (Lagos Metropolitan Area Transport Authority) is a government agency overseeing transportation in Lagos. The project required careful content management, public-facing information pages, news/press sections, and strict performance requirements. Rebuilt the WordPress installation, migrated hosting, set up SSL, and implemented a full SEO audit.",
            tags: ["WordPress", "Performance", "Hosting", "SEO"],
            url: "https://www.lamata-ng.com",
            github: "",
            image: "",
            gallery: [],
            featured: true,
            gradient: "linear-gradient(135deg, #0f2027, #203a43)"
        },
        {
            id: "coreview-checks",
            title: "Coreview Checks",
            shortDesc: "Background check and verification service website, optimised for lead generation.",
            longDesc: "Coreview Checks provides background screening and verification services. The website was designed with a strong focus on trust and conversion — clear service explanations, lead capture forms, and fast page loads. Built on WordPress with Elementor, custom plugin integrations for form management, and a contact workflow.",
            tags: ["WordPress", "SEO", "Lead Gen", "Elementor"],
            url: "https://www.coreviewchecks.com",
            github: "",
            image: "",
            gallery: [],
            featured: false,
            gradient: "linear-gradient(135deg, #1a1a2e, #2d1b69)"
        },
        {
            id: "forney-roofers",
            title: "Forney Roofers",
            shortDesc: "Local roofing services company in the US with a conversion-focused layout.",
            longDesc: "Forney Roofers is a local roofing contractor based in Forney, Texas, USA. The project focused heavily on local SEO — targeting 'roofing companies near me' style searches — along with a clean, professional design that builds trust with homeowners. Implemented Google Maps embed, review widgets, and a mobile-first layout optimised for fast loading.",
            tags: ["WordPress", "Elementor", "Local SEO", "US Market"],
            url: "https://www.forneyroofers.com",
            github: "",
            image: "",
            gallery: [],
            featured: false,
            gradient: "linear-gradient(135deg, #2c1810, #4a3020)"
        },
        {
            id: "shop-inverse",
            title: "Shop Inverse",
            shortDesc: "E-commerce storefront with WooCommerce integration and polished shopping experience.",
            longDesc: "Shop Inverse is an e-commerce platform built on WordPress with WooCommerce. The project included full product catalogue management, shopping cart and checkout flows, payment gateway integration, inventory management, and customer account areas. Optimised site speed for the product listing pages to maintain high conversion rates.",
            tags: ["WordPress", "WooCommerce", "Speed Optimisation", "E-Commerce"],
            url: "https://www.shopinverse.com",
            github: "",
            image: "",
            gallery: [],
            featured: true,
            gradient: "linear-gradient(135deg, #0a0a0c, #1a2a1a)"
        },
        {
            id: "sedeke-global",
            title: "Sedeke Global Nigeria",
            shortDesc: "Corporate website with service pages, SEO, and mobile-first design.",
            longDesc: "Sedeke Global is a Nigerian business conglomerate requiring a polished corporate website. The project involved custom page layouts for their multiple service divisions, an executive team page, and contact integration. Built with Elementor Pro with custom CSS overrides for unique design elements, and full SEO foundation setup.",
            tags: ["WordPress", "SEO", "Responsive", "Corporate"],
            url: "https://www.sedekeglobal.com.ng",
            github: "",
            image: "",
            gallery: [],
            featured: false,
            gradient: "linear-gradient(135deg, #1a0a2e, #2d1b4e)"
        },
        {
            id: "techruly",
            title: "Techruly",
            shortDesc: "Tech-focused blog and digital platform with fast loading and structured data.",
            longDesc: "Techruly is a technology blog and digital media platform covering tech news, reviews, and tutorials. Built on WordPress with a custom child theme optimised for reading speed and content discovery. Implemented structured data (JSON-LD) for article schema, AMP compatibility, and an ad integration setup for monetisation.",
            tags: ["WordPress", "Performance", "SEO", "Blog"],
            url: "https://www.techruly.com",
            github: "",
            image: "",
            gallery: [],
            featured: false,
            gradient: "linear-gradient(135deg, #001a33, #002244)"
        }
    ],
    skills: {
        technical: [
            { category: "WordPress Development", icon: "fa-brands fa-wordpress", items: ["Custom Themes & Plugins", "Custom Post Types", "Elementor & WPBakery", "Gutenberg Editor", "WooCommerce"] },
            { category: "Front-End Development", icon: "fa-solid fa-code", items: ["HTML5 & Semantic Markup", "CSS3 & Animations", "JavaScript (ES6+)", "Responsive Web Design", "Cross-Browser Compatibility"] },
            { category: "Back-End & CMS", icon: "fa-solid fa-database", items: ["PHP (Basic–Intermediate)", "MySQL Databases", "cPanel / WHM", "REST API Integration", "Plugin Development"] },
            { category: "Hosting & Server", icon: "fa-solid fa-server", items: ["Website Migrations", "DNS & Email Setup", "SSL Certificate Installation", "Domain Management", "Backups & Security"] },
            { category: "SEO & Optimisation", icon: "fa-solid fa-magnifying-glass-chart", items: ["On-Page SEO Strategies", "Speed & Performance Tuning", "Yoast SEO / RankMath", "Google Analytics Setup", "Core Web Vitals"] },
            { category: "Design Tools", icon: "fa-solid fa-palette", items: ["Adobe Photoshop", "Adobe Illustrator", "CorelDRAW", "Canva", "Microsoft Office Suite"] }
        ],
        soft: [
            { title: "Problem-Solving", icon: "fa-solid fa-brain", desc: "Analytical mindset with a proven ability to diagnose and resolve both frontend and backend issues quickly." },
            { title: "Communication", icon: "fa-solid fa-comments", desc: "Excellent verbal and written communication across local and remote teams and with non-technical stakeholders." },
            { title: "Project Management", icon: "fa-solid fa-list-check", desc: "Proven track record of managing multiple client projects simultaneously while consistently meeting deadlines." },
            { title: "Remote Collaboration", icon: "fa-solid fa-laptop-house", desc: "Comfortable working asynchronously across time zones, with strong self-direction and accountability." }
        ]
    },
    experience: [
        { id: "youthup", role: "Volunteer WordPress Developer (Pro Bono)", company: "Youthup Global", type: "Remote", badge: "Current", badgeClass: "badge-gold", date: "Oct 2025 – Present", summary: "Supporting Youthup Global and Utidia platforms, contributing to digital transformation initiatives across Africa.", bullets: ["Manage and update Youthup Global and Utidia WordPress websites.", "Conduct regular WordPress core/plugin updates, backups, and security audits.", "Troubleshoot backend issues and maintain stable website performance.", "Collaborate with Technology & Communications teams on new features and UX improvements."] },
        { id: "iit", role: "Website Developer & IT/Technical Support", company: "Institute for Industrial Technology (IIT)", type: "Onsite", badge: "NYSC", badgeClass: "badge-blue", date: "Apr 2025 – Mar 2026", summary: "Serving as the institute's website developer and IT officer under the NYSC program.", bullets: ["Managing the rebuild of the institute's official website.", "Developing and updating content, optimising performance, and implementing SEO.", "Providing IT support including hardware/software troubleshooting, network setup.", "Handling email configurations, hosting management, and backups."] },
        { id: "jotel", role: "WordPress Developer", company: "Jotel Quick Computer Solutions", type: "Onsite", badge: "", badgeClass: "", date: "Jun 2022 – Mar 2025", summary: "Designed and developed custom WordPress websites for over 30 clients.", bullets: ["Optimised website loading speeds achieving an average improvement of 40%.", "Implemented SEO best practices, increasing client traffic by 30%.", "Troubleshot and resolved technical issues, ensuring minimal downtime.", "Collaborated with designers and content creators to maintain brand consistency."] },
        { id: "pixelbridge", role: "Junior WordPress Developer", company: "PixelBridge Tech", type: "Remote", badge: "", badgeClass: "", date: "Jun 2021 – Dec 2022", summary: "Assisted in the customisation of WordPress themes and plugins for 15+ projects.", bullets: ["Conducted website testing for performance and cross-browser compatibility.", "Updated and managed website content using Elementor and WPBakery.", "Supported senior developers in debugging complex website issues.", "Contributed to SEO optimization for improved search rankings."] },
        { id: "brightcode", role: "Web Development Intern", company: "BrightCode Creatives", type: "Remote", badge: "Internship", badgeClass: "badge-purple", date: "Jan 2021 – May 2021", summary: "Built and maintained small business WordPress websites under senior developer supervision.", bullets: ["Gained hands-on experience with WordPress theme development and plugin integration.", "Performed routine updates and backups to ensure security and stability.", "Assisted in creating content layouts using Gutenberg and Elementor.", "Applied SEO fundamentals to improve website visibility."] }
    ],
    education: [
        { degree: "B.Sc Statistics", school: "Federal University Wukari, Taraba State", period: "2019 – 2024", icon: "fa-solid fa-graduation-cap" },
        { degree: "Senior Secondary School", school: "Loyola College, Ibadan, Oyo State", period: "2016 – 2019", icon: "fa-solid fa-school" }
    ]
};

const STORAGE_KEY = "ea_portfolio_data";

function getData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            saveData(DEFAULT_DATA);
            return DEFAULT_DATA;
        }
        return JSON.parse(stored);
    } catch (e) {
        return DEFAULT_DATA;
    }
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getProjects() {
    return getData().projects || [];
}

function getProject(id) {
    return getProjects().find(p => p.id === id) || null;
}

function saveProject(project) {
    const data = getData();
    const idx = data.projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
        data.projects[idx] = project;
    } else {
        data.projects.push(project);
    }
    saveData(data);
}

function deleteProject(id) {
    const data = getData();
    data.projects = data.projects.filter(p => p.id !== id);
    saveData(data);
}

function getProfile() {
    return getData().profile || DEFAULT_DATA.profile;
}

function saveProfile(profile) {
    const data = getData();
    data.profile = profile;
    saveData(data);
}

function resetData() {
    saveData(DEFAULT_DATA);
}

function getTechStacks() {
    return getData().techStacks || DEFAULT_DATA.techStacks;
}

function saveTechStacks(stacks) {
    const data = getData();
    data.techStacks = stacks;
    saveData(data);
}

// ---- TESTIMONIALS ----
function getTestimonials() {
    return getData().testimonials || DEFAULT_DATA.testimonials;
}

function saveTestimonials(testimonials) {
    const data = getData();
    data.testimonials = testimonials;
    saveData(data);
}

// Seed on load
getData();

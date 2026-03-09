/* ================================================================
   admin.js — Complete Portfolio CMS Controller
   ================================================================ */
import {
  loadSiteContent,
  saveSiteContent,
  loadProjects,
  saveProject,
  deleteProject,
  loadTestimonials,
  saveTestimonial,
  deleteTestimonial,
  loadMessages,
  updateMessageStatus,
  uploadProfileImage,
  uploadProjectImage,
  uploadTestimonialImage,
  exportStateSnapshot,
  importStateSnapshot,
  seedRemoteContent,
  getAvailableTechStacks,
  getContentRuntimeMode,
  loadAdminUsers,
  loadAuditLog,
  loadContentVersions,
  createVersionSnapshot,
  inviteAdminUser,
  pingSearchConsoleSitemap,
  removeAdminUser,
  restoreContentVersion,
  generateAdminAiText
} from "./content-service.js";

import {
  signInAdmin,
  signOutAdmin,
  changeAdminPassword,
  onAdminAuthChanged,
  isSupabaseReady
} from "./supabase-config.js";

import { escapeHtml, sanitizePlainText } from "./security.js";
import { applySeo, injectAnalytics } from "./seo.js";

/* ── Icon library (FA 6 Free) ────────────────────────────────────── */
const FA_ICONS = [
  /* Interface */
  {cls:"fa-solid fa-house",name:"House",cat:"Interface"},
  {cls:"fa-solid fa-bars",name:"Bars / Menu",cat:"Interface"},
  {cls:"fa-solid fa-xmark",name:"Close / X",cat:"Interface"},
  {cls:"fa-solid fa-magnifying-glass",name:"Search",cat:"Interface"},
  {cls:"fa-solid fa-gear",name:"Settings / Gear",cat:"Interface"},
  {cls:"fa-solid fa-sliders",name:"Sliders",cat:"Interface"},
  {cls:"fa-solid fa-ellipsis",name:"Ellipsis",cat:"Interface"},
  {cls:"fa-solid fa-ellipsis-vertical",name:"Ellipsis Vertical",cat:"Interface"},
  {cls:"fa-solid fa-grip",name:"Grip",cat:"Interface"},
  {cls:"fa-solid fa-grip-vertical",name:"Grip Vertical",cat:"Interface"},
  {cls:"fa-solid fa-table-columns",name:"Columns",cat:"Interface"},
  {cls:"fa-solid fa-table-cells",name:"Table Cells",cat:"Interface"},
  {cls:"fa-solid fa-list",name:"List",cat:"Interface"},
  {cls:"fa-solid fa-list-check",name:"List Check",cat:"Interface"},
  {cls:"fa-solid fa-filter",name:"Filter",cat:"Interface"},
  {cls:"fa-solid fa-sort",name:"Sort",cat:"Interface"},
  {cls:"fa-solid fa-eye",name:"Eye / View",cat:"Interface"},
  {cls:"fa-solid fa-eye-slash",name:"Eye Slash / Hide",cat:"Interface"},
  {cls:"fa-solid fa-lock",name:"Lock",cat:"Interface"},
  {cls:"fa-solid fa-lock-open",name:"Unlock",cat:"Interface"},
  {cls:"fa-solid fa-toggle-on",name:"Toggle On",cat:"Interface"},
  {cls:"fa-solid fa-toggle-off",name:"Toggle Off",cat:"Interface"},
  {cls:"fa-solid fa-thumbtack",name:"Pin",cat:"Interface"},
  {cls:"fa-solid fa-bookmark",name:"Bookmark",cat:"Interface"},
  {cls:"fa-solid fa-tag",name:"Tag",cat:"Interface"},
  {cls:"fa-solid fa-tags",name:"Tags",cat:"Interface"},
  {cls:"fa-solid fa-flag",name:"Flag",cat:"Interface"},
  {cls:"fa-solid fa-star",name:"Star",cat:"Interface"},
  {cls:"fa-solid fa-heart",name:"Heart",cat:"Interface"},
  {cls:"fa-solid fa-circle-plus",name:"Add (circle)",cat:"Interface"},
  {cls:"fa-solid fa-circle-minus",name:"Remove (circle)",cat:"Interface"},
  {cls:"fa-solid fa-circle-check",name:"Check (circle)",cat:"Interface"},
  {cls:"fa-solid fa-circle-xmark",name:"X (circle)",cat:"Interface"},
  {cls:"fa-solid fa-circle-info",name:"Info (circle)",cat:"Interface"},
  {cls:"fa-solid fa-circle-question",name:"Question (circle)",cat:"Interface"},
  {cls:"fa-solid fa-square-check",name:"Check (square)",cat:"Interface"},
  {cls:"fa-solid fa-square-plus",name:"Add (square)",cat:"Interface"},
  {cls:"fa-solid fa-square-minus",name:"Minus (square)",cat:"Interface"},
  {cls:"fa-solid fa-bell",name:"Bell",cat:"Interface"},
  {cls:"fa-solid fa-bell-slash",name:"Bell Slash",cat:"Interface"},
  {cls:"fa-solid fa-palette",name:"Palette",cat:"Interface"},
  {cls:"fa-solid fa-wand-magic-sparkles",name:"Magic Wand",cat:"Interface"},
  {cls:"fa-solid fa-puzzle-piece",name:"Puzzle",cat:"Interface"},
  {cls:"fa-solid fa-plug",name:"Plug",cat:"Interface"},
  {cls:"fa-solid fa-power-off",name:"Power",cat:"Interface"},
  {cls:"fa-solid fa-expand",name:"Expand",cat:"Interface"},
  {cls:"fa-solid fa-compress",name:"Compress",cat:"Interface"},
  {cls:"fa-solid fa-maximize",name:"Maximize",cat:"Interface"},
  {cls:"fa-solid fa-minimize",name:"Minimize",cat:"Interface"},
  /* Arrows */
  {cls:"fa-solid fa-arrow-left",name:"Arrow Left",cat:"Arrows"},
  {cls:"fa-solid fa-arrow-right",name:"Arrow Right",cat:"Arrows"},
  {cls:"fa-solid fa-arrow-up",name:"Arrow Up",cat:"Arrows"},
  {cls:"fa-solid fa-arrow-down",name:"Arrow Down",cat:"Arrows"},
  {cls:"fa-solid fa-arrow-up-right-from-square",name:"External Link",cat:"Arrows"},
  {cls:"fa-solid fa-arrows-left-right",name:"Arrows H",cat:"Arrows"},
  {cls:"fa-solid fa-arrows-up-down",name:"Arrows V",cat:"Arrows"},
  {cls:"fa-solid fa-rotate",name:"Rotate",cat:"Arrows"},
  {cls:"fa-solid fa-rotate-left",name:"Undo",cat:"Arrows"},
  {cls:"fa-solid fa-rotate-right",name:"Redo",cat:"Arrows"},
  {cls:"fa-solid fa-chevron-left",name:"Chevron Left",cat:"Arrows"},
  {cls:"fa-solid fa-chevron-right",name:"Chevron Right",cat:"Arrows"},
  {cls:"fa-solid fa-chevron-up",name:"Chevron Up",cat:"Arrows"},
  {cls:"fa-solid fa-chevron-down",name:"Chevron Down",cat:"Arrows"},
  {cls:"fa-solid fa-angles-left",name:"Double Chevron Left",cat:"Arrows"},
  {cls:"fa-solid fa-angles-right",name:"Double Chevron Right",cat:"Arrows"},
  {cls:"fa-solid fa-up-right-and-down-left-from-center",name:"Expand Out",cat:"Arrows"},
  {cls:"fa-solid fa-down-left-and-up-right-to-center",name:"Compress In",cat:"Arrows"},
  {cls:"fa-solid fa-turn-up",name:"Turn Up",cat:"Arrows"},
  {cls:"fa-solid fa-turn-down",name:"Turn Down",cat:"Arrows"},
  /* Communication */
  {cls:"fa-solid fa-envelope",name:"Email",cat:"Communication"},
  {cls:"fa-solid fa-envelope-open",name:"Email Open",cat:"Communication"},
  {cls:"fa-solid fa-envelope-circle-check",name:"Email Confirmed",cat:"Communication"},
  {cls:"fa-solid fa-paper-plane",name:"Send",cat:"Communication"},
  {cls:"fa-solid fa-inbox",name:"Inbox",cat:"Communication"},
  {cls:"fa-solid fa-comment",name:"Comment",cat:"Communication"},
  {cls:"fa-solid fa-comments",name:"Comments",cat:"Communication"},
  {cls:"fa-solid fa-comment-dots",name:"Comment Dots",cat:"Communication"},
  {cls:"fa-solid fa-message",name:"Message",cat:"Communication"},
  {cls:"fa-solid fa-phone",name:"Phone",cat:"Communication"},
  {cls:"fa-solid fa-phone-volume",name:"Phone Volume",cat:"Communication"},
  {cls:"fa-solid fa-phone-flip",name:"Phone Flip",cat:"Communication"},
  {cls:"fa-solid fa-video",name:"Video Call",cat:"Communication"},
  {cls:"fa-solid fa-at",name:"At / Email",cat:"Communication"},
  {cls:"fa-solid fa-hashtag",name:"Hashtag",cat:"Communication"},
  {cls:"fa-solid fa-rss",name:"RSS Feed",cat:"Communication"},
  {cls:"fa-solid fa-share",name:"Share",cat:"Communication"},
  {cls:"fa-solid fa-share-nodes",name:"Share Nodes",cat:"Communication"},
  {cls:"fa-solid fa-bullhorn",name:"Bullhorn",cat:"Communication"},
  {cls:"fa-solid fa-broadcast-tower",name:"Broadcast",cat:"Communication"},
  {cls:"fa-solid fa-satellite-dish",name:"Satellite Dish",cat:"Communication"},
  {cls:"fa-solid fa-wifi",name:"WiFi",cat:"Communication"},
  {cls:"fa-solid fa-signal",name:"Signal",cat:"Communication"},
  {cls:"fa-solid fa-network-wired",name:"Network",cat:"Communication"},
  /* Business & Finance */
  {cls:"fa-solid fa-briefcase",name:"Briefcase",cat:"Business"},
  {cls:"fa-solid fa-building",name:"Building",cat:"Business"},
  {cls:"fa-solid fa-building-columns",name:"Institution",cat:"Business"},
  {cls:"fa-solid fa-landmark",name:"Landmark",cat:"Business"},
  {cls:"fa-solid fa-handshake",name:"Handshake",cat:"Business"},
  {cls:"fa-solid fa-handshake-simple",name:"Handshake Simple",cat:"Business"},
  {cls:"fa-solid fa-dollar-sign",name:"Dollar",cat:"Business"},
  {cls:"fa-solid fa-euro-sign",name:"Euro",cat:"Business"},
  {cls:"fa-solid fa-sterling-sign",name:"Pound",cat:"Business"},
  {cls:"fa-solid fa-coins",name:"Coins",cat:"Business"},
  {cls:"fa-solid fa-credit-card",name:"Credit Card",cat:"Business"},
  {cls:"fa-solid fa-wallet",name:"Wallet",cat:"Business"},
  {cls:"fa-solid fa-receipt",name:"Receipt",cat:"Business"},
  {cls:"fa-solid fa-file-invoice",name:"Invoice",cat:"Business"},
  {cls:"fa-solid fa-file-invoice-dollar",name:"Invoice Dollar",cat:"Business"},
  {cls:"fa-solid fa-chart-line",name:"Chart Line",cat:"Business"},
  {cls:"fa-solid fa-chart-bar",name:"Chart Bar",cat:"Business"},
  {cls:"fa-solid fa-chart-pie",name:"Chart Pie",cat:"Business"},
  {cls:"fa-solid fa-chart-column",name:"Chart Column",cat:"Business"},
  {cls:"fa-solid fa-arrow-trend-up",name:"Trend Up",cat:"Business"},
  {cls:"fa-solid fa-arrow-trend-down",name:"Trend Down",cat:"Business"},
  {cls:"fa-solid fa-sack-dollar",name:"Sack Dollar",cat:"Business"},
  {cls:"fa-solid fa-scale-balanced",name:"Scale",cat:"Business"},
  {cls:"fa-solid fa-award",name:"Award",cat:"Business"},
  {cls:"fa-solid fa-medal",name:"Medal",cat:"Business"},
  {cls:"fa-solid fa-trophy",name:"Trophy",cat:"Business"},
  {cls:"fa-solid fa-ranking-star",name:"Ranking Star",cat:"Business"},
  /* Technology */
  {cls:"fa-solid fa-laptop",name:"Laptop",cat:"Technology"},
  {cls:"fa-solid fa-laptop-code",name:"Laptop Code",cat:"Technology"},
  {cls:"fa-solid fa-computer",name:"Desktop",cat:"Technology"},
  {cls:"fa-solid fa-mobile-screen",name:"Mobile",cat:"Technology"},
  {cls:"fa-solid fa-tablet-screen-button",name:"Tablet",cat:"Technology"},
  {cls:"fa-solid fa-server",name:"Server",cat:"Technology"},
  {cls:"fa-solid fa-database",name:"Database",cat:"Technology"},
  {cls:"fa-solid fa-code",name:"Code",cat:"Technology"},
  {cls:"fa-solid fa-code-branch",name:"Branch",cat:"Technology"},
  {cls:"fa-solid fa-code-commit",name:"Commit",cat:"Technology"},
  {cls:"fa-solid fa-code-merge",name:"Merge",cat:"Technology"},
  {cls:"fa-solid fa-code-pull-request",name:"Pull Request",cat:"Technology"},
  {cls:"fa-solid fa-terminal",name:"Terminal",cat:"Technology"},
  {cls:"fa-solid fa-microchip",name:"Microchip",cat:"Technology"},
  {cls:"fa-solid fa-memory",name:"Memory",cat:"Technology"},
  {cls:"fa-solid fa-hard-drive",name:"Hard Drive",cat:"Technology"},
  {cls:"fa-solid fa-floppy-disk",name:"Save / Disk",cat:"Technology"},
  {cls:"fa-solid fa-cloud",name:"Cloud",cat:"Technology"},
  {cls:"fa-solid fa-cloud-arrow-up",name:"Upload Cloud",cat:"Technology"},
  {cls:"fa-solid fa-cloud-arrow-down",name:"Download Cloud",cat:"Technology"},
  {cls:"fa-solid fa-upload",name:"Upload",cat:"Technology"},
  {cls:"fa-solid fa-download",name:"Download",cat:"Technology"},
  {cls:"fa-solid fa-robot",name:"Robot / AI",cat:"Technology"},
  {cls:"fa-solid fa-brain",name:"Brain / AI",cat:"Technology"},
  {cls:"fa-solid fa-sitemap",name:"Sitemap",cat:"Technology"},
  {cls:"fa-solid fa-diagram-project",name:"Diagram",cat:"Technology"},
  {cls:"fa-solid fa-layer-group",name:"Layers",cat:"Technology"},
  {cls:"fa-solid fa-cubes",name:"Cubes",cat:"Technology"},
  {cls:"fa-solid fa-cube",name:"Cube",cat:"Technology"},
  {cls:"fa-solid fa-boxes-stacked",name:"Boxes",cat:"Technology"},
  {cls:"fa-solid fa-bug",name:"Bug",cat:"Technology"},
  {cls:"fa-solid fa-bug-slash",name:"No Bug",cat:"Technology"},
  {cls:"fa-solid fa-shield",name:"Shield",cat:"Technology"},
  {cls:"fa-solid fa-shield-halved",name:"Shield Half",cat:"Technology"},
  {cls:"fa-solid fa-key",name:"Key",cat:"Technology"},
  {cls:"fa-solid fa-fingerprint",name:"Fingerprint",cat:"Technology"},
  {cls:"fa-solid fa-qrcode",name:"QR Code",cat:"Technology"},
  {cls:"fa-solid fa-barcode",name:"Barcode",cat:"Technology"},
  {cls:"fa-solid fa-globe",name:"Globe / Web",cat:"Technology"},
  {cls:"fa-solid fa-earth-americas",name:"Earth",cat:"Technology"},
  {cls:"fa-solid fa-link",name:"Link",cat:"Technology"},
  {cls:"fa-solid fa-link-slash",name:"Broken Link",cat:"Technology"},
  {cls:"fa-solid fa-window-maximize",name:"Browser",cat:"Technology"},
  {cls:"fa-solid fa-window-restore",name:"Window",cat:"Technology"},
  {cls:"fa-solid fa-display",name:"Monitor",cat:"Technology"},
  {cls:"fa-solid fa-print",name:"Print",cat:"Technology"},
  {cls:"fa-solid fa-keyboard",name:"Keyboard",cat:"Technology"},
  {cls:"fa-solid fa-computer-mouse",name:"Mouse",cat:"Technology"},
  {cls:"fa-solid fa-headphones",name:"Headphones",cat:"Technology"},
  {cls:"fa-solid fa-camera",name:"Camera",cat:"Technology"},
  {cls:"fa-solid fa-camera-retro",name:"Camera Retro",cat:"Technology"},
  {cls:"fa-solid fa-gamepad",name:"Gamepad",cat:"Technology"},
  {cls:"fa-solid fa-tv",name:"TV",cat:"Technology"},
  {cls:"fa-solid fa-satellite",name:"Satellite",cat:"Technology"},
  {cls:"fa-solid fa-battery-full",name:"Battery Full",cat:"Technology"},
  {cls:"fa-solid fa-battery-half",name:"Battery Half",cat:"Technology"},
  {cls:"fa-solid fa-charging-station",name:"Charging",cat:"Technology"},
  /* Media & Player */
  {cls:"fa-solid fa-play",name:"Play",cat:"Media"},
  {cls:"fa-solid fa-pause",name:"Pause",cat:"Media"},
  {cls:"fa-solid fa-stop",name:"Stop",cat:"Media"},
  {cls:"fa-solid fa-forward",name:"Forward",cat:"Media"},
  {cls:"fa-solid fa-backward",name:"Backward",cat:"Media"},
  {cls:"fa-solid fa-forward-fast",name:"Fast Forward",cat:"Media"},
  {cls:"fa-solid fa-backward-fast",name:"Rewind",cat:"Media"},
  {cls:"fa-solid fa-volume-high",name:"Volume High",cat:"Media"},
  {cls:"fa-solid fa-volume-low",name:"Volume Low",cat:"Media"},
  {cls:"fa-solid fa-volume-xmark",name:"Mute",cat:"Media"},
  {cls:"fa-solid fa-music",name:"Music",cat:"Media"},
  {cls:"fa-solid fa-microphone",name:"Microphone",cat:"Media"},
  {cls:"fa-solid fa-microphone-slash",name:"Mic Off",cat:"Media"},
  {cls:"fa-solid fa-film",name:"Film",cat:"Media"},
  {cls:"fa-solid fa-clapperboard",name:"Clapperboard",cat:"Media"},
  {cls:"fa-solid fa-photo-film",name:"Photo Film",cat:"Media"},
  {cls:"fa-solid fa-image",name:"Image",cat:"Media"},
  {cls:"fa-solid fa-images",name:"Images / Gallery",cat:"Media"},
  {cls:"fa-solid fa-podcast",name:"Podcast",cat:"Media"},
  {cls:"fa-solid fa-radio",name:"Radio",cat:"Media"},
  /* People & Users */
  {cls:"fa-solid fa-user",name:"User",cat:"People"},
  {cls:"fa-solid fa-user-tie",name:"User Tie",cat:"People"},
  {cls:"fa-solid fa-user-pen",name:"User Edit",cat:"People"},
  {cls:"fa-solid fa-user-check",name:"User Check",cat:"People"},
  {cls:"fa-solid fa-user-plus",name:"User Plus",cat:"People"},
  {cls:"fa-solid fa-user-minus",name:"User Minus",cat:"People"},
  {cls:"fa-solid fa-user-xmark",name:"User Remove",cat:"People"},
  {cls:"fa-solid fa-user-gear",name:"User Gear",cat:"People"},
  {cls:"fa-solid fa-user-shield",name:"User Shield",cat:"People"},
  {cls:"fa-solid fa-user-graduate",name:"Graduate",cat:"People"},
  {cls:"fa-solid fa-user-doctor",name:"Doctor",cat:"People"},
  {cls:"fa-solid fa-users",name:"Users / Team",cat:"People"},
  {cls:"fa-solid fa-users-gear",name:"Users Gear",cat:"People"},
  {cls:"fa-solid fa-people-group",name:"Group",cat:"People"},
  {cls:"fa-solid fa-person",name:"Person",cat:"People"},
  {cls:"fa-solid fa-person-running",name:"Running",cat:"People"},
  {cls:"fa-solid fa-person-walking",name:"Walking",cat:"People"},
  {cls:"fa-solid fa-person-rays",name:"Person Rays",cat:"People"},
  {cls:"fa-solid fa-id-card",name:"ID Card",cat:"People"},
  {cls:"fa-solid fa-id-badge",name:"ID Badge",cat:"People"},
  {cls:"fa-solid fa-address-book",name:"Address Book",cat:"People"},
  {cls:"fa-solid fa-address-card",name:"Address Card",cat:"People"},
  /* Files & Documents */
  {cls:"fa-solid fa-file",name:"File",cat:"Files"},
  {cls:"fa-solid fa-file-lines",name:"File Lines",cat:"Files"},
  {cls:"fa-solid fa-file-code",name:"File Code",cat:"Files"},
  {cls:"fa-solid fa-file-image",name:"File Image",cat:"Files"},
  {cls:"fa-solid fa-file-video",name:"File Video",cat:"Files"},
  {cls:"fa-solid fa-file-audio",name:"File Audio",cat:"Files"},
  {cls:"fa-solid fa-file-pdf",name:"PDF",cat:"Files"},
  {cls:"fa-solid fa-file-word",name:"Word Doc",cat:"Files"},
  {cls:"fa-solid fa-file-excel",name:"Excel",cat:"Files"},
  {cls:"fa-solid fa-file-powerpoint",name:"PowerPoint",cat:"Files"},
  {cls:"fa-solid fa-file-zipper",name:"Zip Archive",cat:"Files"},
  {cls:"fa-solid fa-file-arrow-up",name:"File Upload",cat:"Files"},
  {cls:"fa-solid fa-file-arrow-down",name:"File Download",cat:"Files"},
  {cls:"fa-solid fa-file-circle-check",name:"File Check",cat:"Files"},
  {cls:"fa-solid fa-file-circle-plus",name:"New File",cat:"Files"},
  {cls:"fa-solid fa-file-circle-xmark",name:"File Delete",cat:"Files"},
  {cls:"fa-solid fa-folder",name:"Folder",cat:"Files"},
  {cls:"fa-solid fa-folder-open",name:"Folder Open",cat:"Files"},
  {cls:"fa-solid fa-folder-plus",name:"New Folder",cat:"Files"},
  {cls:"fa-solid fa-folder-minus",name:"Remove Folder",cat:"Files"},
  {cls:"fa-solid fa-folder-tree",name:"Folder Tree",cat:"Files"},
  {cls:"fa-solid fa-copy",name:"Copy",cat:"Files"},
  {cls:"fa-solid fa-paste",name:"Paste",cat:"Files"},
  {cls:"fa-solid fa-scissors",name:"Cut",cat:"Files"},
  {cls:"fa-solid fa-trash",name:"Trash / Delete",cat:"Files"},
  {cls:"fa-solid fa-trash-can",name:"Trash Can",cat:"Files"},
  {cls:"fa-solid fa-pen",name:"Edit Pen",cat:"Files"},
  {cls:"fa-solid fa-pen-to-square",name:"Edit",cat:"Files"},
  {cls:"fa-solid fa-pencil",name:"Pencil",cat:"Files"},
  {cls:"fa-solid fa-eraser",name:"Eraser",cat:"Files"},
  {cls:"fa-solid fa-note-sticky",name:"Sticky Note",cat:"Files"},
  {cls:"fa-solid fa-paperclip",name:"Paperclip",cat:"Files"},
  {cls:"fa-solid fa-print",name:"Print",cat:"Files"},
  {cls:"fa-solid fa-book",name:"Book",cat:"Files"},
  {cls:"fa-solid fa-book-open",name:"Book Open",cat:"Files"},
  {cls:"fa-solid fa-book-bookmark",name:"Book Bookmark",cat:"Files"},
  {cls:"fa-solid fa-books",name:"Books",cat:"Files"},
  {cls:"fa-solid fa-newspaper",name:"Newspaper",cat:"Files"},
  {cls:"fa-solid fa-scroll",name:"Scroll",cat:"Files"},
  {cls:"fa-solid fa-rectangle-list",name:"List View",cat:"Files"},
  {cls:"fa-solid fa-table-list",name:"Table List",cat:"Files"},
  /* Status & Alerts */
  {cls:"fa-solid fa-check",name:"Check",cat:"Status"},
  {cls:"fa-solid fa-check-double",name:"Double Check",cat:"Status"},
  {cls:"fa-solid fa-xmark",name:"X Mark",cat:"Status"},
  {cls:"fa-solid fa-exclamation",name:"Exclamation",cat:"Status"},
  {cls:"fa-solid fa-triangle-exclamation",name:"Warning",cat:"Status"},
  {cls:"fa-solid fa-circle-exclamation",name:"Alert",cat:"Status"},
  {cls:"fa-solid fa-ban",name:"Ban / Forbidden",cat:"Status"},
  {cls:"fa-solid fa-minus",name:"Minus",cat:"Status"},
  {cls:"fa-solid fa-plus",name:"Plus",cat:"Status"},
  {cls:"fa-solid fa-spinner",name:"Spinner / Loading",cat:"Status"},
  {cls:"fa-solid fa-hourglass-half",name:"Loading / Time",cat:"Status"},
  {cls:"fa-solid fa-clock",name:"Clock",cat:"Status"},
  {cls:"fa-solid fa-clock-rotate-left",name:"History",cat:"Status"},
  {cls:"fa-solid fa-calendar",name:"Calendar",cat:"Status"},
  {cls:"fa-solid fa-calendar-days",name:"Calendar Days",cat:"Status"},
  {cls:"fa-solid fa-calendar-check",name:"Calendar Check",cat:"Status"},
  {cls:"fa-solid fa-calendar-plus",name:"Schedule Add",cat:"Status"},
  {cls:"fa-solid fa-location-dot",name:"Location Pin",cat:"Status"},
  {cls:"fa-solid fa-location-crosshairs",name:"GPS Target",cat:"Status"},
  {cls:"fa-solid fa-map",name:"Map",cat:"Status"},
  {cls:"fa-solid fa-map-location-dot",name:"Map Pin",cat:"Status"},
  {cls:"fa-solid fa-compass",name:"Compass",cat:"Status"},
  {cls:"fa-solid fa-fire",name:"Fire",cat:"Status"},
  {cls:"fa-solid fa-fire-flame-curved",name:"Fire Flame",cat:"Status"},
  {cls:"fa-solid fa-bolt",name:"Lightning / Fast",cat:"Status"},
  {cls:"fa-solid fa-star-of-life",name:"Star Of Life",cat:"Status"},
  /* Design & Art */
  {cls:"fa-solid fa-paintbrush",name:"Paintbrush",cat:"Design"},
  {cls:"fa-solid fa-pen-nib",name:"Pen Nib",cat:"Design"},
  {cls:"fa-solid fa-pen-ruler",name:"Pen Ruler",cat:"Design"},
  {cls:"fa-solid fa-ruler",name:"Ruler",cat:"Design"},
  {cls:"fa-solid fa-ruler-combined",name:"Ruler Combined",cat:"Design"},
  {cls:"fa-solid fa-compass-drafting",name:"Drafting Compass",cat:"Design"},
  {cls:"fa-solid fa-crop",name:"Crop",cat:"Design"},
  {cls:"fa-solid fa-crop-simple",name:"Crop Simple",cat:"Design"},
  {cls:"fa-solid fa-vector-square",name:"Vector",cat:"Design"},
  {cls:"fa-solid fa-shapes",name:"Shapes",cat:"Design"},
  {cls:"fa-solid fa-swatchbook",name:"Swatchbook",cat:"Design"},
  {cls:"fa-solid fa-fill-drip",name:"Fill / Color",cat:"Design"},
  {cls:"fa-solid fa-eye-dropper",name:"Eye Dropper",cat:"Design"},
  {cls:"fa-solid fa-object-group",name:"Group Objects",cat:"Design"},
  {cls:"fa-solid fa-object-ungroup",name:"Ungroup",cat:"Design"},
  {cls:"fa-solid fa-square",name:"Square",cat:"Design"},
  {cls:"fa-solid fa-circle",name:"Circle",cat:"Design"},
  {cls:"fa-solid fa-diamond",name:"Diamond",cat:"Design"},
  /* Education */
  {cls:"fa-solid fa-graduation-cap",name:"Graduation Cap",cat:"Education"},
  {cls:"fa-solid fa-school",name:"School",cat:"Education"},
  {cls:"fa-solid fa-chalkboard-user",name:"Chalkboard",cat:"Education"},
  {cls:"fa-solid fa-microscope",name:"Microscope",cat:"Education"},
  {cls:"fa-solid fa-flask",name:"Flask / Science",cat:"Education"},
  {cls:"fa-solid fa-atom",name:"Atom",cat:"Education"},
  {cls:"fa-solid fa-dna",name:"DNA",cat:"Education"},
  {cls:"fa-solid fa-calculator",name:"Calculator",cat:"Education"},
  {cls:"fa-solid fa-pen-clip",name:"Pen Clip",cat:"Education"},
  {cls:"fa-solid fa-lightbulb",name:"Lightbulb / Idea",cat:"Education"},
  {cls:"fa-solid fa-certificate",name:"Certificate",cat:"Education"},
  {cls:"fa-solid fa-infinity",name:"Infinity",cat:"Education"},
  {cls:"fa-solid fa-subscript",name:"Subscript",cat:"Education"},
  {cls:"fa-solid fa-superscript",name:"Superscript",cat:"Education"},
  {cls:"fa-solid fa-sigma",name:"Sigma",cat:"Education"},
  {cls:"fa-solid fa-spell-check",name:"Spell Check",cat:"Education"},
  /* Health & Nature */
  {cls:"fa-solid fa-heart-pulse",name:"Heartbeat",cat:"Health"},
  {cls:"fa-solid fa-stethoscope",name:"Stethoscope",cat:"Health"},
  {cls:"fa-solid fa-hospital",name:"Hospital",cat:"Health"},
  {cls:"fa-solid fa-pill",name:"Pill",cat:"Health"},
  {cls:"fa-solid fa-syringe",name:"Syringe",cat:"Health"},
  {cls:"fa-solid fa-leaf",name:"Leaf / Nature",cat:"Health"},
  {cls:"fa-solid fa-seedling",name:"Seedling",cat:"Health"},
  {cls:"fa-solid fa-tree",name:"Tree",cat:"Health"},
  {cls:"fa-solid fa-sun",name:"Sun",cat:"Health"},
  {cls:"fa-solid fa-moon",name:"Moon",cat:"Health"},
  {cls:"fa-solid fa-cloud-sun",name:"Cloud Sun",cat:"Health"},
  {cls:"fa-solid fa-cloud-rain",name:"Rain",cat:"Health"},
  {cls:"fa-solid fa-snowflake",name:"Snowflake",cat:"Health"},
  {cls:"fa-solid fa-wind",name:"Wind",cat:"Health"},
  {cls:"fa-solid fa-droplet",name:"Droplet / Water",cat:"Health"},
  {cls:"fa-solid fa-recycle",name:"Recycle",cat:"Health"},
  /* Travel & Places */
  {cls:"fa-solid fa-car",name:"Car",cat:"Travel"},
  {cls:"fa-solid fa-car-side",name:"Car Side",cat:"Travel"},
  {cls:"fa-solid fa-plane",name:"Plane",cat:"Travel"},
  {cls:"fa-solid fa-plane-up",name:"Plane Up",cat:"Travel"},
  {cls:"fa-solid fa-train",name:"Train",cat:"Travel"},
  {cls:"fa-solid fa-bus",name:"Bus",cat:"Travel"},
  {cls:"fa-solid fa-bicycle",name:"Bicycle",cat:"Travel"},
  {cls:"fa-solid fa-motorcycle",name:"Motorcycle",cat:"Travel"},
  {cls:"fa-solid fa-ship",name:"Ship",cat:"Travel"},
  {cls:"fa-solid fa-rocket",name:"Rocket",cat:"Travel"},
  {cls:"fa-solid fa-hotel",name:"Hotel",cat:"Travel"},
  {cls:"fa-solid fa-map-pin",name:"Map Pin",cat:"Travel"},
  {cls:"fa-solid fa-route",name:"Route",cat:"Travel"},
  {cls:"fa-solid fa-suitcase",name:"Suitcase",cat:"Travel"},
  {cls:"fa-solid fa-suitcase-rolling",name:"Suitcase Rolling",cat:"Travel"},
  {cls:"fa-solid fa-umbrella-beach",name:"Beach",cat:"Travel"},
  {cls:"fa-solid fa-mountain",name:"Mountain",cat:"Travel"},
  {cls:"fa-solid fa-city",name:"City",cat:"Travel"},
  /* Food & Shopping */
  {cls:"fa-solid fa-utensils",name:"Utensils",cat:"Food & Shop"},
  {cls:"fa-solid fa-mug-hot",name:"Coffee Mug",cat:"Food & Shop"},
  {cls:"fa-solid fa-burger",name:"Burger",cat:"Food & Shop"},
  {cls:"fa-solid fa-pizza-slice",name:"Pizza",cat:"Food & Shop"},
  {cls:"fa-solid fa-ice-cream",name:"Ice Cream",cat:"Food & Shop"},
  {cls:"fa-solid fa-wine-glass",name:"Wine Glass",cat:"Food & Shop"},
  {cls:"fa-solid fa-cart-shopping",name:"Shopping Cart",cat:"Food & Shop"},
  {cls:"fa-solid fa-basket-shopping",name:"Basket",cat:"Food & Shop"},
  {cls:"fa-solid fa-bag-shopping",name:"Bag",cat:"Food & Shop"},
  {cls:"fa-solid fa-store",name:"Store",cat:"Food & Shop"},
  {cls:"fa-solid fa-shop",name:"Shop",cat:"Food & Shop"},
  {cls:"fa-solid fa-gift",name:"Gift",cat:"Food & Shop"},
  {cls:"fa-solid fa-percent",name:"Percent / Discount",cat:"Food & Shop"},
  {cls:"fa-solid fa-tag",name:"Price Tag",cat:"Food & Shop"},
  /* Brands */
  {cls:"fa-brands fa-github",name:"GitHub",cat:"Brands"},
  {cls:"fa-brands fa-gitlab",name:"GitLab",cat:"Brands"},
  {cls:"fa-brands fa-bitbucket",name:"Bitbucket",cat:"Brands"},
  {cls:"fa-brands fa-git-alt",name:"Git",cat:"Brands"},
  {cls:"fa-brands fa-html5",name:"HTML5",cat:"Brands"},
  {cls:"fa-brands fa-css3-alt",name:"CSS3",cat:"Brands"},
  {cls:"fa-brands fa-js",name:"JavaScript",cat:"Brands"},
  {cls:"fa-brands fa-square-js",name:"JavaScript Square",cat:"Brands"},
  {cls:"fa-brands fa-typescript",name:"TypeScript",cat:"Brands"},
  {cls:"fa-brands fa-node",name:"Node.js",cat:"Brands"},
  {cls:"fa-brands fa-node-js",name:"Node.js Alt",cat:"Brands"},
  {cls:"fa-brands fa-npm",name:"NPM",cat:"Brands"},
  {cls:"fa-brands fa-react",name:"React",cat:"Brands"},
  {cls:"fa-brands fa-vuejs",name:"Vue.js",cat:"Brands"},
  {cls:"fa-brands fa-angular",name:"Angular",cat:"Brands"},
  {cls:"fa-brands fa-php",name:"PHP",cat:"Brands"},
  {cls:"fa-brands fa-laravel",name:"Laravel",cat:"Brands"},
  {cls:"fa-brands fa-python",name:"Python",cat:"Brands"},
  {cls:"fa-brands fa-java",name:"Java",cat:"Brands"},
  {cls:"fa-brands fa-swift",name:"Swift",cat:"Brands"},
  {cls:"fa-brands fa-rust",name:"Rust",cat:"Brands"},
  {cls:"fa-brands fa-golang",name:"Go",cat:"Brands"},
  {cls:"fa-brands fa-docker",name:"Docker",cat:"Brands"},
  {cls:"fa-brands fa-aws",name:"AWS",cat:"Brands"},
  {cls:"fa-brands fa-google-cloud",name:"Google Cloud",cat:"Brands"},
  {cls:"fa-brands fa-microsoft",name:"Microsoft",cat:"Brands"},
  {cls:"fa-brands fa-linux",name:"Linux",cat:"Brands"},
  {cls:"fa-brands fa-ubuntu",name:"Ubuntu",cat:"Brands"},
  {cls:"fa-brands fa-apple",name:"Apple",cat:"Brands"},
  {cls:"fa-brands fa-android",name:"Android",cat:"Brands"},
  {cls:"fa-brands fa-windows",name:"Windows",cat:"Brands"},
  {cls:"fa-brands fa-figma",name:"Figma",cat:"Brands"},
  {cls:"fa-brands fa-wordpress",name:"WordPress",cat:"Brands"},
  {cls:"fa-brands fa-shopify",name:"Shopify",cat:"Brands"},
  {cls:"fa-brands fa-stripe",name:"Stripe",cat:"Brands"},
  {cls:"fa-brands fa-paypal",name:"PayPal",cat:"Brands"},
  {cls:"fa-brands fa-google",name:"Google",cat:"Brands"},
  {cls:"fa-brands fa-google-drive",name:"Google Drive",cat:"Brands"},
  {cls:"fa-brands fa-google-play",name:"Google Play",cat:"Brands"},
  {cls:"fa-brands fa-chrome",name:"Chrome",cat:"Brands"},
  {cls:"fa-brands fa-firefox",name:"Firefox",cat:"Brands"},
  {cls:"fa-brands fa-safari",name:"Safari",cat:"Brands"},
  {cls:"fa-brands fa-edge",name:"Edge",cat:"Brands"},
  {cls:"fa-brands fa-slack",name:"Slack",cat:"Brands"},
  {cls:"fa-brands fa-discord",name:"Discord",cat:"Brands"},
  {cls:"fa-brands fa-trello",name:"Trello",cat:"Brands"},
  {cls:"fa-brands fa-jira",name:"Jira",cat:"Brands"},
  {cls:"fa-brands fa-confluence",name:"Confluence",cat:"Brands"},
  {cls:"fa-brands fa-notion",name:"Notion",cat:"Brands"},
  {cls:"fa-brands fa-linkedin",name:"LinkedIn",cat:"Brands"},
  {cls:"fa-brands fa-linkedin-in",name:"LinkedIn In",cat:"Brands"},
  {cls:"fa-brands fa-twitter",name:"Twitter / X",cat:"Brands"},
  {cls:"fa-brands fa-x-twitter",name:"X (Twitter)",cat:"Brands"},
  {cls:"fa-brands fa-facebook",name:"Facebook",cat:"Brands"},
  {cls:"fa-brands fa-instagram",name:"Instagram",cat:"Brands"},
  {cls:"fa-brands fa-youtube",name:"YouTube",cat:"Brands"},
  {cls:"fa-brands fa-tiktok",name:"TikTok",cat:"Brands"},
  {cls:"fa-brands fa-pinterest",name:"Pinterest",cat:"Brands"},
  {cls:"fa-brands fa-reddit",name:"Reddit",cat:"Brands"},
  {cls:"fa-brands fa-stack-overflow",name:"Stack Overflow",cat:"Brands"},
  {cls:"fa-brands fa-dev",name:"DEV.to",cat:"Brands"},
  {cls:"fa-brands fa-medium",name:"Medium",cat:"Brands"},
  {cls:"fa-brands fa-hashnode",name:"Hashnode",cat:"Brands"},
  {cls:"fa-brands fa-codepen",name:"CodePen",cat:"Brands"},
  {cls:"fa-brands fa-dribbble",name:"Dribbble",cat:"Brands"},
  {cls:"fa-brands fa-behance",name:"Behance",cat:"Brands"},
  {cls:"fa-brands fa-whatsapp",name:"WhatsApp",cat:"Brands"},
  {cls:"fa-brands fa-telegram",name:"Telegram",cat:"Brands"},
  {cls:"fa-brands fa-skype",name:"Skype",cat:"Brands"},
  {cls:"fa-brands fa-spotify",name:"Spotify",cat:"Brands"},
  {cls:"fa-brands fa-apple-pay",name:"Apple Pay",cat:"Brands"},
  {cls:"fa-brands fa-google-pay",name:"Google Pay",cat:"Brands"}
];

/* ── Icon picker state ───────────────────────────────────────────── */
let _iconPickerTarget = null;
let _iconPickerPreview = null;

/* ── state ──────────────────────────────────────────────────────── */
let currentUser = null;
let siteContent = null;
let projects = [];
let testimonials = [];
let messages = [];
let auditLog = [];
let contentVersions = [];
let techStacks = [];
let adminUsers = [];
let hasLoadedDashboard = false;
let lastFocusedAdminField = null;
let lastAiRequest = null;
let lastAiReplacement = null;
let currentAiTargetFieldId = "";

const VERSION_SCOPES = [
  { value: "hero", label: "Hero Section", entityType: "site_content", entityId: "main" },
  { value: "profile", label: "Profile / About", entityType: "site_content", entityId: "main" },
  { value: "project-categories", label: "Project Categories", entityType: "site_content", entityId: "main" },
  { value: "skills", label: "Skills & Tech", entityType: "site_content", entityId: "main" },
  { value: "experience", label: "Experience", entityType: "site_content", entityId: "main" },
  { value: "education", label: "Education", entityType: "site_content", entityId: "main" },
  { value: "certifications", label: "Certifications", entityType: "site_content", entityId: "main" },
  { value: "pages", label: "Page Text", entityType: "site_content", entityId: "main" },
  { value: "settings", label: "Settings", entityType: "site_content", entityId: "main" },
  { value: "projects", label: "Project Item", entityType: "project", requiresEntity: true },
  { value: "testimonials", label: "Testimonial Item", entityType: "testimonial", requiresEntity: true }
];

/* ── DOM refs ───────────────────────────────────────────────────── */
const $ = (s, p) => (p || document).querySelector(s);
const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

/* ── Init ───────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  techStacks = getAvailableTechStacks();
  document.addEventListener("focusin", trackLastFocusedAdminField);
  applySeo({
    title: document.title,
    description: getCurrentAdminDescription(),
    robots: "noindex,nofollow,noarchive"
  });
  loadSiteContent()
    .then((content) => {
      applySeo({
        siteUrl: content?.settings?.siteUrl,
        title: document.title,
        description: getCurrentAdminDescription(),
        robots: "noindex,nofollow,noarchive"
      });
      injectAnalytics(content?.settings?.analyticsMeasurementId);
    })
    .catch(() => undefined);
  setupAuth();
  setupNavigation();
  setupMobileMenu();
  setupQuickActions();
  setupAIWriter();
  setupIconPicker();
});

/* ================================================================
   AUTH
   ================================================================ */
function setupAuth() {
  const overlay = $("#admin-login-overlay");
  const shell = $("#admin-shell");
  const form = $("#admin-login-form");
  const errBox = $("#admin-login-error");
  const closeBtn = $("#admin-login-close");

  const setAuthVisibility = (isSignedIn) => {
    overlay.hidden = Boolean(isSignedIn);
    shell.hidden = !isSignedIn;
    overlay.setAttribute("aria-hidden", isSignedIn ? "true" : "false");
  };

  if (!isSupabaseReady()) {
    errBox.textContent = "Admin sign-in is unavailable until Supabase is configured.";
    errBox.hidden = false;
    const submitBtn = $("#admin-login-submit");
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errBox.hidden = true;
    const submitBtn = $("#admin-login-submit");
    const origLabel = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in…';
    submitBtn.disabled = true;
    const email = $("#admin-email").value.trim();
    const pw = $("#admin-password").value;
    try {
      const authData = await signInAdmin(email, pw);
      if (authData?.user || authData?.session?.user) {
        setAuthVisibility(true);
      }
    } catch (err) {
      errBox.textContent = err.message || "Sign-in failed.";
      errBox.hidden = false;
    } finally {
      submitBtn.innerHTML = origLabel;
      submitBtn.disabled = false;
    }
  });

  // Password visibility toggle
  const pwToggle = $("#admin-pw-toggle");
  if (pwToggle) {
    pwToggle.addEventListener("click", () => {
      const pwInput = $("#admin-password");
      const icon = pwToggle.querySelector("i");
      if (pwInput.type === "password") {
        pwInput.type = "text";
        icon.className = "fa-solid fa-eye-slash";
      } else {
        pwInput.type = "password";
        icon.className = "fa-solid fa-eye";
      }
    });
  }

  closeBtn.addEventListener("click", () => {
    window.location.href = "/";
  });

  onAdminAuthChanged((user) => {
    const prevEmail = currentUser?.email || "";
    currentUser = user;
    if (user) {
      setAuthVisibility(true);
      showRuntimeBanner();
      if (!hasLoadedDashboard || prevEmail !== (user.email || "")) {
        hasLoadedDashboard = true;
        loadAll();
      }
    } else {
      hasLoadedDashboard = false;
      setAuthVisibility(false);
    }
  });

  $("#admin-logout-btn").addEventListener("click", async () => {
    await signOutAdmin();
    window.location.reload();
  });
}

function showRuntimeBanner() {
  const banner = $("#admin-runtime-banner");
  const mode = getContentRuntimeMode();
  if (mode === "supabase") {
    banner.innerHTML = `<i class="fa-solid fa-cloud"></i> Connected to Supabase — changes sync remotely.`;
  } else {
    banner.innerHTML = `<i class="fa-solid fa-hard-drive"></i> Running in local-only mode — data is saved in your browser.`;
  }
}

/* ================================================================
   DATA LOADING
   ================================================================ */
async function loadAll() {
  try {
    [siteContent, projects, testimonials, messages, auditLog, contentVersions] = await Promise.all([
      loadSiteContent(),
      loadProjects(),
      loadTestimonials(),
      loadMessages(),
      loadAuditLog(60),
      loadContentVersions({ limit: 80 })
    ]);
  } catch (e) {
    console.error("loadAll error:", e);
  }
  renderOverview();
  renderMessages();
  populateHeroForm();
  populateProfileForm();
  renderProjectsTable();
  renderFilterCategories();
  populateSkillsForm();
  renderExpTable();
  renderEduTable();
  renderCertTable();
  renderTestimonialsTable();
  populatePagesForm();
  renderMediaPanel();
  populateSettingsForm();
  setupHistoryPanel();
  await setupAdminUsers();
  setupImportExport();
  applySeo({
    siteUrl: siteContent?.settings?.siteUrl,
    title: document.title,
    description: getCurrentAdminDescription(),
    robots: "noindex,nofollow,noarchive"
  });
  injectAnalytics(siteContent?.settings?.analyticsMeasurementId);
}

/* ================================================================
   NAVIGATION
   ================================================================ */
function setupNavigation() {
  const navBtns = $$(".admin-nav-btn");
  const sections = $$(".admin-section");
  const topTitle = $("#topbar-title");

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.section;
      navBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      sections.forEach((s) => {
        s.hidden = s.dataset.panel !== target;
      });
      if (topTitle) topTitle.textContent = btn.querySelector("span")?.textContent || "Dashboard";
      if (target === "history") {
        refreshHistoryPanel().catch((error) => console.warn("History refresh failed:", error));
      }
      closeMobileMenu();
    });
  });
}

function setupQuickActions() {
  $$("[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.jump;
      const navBtn = $(`.admin-nav-btn[data-section="${target}"]`);
      if (navBtn) navBtn.click();
    });
  });
}

function openAdminSection(sectionId) {
  const navBtn = $(`.admin-nav-btn[data-section="${sectionId}"]`);
  if (navBtn) {
    navBtn.click();
  }
}

/* ================================================================
   MOBILE MENU
   ================================================================ */
function setupMobileMenu() {
  const toggle = $("#admin-menu-toggle");
  const sidebar = $("#admin-sidebar");
  const backdrop = $("#admin-sidebar-backdrop");

  toggle?.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    backdrop.classList.toggle("visible", open);
    toggle.classList.toggle("is-open", open);
  });

  backdrop?.addEventListener("click", closeMobileMenu);
}

function closeMobileMenu() {
  const sidebar = $("#admin-sidebar");
  const backdrop = $("#admin-sidebar-backdrop");
  const toggle = $("#admin-menu-toggle");
  sidebar?.classList.remove("open");
  backdrop?.classList.remove("visible");
  toggle?.classList.remove("is-open");
}

/* ================================================================
   OVERVIEW
   ================================================================ */
function renderOverview() {
  const p = siteContent?.profile || {};
  setKPI("kpi-projects", projects.length);
  setKPI("kpi-featured", projects.filter((x) => x.featured).length);
  setKPI("kpi-unread", messages.filter((m) => m.status === "new").length);
  setKPI("kpi-testimonials", testimonials.length);
  setKPI("kpi-email", p.email || "—");
  setKPI("kpi-availability", p.availableForFreelance ? "Available" : "Not available");

  // Badge
  const unread = messages.filter((m) => m.status === "new").length;
  const badge = $("#nav-badge-messages");
  if (badge) badge.textContent = unread > 0 ? unread : "";
}

function setKPI(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ================================================================
   MESSAGES
   ================================================================ */
function renderMessages() {
  const tbody = $("#msg-tbody");
  if (!tbody) return;
  tbody.innerHTML = messages
    .map((m) => {
      const cls = m.status === "new" ? "row-unread" : "";
      const badge = m.status === "new" ? "badge-unread" : m.status === "archived" ? "badge-archived" : "badge-read";
      return `<tr class="${cls}" data-id="${escapeHtml(m.id)}">
        <td data-label="Name">${escapeHtml(m.name)}</td>
        <td data-label="Email">${escapeHtml(m.email)}</td>
        <td data-label="Subject">${escapeHtml(m.subject || "(no subject)")}</td>
        <td data-label="Date">${formatDate(m.createdAt)}</td>
        <td data-label="Status"><span class="badge-sm ${badge}">${escapeHtml(m.status)}</span></td>
        <td class="row-actions">
          <button title="View" class="msg-view"><i class="fa-solid fa-eye"></i></button>
          ${m.status === "new" ? `<button title="Mark read" class="msg-read"><i class="fa-solid fa-check"></i></button>` : ""}
          ${m.status !== "archived" ? `<button title="Archive" class="msg-archive"><i class="fa-solid fa-box-archive"></i></button>` : ""}
        </td></tr>`;
    })
    .join("");

  tbody.querySelectorAll("tr").forEach((row) => {
    const id = row.dataset.id;
    row.querySelector(".msg-view")?.addEventListener("click", () => showMessage(id));
    row.querySelector(".msg-read")?.addEventListener("click", async () => {
      await updateMessageStatus(id, "read");
      messages = await loadMessages();
      renderMessages();
      renderOverview();
    });
    row.querySelector(".msg-archive")?.addEventListener("click", async () => {
      await updateMessageStatus(id, "archived");
      messages = await loadMessages();
      renderMessages();
      renderOverview();
    });
  });
}

function showMessage(id) {
  const m = messages.find((x) => x.id === id);
  const detail = $("#msg-detail");
  if (!m || !detail) return;
  detail.innerHTML = `
    <h4>${escapeHtml(m.subject || "(no subject)")}</h4>
    <p><strong>${escapeHtml(m.name)}</strong> &lt;${escapeHtml(m.email)}&gt;<br><small>${formatDate(m.createdAt)}</small></p>
    <hr style="border-color:var(--border-color);margin:.75rem 0">
    <p style="white-space:pre-wrap">${escapeHtml(m.message)}</p>`;

  if (m.status === "new") {
    updateMessageStatus(id, "read").then(async () => {
      messages = await loadMessages();
      renderMessages();
      renderOverview();
    });
  }
}

/* ================================================================
   HERO SECTION
   ================================================================ */
function populateHeroForm() {
  const p = siteContent?.profile || {};
  setVal("hero-name", p.name);
  setVal("hero-titles", (p.animatedTitles || []).join(", "));
  setVal("hero-tagline", p.tagline);
  setVal("hero-years", p.yearsExperience);
  setVal("hero-clients", p.clientsServed);
  setVal("hero-speed", p.avgSpeedImprovement);
  setVal("hero-traffic", p.avgTrafficIncrease);
  setChecked("hero-available", p.availableForFreelance);
  setVal("hero-linkedin", p.linkedin);
  setVal("hero-github-url", p.github);
  setVal("hero-github-user", p.githubUsername);
  updateHeroPreview();

  $("#hero-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    siteContent.profile.name = getVal("hero-name");
    siteContent.profile.animatedTitles = getVal("hero-titles").split(",").map((s) => s.trim()).filter(Boolean);
    siteContent.profile.tagline = getVal("hero-tagline");
    siteContent.profile.yearsExperience = getVal("hero-years");
    siteContent.profile.clientsServed = getVal("hero-clients");
    siteContent.profile.avgSpeedImprovement = getVal("hero-speed");
    siteContent.profile.avgTrafficIncrease = getVal("hero-traffic");
    siteContent.profile.availableForFreelance = getChecked("hero-available");
    siteContent.profile.linkedin = getVal("hero-linkedin");
    siteContent.profile.github = getVal("hero-github-url");
    siteContent.profile.githubUsername = getVal("hero-github-user");
    await saveSiteContent(siteContent, {
      section: "hero",
      summary: "Updated hero section"
    });
    flash("hero-status", "Hero saved!");
    updateHeroPreview();
    renderOverview();
  });
}

function updateHeroPreview() {
  const box = $("#hero-preview");
  if (!box) return;
  const p = siteContent?.profile || {};
  box.innerHTML = `
    <strong>${escapeHtml(p.name)}</strong>
    <p>${escapeHtml(p.tagline || "")}</p>
    <p><small>Titles: ${escapeHtml((p.animatedTitles || []).join(" | "))}</small></p>
    <p><small>Stats: ${escapeHtml(p.yearsExperience)} yrs, ${escapeHtml(p.clientsServed)} clients</small></p>`;
}

/* ================================================================
   PROFILE / ABOUT
   ================================================================ */
function populateProfileForm() {
  const p = siteContent?.profile || {};
  // Merge legacy bio/bio2/bio3 into a single field (blank-line-separated paragraphs)
  const bioparts = [p.bio, p.bio2, p.bio3].filter(Boolean);
  setVal("profile-bio", bioparts.join("\n\n"));
  setVal("profile-location", p.location);
  setVal("profile-email", p.email);
  setVal("profile-phone1", p.phone1);
  setVal("profile-phone2", p.phone2);
  setImgPreview("profile-img-preview", p.profileImage);
  setImgPreview("profile-preview-img", p.profileImage);

  // File preview
  $("#profile-img-file")?.addEventListener("change", (e) => {
    previewFile(e.target, "profile-img-preview");
  });

  $("#profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = $("#profile-img-file")?.files[0];
    if (file) {
      try {
        const imageAsset = await uploadProfileImage(file, {
          section: "profile",
          summary: "Uploaded profile image from profile editor"
        });
        siteContent.profile.profileImage = imageAsset?.url || "";
        siteContent.profile.profileImageAsset = imageAsset;
      } catch (err) {
        flash("profile-status", "Image upload failed: " + err.message, true);
      }
    }
    siteContent.profile.bio = getVal("profile-bio");
    siteContent.profile.bio2 = "";
    siteContent.profile.bio3 = "";
    siteContent.profile.location = getVal("profile-location");
    siteContent.profile.email = getVal("profile-email");
    siteContent.profile.phone1 = getVal("profile-phone1");
    siteContent.profile.phone2 = getVal("profile-phone2");
    await saveSiteContent(siteContent, {
      section: "profile",
      summary: "Updated profile section"
    });
    flash("profile-status", "Profile saved!");
    setImgPreview("profile-preview-img", siteContent.profile.profileImage);
    renderOverview();
  });
}

/* ================================================================
   PROJECTS
   ================================================================ */
function renderProjectsTable() {
  const tbody = $("#proj-tbody");
  if (!tbody) return;
  tbody.innerHTML = projects
    .map((p) => {
      const typeBadge = p.featured ? `<span class="badge-sm badge-featured">Featured</span>` : `<span class="badge-sm badge-draft">Standard</span>`;
      const starIcon = p.featured ? "fa-solid fa-star" : "fa-regular fa-star";
      const starTitle = p.featured ? "Remove from featured" : "Mark as featured";
      return `<tr data-id="${escapeHtml(p.id)}">
        <td data-label="Project">${escapeHtml(p.title)}</td>
        <td data-label="Tags">${(p.tags || []).map((t) => escapeHtml(t)).join(", ")}</td>
        <td data-label="Type">${typeBadge}</td>
        <td class="row-actions">
          <button title="${starTitle}" class="proj-star${p.featured ? " active" : ""}"><i class="${starIcon}"></i></button>
          <button title="Edit" class="proj-edit"><i class="fa-solid fa-pen"></i></button>
          <button title="Delete" class="proj-del danger"><i class="fa-solid fa-trash"></i></button>
        </td></tr>`;
    })
    .join("");

  tbody.querySelectorAll("tr").forEach((row) => {
    const id = row.dataset.id;
    row.querySelector(".proj-star")?.addEventListener("click", async () => {
      const proj = projects.find((x) => x.id === id);
      if (!proj) return;
      proj.featured = !proj.featured;
      await saveProject(proj);
      projects = await loadProjects();
      renderProjectsTable();
      renderOverview();
    });
    row.querySelector(".proj-edit")?.addEventListener("click", () => editProject(id));
    row.querySelector(".proj-del")?.addEventListener("click", async () => {
      if (!confirm("Delete this project?")) return;
      await deleteProject(id);
      projects = await loadProjects();
      renderProjectsTable();
      renderOverview();
    });
  });
}

function setupProjectForm() {
  // Featured image preview
  $("#proj-feat-file")?.addEventListener("change", (e) => {
    previewFile(e.target, "proj-feat-preview");
  });

  // Gallery preview (multiple files)
  $("#proj-gallery-files")?.addEventListener("change", (e) => {
    const wrap = $("#proj-gallery-preview");
    if (!wrap) return;
    wrap.innerHTML = "";
    Array.from(e.target.files).forEach((file) => {
      const img = document.createElement("img");
      img.style.cssText = "width:72px;height:54px;object-fit:cover;border-radius:6px;border:1px solid var(--border)";
      img.src = URL.createObjectURL(file);
      wrap.appendChild(img);
    });
  });

  $("#proj-reset")?.addEventListener("click", resetProjectForm);

  const form = $("#proj-form");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const editingId = getVal("proj-id");
    const id = editingId || `project-${Date.now()}`;
    const existing = projects.find((p) => p.id === editingId) || {};

    // Featured image
    const featFile = $("#proj-feat-file")?.files[0];
    let featuredImage = existing.featuredImage || existing.image || "";
    let featuredImageAsset = existing.featuredImageAsset || existing.imageAsset || null;
    if (featFile) {
      try {
        featuredImageAsset = await uploadProjectImage(id, featFile, {
          summary: `Uploaded featured image for ${getVal("proj-title") || id}`
        });
        featuredImage = featuredImageAsset?.url || "";
      } catch (err) {
        flash("proj-status", "Featured image upload failed: " + err.message, true);
        return;
      }
    }

    // Gallery images
    const galleryFiles = Array.from($("#proj-gallery-files")?.files || []);
    let galleryAssets = Array.isArray(existing.galleryAssets) ? [...existing.galleryAssets] : [];
    if (galleryFiles.length) {
      try {
        const uploads = await Promise.all(
          galleryFiles.map((f) => uploadProjectImage(id, f, { summary: `Uploaded gallery image for ${getVal("proj-title") || id}` }))
        );
        galleryAssets = [...galleryAssets, ...uploads];
      } catch (err) {
        flash("proj-status", "Gallery upload failed: " + err.message, true);
        return;
      }
    }

    const proj = {
      ...existing,
      id,
      title: getVal("proj-title"),
      shortDesc: getVal("proj-short"),
      longDesc: getVal("proj-long"),
      tags: getVal("proj-tags").split(",").map((s) => s.trim()).filter(Boolean),
      url: getVal("proj-url"),
      github: getVal("proj-github"),
      featuredImage,
      featuredImageAsset,
      image: featuredImage,   // keep legacy field in sync
      gallery: galleryAssets.map((asset) => asset?.url).filter(Boolean),
      galleryAssets,
      featured: getChecked("proj-featured")
    };

    await saveProject(proj);
    projects = await loadProjects();
    renderProjectsTable();
    resetProjectForm();
    flash("proj-status", editingId ? "Project updated!" : "Project created!");
    renderOverview();
  });
}

function editProject(id) {
  const p = projects.find((x) => x.id === id);
  if (!p) return;
  setVal("proj-id", p.id);
  setVal("proj-title", p.title);
  setVal("proj-short", p.shortDesc);
  setVal("proj-long", p.longDesc);
  setVal("proj-tags", (p.tags || []).join(", "));
  setVal("proj-url", p.url);
  setVal("proj-github", p.github);
  setChecked("proj-featured", p.featured);
  // Featured image
  const featSrc = p.featuredImage || p.image || "";
  setImgPreview("proj-feat-preview", featSrc || "assets/images/project-placeholder.svg");
  // Gallery thumbnails
  const galleryWrap = $("#proj-gallery-preview");
  if (galleryWrap) {
    galleryWrap.innerHTML = (p.gallery || []).map((url) =>
      `<div style="position:relative;display:inline-block">
        <img src="${escapeHtml(url)}" style="width:72px;height:54px;object-fit:cover;border-radius:6px;border:1px solid var(--border)">
        <button type="button" data-url="${escapeHtml(url)}" class="proj-gal-remove" style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:#ef4444;color:#fff;border:none;font-size:.65rem;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1">&times;</button>
      </div>`
    ).join("");
    galleryWrap.querySelectorAll(".proj-gal-remove").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const urlToRemove = btn.dataset.url;
        const proj = projects.find((x) => x.id === getVal("proj-id"));
        if (!proj) return;
        proj.gallery = (proj.gallery || []).filter((u) => u !== urlToRemove);
        await saveProject(proj);
        projects = await loadProjects();
        editProject(id); // refresh form
      });
    });
  }
  $("#proj-form-title").textContent = "Edit Project";
  // Scroll form into view
  $("#proj-form")?.closest(".admin-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetProjectForm() {
  $("#proj-form")?.reset();
  setVal("proj-id", "");
  setImgPreview("proj-feat-preview", "assets/images/project-placeholder.svg");
  const galleryWrap = $("#proj-gallery-preview");
  if (galleryWrap) galleryWrap.innerHTML = "";
  $("#proj-form-title").textContent = "New Project";
}

function renderFilterCategories() {
  const list = $("#proj-cat-list");
  if (!list) return;

  const cats = Array.isArray(siteContent?.projectCategories) ? siteContent.projectCategories : [];

  list.innerHTML = cats.length
    ? cats.map((cat, i) => `
        <span class="tag-chip">
          ${escapeHtml(cat)}
          <button type="button" class="tag-chip-remove" data-index="${i}" title="Remove">&times;</button>
        </span>`).join("")
    : `<p class="muted-copy" style="margin:0;font-size:.85rem">No categories yet. Add one below.</p>`;

  list.querySelectorAll(".tag-chip-remove").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = Number(btn.dataset.index);
      if (!siteContent.projectCategories) siteContent.projectCategories = [];
      siteContent.projectCategories.splice(idx, 1);
      await saveSiteContent(siteContent, {
        section: "project-categories",
        summary: "Updated project categories"
      });
      renderFilterCategories();
      flash("proj-cat-status", "Category removed.");
    });
  });

  const addBtn = $("#proj-cat-add-btn");
  const input  = $("#proj-cat-input");

  // Remove any old listener by cloning
  if (addBtn) {
    const fresh = addBtn.cloneNode(true);
    addBtn.replaceWith(fresh);
    fresh.addEventListener("click", async () => {
      const val = input?.value.trim();
      if (!val) return;
      if (!siteContent.projectCategories) siteContent.projectCategories = [];
      if (siteContent.projectCategories.map((c) => c.toLowerCase()).includes(val.toLowerCase())) {
        flash("proj-cat-status", "That category already exists.", true);
        return;
      }
      siteContent.projectCategories.push(val);
      await saveSiteContent(siteContent, {
        section: "project-categories",
        summary: "Updated project categories"
      });
      if (input) input.value = "";
      renderFilterCategories();
      flash("proj-cat-status", "Category added!");
    });
  }
}

/* ================================================================
   SKILLS & TECH
   ================================================================ */
function populateSkillsForm() {
  renderTechSelector();
  renderTechSkillsManager();
  renderSoftSkillsManager();

  // Tech stack search filter
  $("#tech-search")?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    $$(".tech-chip").forEach((chip) => {
      const text = (chip.dataset.name + " " + chip.dataset.cat).toLowerCase();
      chip.style.display = text.includes(q) ? "" : "none";
    });
  });

  $("#skills-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    siteContent.techStacks = $$(".tech-chip.selected").map((c) => c.dataset.id);
    await saveSiteContent(siteContent, {
      section: "skills",
      summary: "Updated tech stack"
    });
    flash("skills-status", "Tech Stack saved!");
  });
}

function renderTechSelector() {
  const wrap = $("#tech-selector");
  if (!wrap) return;
  const selected = siteContent?.techStacks || [];
  wrap.innerHTML = techStacks
    .map((t) => {
      const sel = selected.includes(t.id) ? "selected" : "";
      return `<div class="tech-chip ${sel}" data-id="${escapeHtml(t.id)}" data-name="${escapeHtml(t.name)}" data-cat="${escapeHtml(t.category)}">
        <i class="${escapeHtml(t.fallbackIcon)}"></i>
        <span class="chip-name">${escapeHtml(t.name)}</span>
        <span class="chip-cat">${escapeHtml(t.category)}</span>
      </div>`;
    })
    .join("");

  wrap.querySelectorAll(".tech-chip").forEach((chip) => {
    chip.addEventListener("click", () => chip.classList.toggle("selected"));
  });
}

function renderTechSkillsManager() {
  const tbody = $("#tech-skill-tbody");
  if (!tbody) return;
  const techSkills = siteContent?.skills?.technical || [];

  tbody.innerHTML = techSkills.length
    ? techSkills.map((s, i) => `
        <tr data-idx="${i}">
          <td data-label="Category">${escapeHtml(s.category)}</td>
          <td data-label="Icon"><i class="${escapeHtml(s.icon)}"></i></td>
          <td data-label="Items" style="max-width:280px;white-space:normal">${(s.items || []).map((x) => escapeHtml(x)).join(", ")}</td>
          <td class="row-actions">
            <button title="Edit" class="tech-skill-edit"><i class="fa-solid fa-pen"></i></button>
            <button title="Delete" class="tech-skill-del danger"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`).join("")
    : `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:1.5rem">No skill groups yet. Add one below.</td></tr>`;

  tbody.querySelectorAll("tr[data-idx]").forEach((row) => {
    const idx = +row.dataset.idx;
    row.querySelector(".tech-skill-edit")?.addEventListener("click", () => {
      const s = techSkills[idx];
      setVal("tech-skill-idx", idx);
      setVal("tech-skill-cat", s.category);
      setVal("tech-skill-icon", s.icon || "fa-solid fa-wrench");
      setVal("tech-skill-items", (s.items || []).join(", "));
      const prev = $("#tech-skill-icon-preview");
      if (prev) prev.className = s.icon || "fa-solid fa-wrench";
      $("#tech-skill-form-title").textContent = "Edit Skill Group";
      $("#tech-skill-cat")?.focus();
    });
    row.querySelector(".tech-skill-del")?.addEventListener("click", async () => {
      if (!confirm(`Delete "${techSkills[idx].category}"?`)) return;
      siteContent.skills.technical.splice(idx, 1);
      await saveSiteContent(siteContent, {
        section: "skills",
        summary: "Updated technical skills"
      });
      renderTechSkillsManager();
      flash("tech-skill-status", "Group deleted.");
    });
  });

  const form = $("#tech-skill-form");
  if (!form) return;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const idx = +getVal("tech-skill-idx");
    const entry = {
      id: idx >= 0 ? (siteContent.skills.technical[idx]?.id || `tech-${Date.now()}`) : `tech-${Date.now()}`,
      category: getVal("tech-skill-cat"),
      icon: getVal("tech-skill-icon") || "fa-solid fa-wrench",
      items: getVal("tech-skill-items").split(",").map((s) => s.trim()).filter(Boolean)
    };
    if (!siteContent.skills) siteContent.skills = {};
    if (!siteContent.skills.technical) siteContent.skills.technical = [];
    if (idx >= 0) {
      siteContent.skills.technical[idx] = entry;
    } else {
      siteContent.skills.technical.push(entry);
    }
    await saveSiteContent(siteContent, {
      section: "skills",
      summary: "Updated technical skills"
    });
    resetTechSkillForm();
    renderTechSkillsManager();
    flash("tech-skill-status", "Skill group saved!");
  };

  $("#tech-skill-reset")?.addEventListener("click", resetTechSkillForm);
}

function resetTechSkillForm() {
  setVal("tech-skill-idx", "-1");
  setVal("tech-skill-cat", "");
  setVal("tech-skill-icon", "fa-solid fa-wrench");
  setVal("tech-skill-items", "");
  const prev = $("#tech-skill-icon-preview");
  if (prev) prev.className = "fa-solid fa-wrench";
  $("#tech-skill-form-title").textContent = "Add Skill Group";
}

function renderSoftSkillsManager() {
  const tbody = $("#soft-skill-tbody");
  if (!tbody) return;

  const skills = siteContent?.skills?.soft || [];

  tbody.innerHTML = skills.length
    ? skills.map((s, i) => `
        <tr data-idx="${i}">
          <td data-label="Title">${escapeHtml(s.title)}</td>
          <td data-label="Icon"><i class="${escapeHtml(s.icon)}"></i></td>
          <td data-label="Description" style="max-width:320px;white-space:normal">${escapeHtml(s.desc)}</td>
          <td class="row-actions">
            <button title="Edit" class="soft-skill-edit"><i class="fa-solid fa-pen"></i></button>
            <button title="Delete" class="soft-skill-del danger"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`).join("")
    : `<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No soft skills yet. Add one below.</td></tr>`;

  tbody.querySelectorAll("tr[data-idx]").forEach((row) => {
    const idx = +row.dataset.idx;
    row.querySelector(".soft-skill-edit")?.addEventListener("click", () => {
      const s = skills[idx];
      setVal("soft-skill-idx", idx);
      setVal("soft-skill-title", s.title);
      setVal("soft-skill-icon", s.icon || "fa-solid fa-star");
      setVal("soft-skill-desc", s.desc);
      const ssprev = $("#soft-skill-icon-preview");
      if (ssprev) ssprev.className = s.icon || "fa-solid fa-star";
      $("#soft-skill-form-title").textContent = "Edit Soft Skill";
      $("#soft-skill-title")?.focus();
    });
    row.querySelector(".soft-skill-del")?.addEventListener("click", async () => {
      if (!confirm(`Delete "${skills[idx].title}"?`)) return;
      siteContent.skills.soft.splice(idx, 1);
      await saveSiteContent(siteContent, {
        section: "skills",
        summary: "Updated soft skills"
      });
      renderSoftSkillsManager();
      flash("soft-skill-status", "Skill deleted.");
    });
  });

  // Form submit
  const form = $("#soft-skill-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const idx = +getVal("soft-skill-idx");
    const entry = {
      id: idx >= 0 ? (siteContent.skills.soft[idx]?.id || `soft-${Date.now()}`) : `soft-${Date.now()}`,
      title: getVal("soft-skill-title"),
      icon: getVal("soft-skill-icon") || "fa-solid fa-star",
      desc: getVal("soft-skill-desc")
    };
    if (!siteContent.skills.soft) siteContent.skills.soft = [];
    if (idx >= 0) {
      siteContent.skills.soft[idx] = entry;
    } else {
      siteContent.skills.soft.push(entry);
    }
    await saveSiteContent(siteContent, {
      section: "skills",
      summary: "Updated soft skills"
    });
    resetSoftSkillForm();
    renderSoftSkillsManager();
    flash("soft-skill-status", "Skill saved!");
  };

  // Reset button
  $("#soft-skill-reset")?.addEventListener("click", resetSoftSkillForm);
}

function resetSoftSkillForm() {
  setVal("soft-skill-idx", "-1");
  setVal("soft-skill-title", "");
  setVal("soft-skill-icon", "fa-solid fa-star");
  setVal("soft-skill-desc", "");
  const ssprev = $("#soft-skill-icon-preview");
  if (ssprev) ssprev.className = "fa-solid fa-star";
  $("#soft-skill-form-title").textContent = "Add Soft Skill";
}

function parseSoftSkills(text) {
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map((line, i) => {
      const [title, icon, desc] = line.split("|").map((s) => s.trim());
      return {
        id: `soft-${i + 1}`,
        title: title || "Skill",
        icon: icon || "fa-solid fa-star",
        desc: desc || ""
      };
    });
}

/* ================================================================
   EXPERIENCE
   ================================================================ */
function renderExpTable() {
  const tbody = $("#exp-tbody");
  if (!tbody) return;
  const exps = siteContent?.experience || [];
  tbody.innerHTML = exps
    .map((x, i) => `<tr data-idx="${i}">
      <td data-label="Role">${escapeHtml(x.role)}</td>
      <td data-label="Company">${escapeHtml(x.company)}</td>
      <td data-label="Period">${escapeHtml(x.date)}</td>
      <td class="row-actions">
        <button title="Edit" class="exp-edit"><i class="fa-solid fa-pen"></i></button>
        <button title="Delete" class="exp-del danger"><i class="fa-solid fa-trash"></i></button>
      </td></tr>`)
    .join("");

  tbody.querySelectorAll("tr").forEach((row) => {
    const idx = +row.dataset.idx;
    row.querySelector(".exp-edit")?.addEventListener("click", () => editExp(idx));
    row.querySelector(".exp-del")?.addEventListener("click", async () => {
      if (!confirm("Delete this entry?")) return;
      siteContent.experience.splice(idx, 1);
      await saveSiteContent(siteContent, {
        section: "experience",
        summary: "Updated experience section"
      });
      renderExpTable();
    });
  });

  // form
  const form = $("#exp-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const idx = +getVal("exp-idx");
    const entry = {
      id: `exp-${Date.now()}`,
      role: getVal("exp-role"),
      company: getVal("exp-company"),
      date: getVal("exp-date"),
      type: getVal("exp-type"),
      badge: getVal("exp-badge"),
      badgeClass: getVal("exp-badge-cls"),
      summary: getVal("exp-summary"),
      bullets: getVal("exp-bullets").split("\n").map((s) => s.trim()).filter(Boolean)
    };
    if (idx >= 0 && idx < siteContent.experience.length) {
      entry.id = siteContent.experience[idx].id;
      siteContent.experience[idx] = entry;
    } else {
      siteContent.experience.push(entry);
    }
    await saveSiteContent(siteContent, {
      section: "experience",
      summary: "Updated experience section"
    });
    renderExpTable();
    resetExpForm();
    flash("exp-status", "Experience saved!");
  };

  $("#exp-reset")?.addEventListener("click", resetExpForm);
  $("#exp-add")?.addEventListener("click", resetExpForm);
}

function editExp(idx) {
  const x = siteContent.experience[idx];
  if (!x) return;
  setVal("exp-idx", idx);
  setVal("exp-role", x.role);
  setVal("exp-company", x.company);
  setVal("exp-date", x.date);
  setVal("exp-type", x.type);
  setVal("exp-badge", x.badge);
  setVal("exp-badge-cls", x.badgeClass);
  setVal("exp-summary", x.summary);
  setVal("exp-bullets", (x.bullets || []).join("\n"));
  $("#exp-form-title").textContent = "Edit Entry";
}

function resetExpForm() {
  $("#exp-form")?.reset();
  setVal("exp-idx", "-1");
  $("#exp-form-title").textContent = "New Entry";
}

/* ================================================================
   EDUCATION
   ================================================================ */
function renderEduTable() {
  const tbody = $("#edu-tbody");
  if (!tbody) return;
  const edus = siteContent?.education || [];
  tbody.innerHTML = edus
    .map((x, i) => `<tr data-idx="${i}">
      <td data-label="Degree">${escapeHtml(x.degree)}</td>
      <td data-label="School">${escapeHtml(x.school)}</td>
      <td data-label="Period">${escapeHtml(x.period)}</td>
      <td data-label="Icon"><i class="${escapeHtml(x.icon || 'fa-solid fa-graduation-cap')}"></i></td>
      <td class="row-actions">
        <button title="Edit" class="edu-edit"><i class="fa-solid fa-pen"></i></button>
        <button title="Delete" class="edu-del danger"><i class="fa-solid fa-trash"></i></button>
      </td></tr>`)
    .join("");

  tbody.querySelectorAll("tr").forEach((row) => {
    const idx = +row.dataset.idx;
    row.querySelector(".edu-edit")?.addEventListener("click", () => editEdu(idx));
    row.querySelector(".edu-del")?.addEventListener("click", async () => {
      if (!confirm("Delete this entry?")) return;
      siteContent.education.splice(idx, 1);
      await saveSiteContent(siteContent, {
        section: "education",
        summary: "Updated education section"
      });
      renderEduTable();
    });
  });

  const form = $("#edu-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const idx = +getVal("edu-idx");
    const entry = {
      degree: getVal("edu-degree"),
      school: getVal("edu-school"),
      period: getVal("edu-period"),
      icon: getVal("edu-icon") || "fa-solid fa-graduation-cap"
    };
    if (idx >= 0 && idx < siteContent.education.length) {
      siteContent.education[idx] = entry;
    } else {
      siteContent.education.push(entry);
    }
    await saveSiteContent(siteContent, {
      section: "education",
      summary: "Updated education section"
    });
    renderEduTable();
    resetEduForm();
    flash("edu-status", "Education saved!");
  };

  $("#edu-reset")?.addEventListener("click", resetEduForm);
  $("#edu-add")?.addEventListener("click", resetEduForm);
}

function editEdu(idx) {
  const x = siteContent.education[idx];
  if (!x) return;
  setVal("edu-idx", idx);
  setVal("edu-degree", x.degree);
  setVal("edu-school", x.school);
  setVal("edu-period", x.period);
  setVal("edu-icon", x.icon || "fa-solid fa-graduation-cap");
  const eduPrev = $("#edu-icon-preview");
  if (eduPrev) eduPrev.className = x.icon || "fa-solid fa-graduation-cap";
  $("#edu-form-title").textContent = "Edit Entry";
}

function resetEduForm() {
  $("#edu-form")?.reset();
  setVal("edu-idx", "-1");
  setVal("edu-icon", "fa-solid fa-graduation-cap");
  const eduPrev = $("#edu-icon-preview");
  if (eduPrev) eduPrev.className = "fa-solid fa-graduation-cap";
  $("#edu-form-title").textContent = "New Entry";
}

/* ================================================================
   CERTIFICATIONS
   ================================================================ */
function renderCertTable() {
  const tbody = $("#cert-tbody");
  if (!tbody) return;
  const certs = siteContent?.certifications || [];
  tbody.innerHTML = certs
    .map((x, i) => `<tr data-idx="${i}">
      <td data-label="Title">${escapeHtml(x.title)}</td>
      <td data-label="Issuer">${escapeHtml(x.issuer)}</td>
      <td data-label="Date">${escapeHtml(x.date)}</td>
      <td data-label="Icon"><i class="${escapeHtml(x.icon || 'fa-solid fa-certificate')}"></i></td>
      <td class="row-actions">
        <button title="Edit" class="cert-edit"><i class="fa-solid fa-pen"></i></button>
        <button title="Delete" class="cert-del danger"><i class="fa-solid fa-trash"></i></button>
      </td></tr>`)
    .join("");

  tbody.querySelectorAll("tr").forEach((row) => {
    const idx = +row.dataset.idx;
    row.querySelector(".cert-edit")?.addEventListener("click", () => editCert(idx));
    row.querySelector(".cert-del")?.addEventListener("click", async () => {
      if (!confirm("Delete this certification?")) return;
      siteContent.certifications.splice(idx, 1);
      await saveSiteContent(siteContent, {
        section: "certifications",
        summary: "Updated certifications section"
      });
      renderCertTable();
    });
  });

  const form = $("#cert-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const idx = +getVal("cert-idx");
    const entry = {
      title: getVal("cert-title"),
      issuer: getVal("cert-issuer"),
      date: getVal("cert-date"),
      icon: getVal("cert-icon") || "fa-solid fa-certificate",
      url: getVal("cert-url")
    };
    if (!siteContent.certifications) siteContent.certifications = [];
    if (idx >= 0 && idx < siteContent.certifications.length) {
      siteContent.certifications[idx] = entry;
    } else {
      siteContent.certifications.push(entry);
    }
    await saveSiteContent(siteContent, {
      section: "certifications",
      summary: "Updated certifications section"
    });
    renderCertTable();
    resetCertForm();
    flash("cert-status", "Certification saved!");
  };

  $("#cert-reset")?.addEventListener("click", resetCertForm);
  $("#cert-add")?.addEventListener("click", resetCertForm);
}

function editCert(idx) {
  const x = (siteContent.certifications || [])[idx];
  if (!x) return;
  setVal("cert-idx", idx);
  setVal("cert-title", x.title);
  setVal("cert-issuer", x.issuer);
  setVal("cert-date", x.date);
  setVal("cert-icon", x.icon || "fa-solid fa-certificate");
  const certPrev = $("#cert-icon-preview");
  if (certPrev) certPrev.className = x.icon || "fa-solid fa-certificate";
  setVal("cert-url", x.url || "");
  $("#cert-form-title").textContent = "Edit Certification";
}

function resetCertForm() {
  $("#cert-form")?.reset();
  setVal("cert-idx", "-1");
  setVal("cert-icon", "fa-solid fa-certificate");
  const certPrev = $("#cert-icon-preview");
  if (certPrev) certPrev.className = "fa-solid fa-certificate";
  $("#cert-form-title").textContent = "New Certification";
}

/* ================================================================
   TESTIMONIALS
   ================================================================ */
function renderTestimonialsTable() {
  const tbody = $("#test-tbody");
  if (!tbody) return;
  tbody.innerHTML = testimonials
    .map((t) => {
      const badge = t.published ? `<span class="badge-sm badge-published">Published</span>` : `<span class="badge-sm badge-draft">Draft</span>`;
      return `<tr data-id="${escapeHtml(t.id)}">
        <td data-label="Client">${escapeHtml(t.name)}</td>
        <td data-label="Role">${escapeHtml(t.role)}</td>
        <td data-label="Status">${badge}</td>
        <td class="row-actions">
          <button title="Edit" class="test-edit"><i class="fa-solid fa-pen"></i></button>
          <button title="Delete" class="test-del danger"><i class="fa-solid fa-trash"></i></button>
        </td></tr>`;
    })
    .join("");

  tbody.querySelectorAll("tr").forEach((row) => {
    const id = row.dataset.id;
    row.querySelector(".test-edit")?.addEventListener("click", () => editTestimonial(id));
    row.querySelector(".test-del")?.addEventListener("click", async () => {
      if (!confirm("Delete this testimonial?")) return;
      await deleteTestimonial(id);
      testimonials = await loadTestimonials();
      renderTestimonialsTable();
      renderOverview();
    });
  });

  // Image preview
  $("#test-img-file")?.addEventListener("change", (e) => {
    previewFile(e.target, "test-img-preview");
  });

  const form = $("#test-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const existingId = getVal("test-id");
    const id = existingId || `testimonial-${Date.now()}`;
    const file = $("#test-img-file")?.files[0];
    let image = testimonials.find((t) => t.id === existingId)?.image || "";
    let imageAsset = testimonials.find((t) => t.id === existingId)?.imageAsset || null;
    if (file) {
      try {
        imageAsset = await uploadTestimonialImage(id, file, {
          summary: `Uploaded testimonial image for ${getVal("test-name") || id}`
        });
        image = imageAsset?.url || "";
      } catch (err) {
        flash("test-status", "Image upload failed: " + err.message, true);
      }
    }
    const item = {
      id,
      name: getVal("test-name"),
      role: getVal("test-role"),
      content: getVal("test-content"),
      image,
      imageAsset,
      published: getChecked("test-published")
    };
    await saveTestimonial(item);
    testimonials = await loadTestimonials();
    renderTestimonialsTable();
    resetTestimonialForm();
    flash("test-status", "Testimonial saved!");
    renderOverview();
  };

  $("#test-reset")?.addEventListener("click", resetTestimonialForm);
}

function editTestimonial(id) {
  const t = testimonials.find((x) => x.id === id);
  if (!t) return;
  setVal("test-id", t.id);
  setVal("test-name", t.name);
  setVal("test-role", t.role);
  setVal("test-content", t.content);
  setChecked("test-published", t.published);
  setImgPreview("test-img-preview", t.image);
}

function resetTestimonialForm() {
  $("#test-form")?.reset();
  setVal("test-id", "");
  setImgPreview("test-img-preview", "assets/images/profile-placeholder.svg");
  setChecked("test-published", true);
}

/* ================================================================
   PAGE TEXT
   ================================================================ */
function populatePagesForm() {
  const s = siteContent?.settings || {};
  const p = siteContent?.profile || {};

  // Use pageText sub-object for page-level fields (create if missing)
  if (!siteContent.pageText) siteContent.pageText = {};
  const pt = siteContent.pageText;

  setVal("pg-hero-prefix", pt.heroPrefix || "Hi, I'm");
  setVal("pg-cta-title", pt.ctaTitle || "Ready to bring your idea to life?");
  setVal("pg-cta-body", pt.ctaBody || "");
  setVal("pg-about-title", pt.aboutTitle || "About Me");
  setVal("pg-about-sub", pt.aboutSub || "");
  setVal("pg-projects-title", pt.projectsTitle || "Featured Work");
  setVal("pg-projects-sub", pt.projectsSub || "");
  setVal("pg-feedback-title", pt.feedbackTitle || "Client Feedback");
  setVal("pg-feedback-sub", pt.feedbackSub || "");
  setVal("pg-footer", pt.footerCopy || "");

  $("#pages-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    siteContent.pageText = {
      heroPrefix: getVal("pg-hero-prefix"),
      ctaTitle: getVal("pg-cta-title"),
      ctaBody: getVal("pg-cta-body"),
      aboutTitle: getVal("pg-about-title"),
      aboutSub: getVal("pg-about-sub"),
      projectsTitle: getVal("pg-projects-title"),
      projectsSub: getVal("pg-projects-sub"),
      feedbackTitle: getVal("pg-feedback-title"),
      feedbackSub: getVal("pg-feedback-sub"),
      footerCopy: getVal("pg-footer")
    };
    await saveSiteContent(siteContent, {
      section: "pages",
      summary: "Updated page text"
    });
    flash("pages-status", "Page text saved!");
  });
}

/* ================================================================
   MEDIA
   ================================================================ */
function renderMediaPanel() {
  const p = siteContent?.profile || {};
  setImgPreview("media-profile-img", p.profileImage);

  $("#media-profile-file")?.addEventListener("change", (e) => {
    previewFile(e.target, "media-profile-img");
  });

  $("#media-profile-save")?.addEventListener("click", async () => {
    const file = $("#media-profile-file")?.files[0];
    if (!file) return flash("media-status", "No file selected.", true);
    try {
      const imageAsset = await uploadProfileImage(file, {
        section: "profile",
        summary: "Uploaded profile image from media panel"
      });
      siteContent.profile.profileImage = imageAsset?.url || "";
      siteContent.profile.profileImageAsset = imageAsset;
      await saveSiteContent(siteContent, {
        section: "profile",
        summary: "Updated profile image"
      });
      setImgPreview("media-profile-img", siteContent.profile.profileImage);
      flash("media-status", "Profile image updated!");
    } catch (err) {
      flash("media-status", err.message, true);
    }
  });
}

/* ================================================================
   SETTINGS
   ================================================================ */
function populateSettingsForm() {
  const s = siteContent?.settings || {};
  const searchConsole = s.searchConsole || {};
  setVal("set-email", s.contactRecipientEmail);
  setVal("set-sender", s.notificationSenderName);
  setVal("set-site-url", s.siteUrl);
  setVal("set-analytics", s.analyticsMeasurementId);
  setVal("set-label", s.adminContactLabel);
  setVal("set-gh-scroll", s.githubChartScrollPosition || "right");
  setVal("set-sc-tags", searchConsole.verificationTags);
  setVal("set-sc-sitemap", searchConsole.sitemapUrl);
  setVal("set-sc-notes", searchConsole.indexingNotes);
  updateSearchConsoleSummary(searchConsole);

  $("#settings-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    siteContent.settings.contactRecipientEmail = getVal("set-email");
    siteContent.settings.notificationSenderName = getVal("set-sender");
    siteContent.settings.siteUrl = getVal("set-site-url");
    siteContent.settings.analyticsMeasurementId = getVal("set-analytics");
    siteContent.settings.adminContactLabel = getVal("set-label");
    siteContent.settings.githubChartScrollPosition = getVal("set-gh-scroll");
    await saveSiteContent(siteContent, {
      section: "settings",
      summary: "Updated site settings"
    });
    applySeo({
      siteUrl: siteContent.settings.siteUrl,
      title: document.title,
      description: getCurrentAdminDescription(),
      robots: "noindex,nofollow,noarchive"
    });
    injectAnalytics(siteContent.settings.analyticsMeasurementId);
    flash("settings-status", "Settings saved!");
  });

  const searchConsoleForm = $("#search-console-form");
  if (searchConsoleForm && searchConsoleForm.dataset.bound !== "true") {
    searchConsoleForm.dataset.bound = "true";
    searchConsoleForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!siteContent.settings.searchConsole) {
        siteContent.settings.searchConsole = {};
      }
      siteContent.settings.searchConsole.verificationTags = getVal("set-sc-tags");
      siteContent.settings.searchConsole.sitemapUrl = getVal("set-sc-sitemap");
      siteContent.settings.searchConsole.indexingNotes = getVal("set-sc-notes");
      await saveSiteContent(siteContent, {
        section: "settings",
        summary: "Updated Search Console settings"
      });
      updateSearchConsoleSummary(siteContent.settings.searchConsole);
      flash("search-console-status", "Search Console settings saved!");
    });
  }

  const pingBtn = $("#search-console-ping-btn");
  if (pingBtn && pingBtn.dataset.bound !== "true") {
    pingBtn.dataset.bound = "true";
    pingBtn.addEventListener("click", async () => {
      const originalHtml = pingBtn.innerHTML;
      pingBtn.disabled = true;
      pingBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Checking`;

      try {
        const result = await pingSearchConsoleSitemap({
          siteUrl: getVal("set-site-url") || siteContent?.settings?.siteUrl,
          sitemapUrl: getVal("set-sc-sitemap") || siteContent?.settings?.searchConsole?.sitemapUrl
        });

        if (!siteContent.settings.searchConsole) {
          siteContent.settings.searchConsole = {};
        }
        siteContent.settings.searchConsole.sitemapUrl = result.sitemapUrl || getVal("set-sc-sitemap");
        siteContent.settings.searchConsole.lastPingAt = result.checkedAt;
        siteContent.settings.searchConsole.lastPingStatus = result.status || (result.submitted ? "submitted" : "checked");
        siteContent.settings.searchConsole.lastPingMessage = result.message;
        setVal("set-sc-sitemap", siteContent.settings.searchConsole.sitemapUrl);
        updateSearchConsoleSummary(siteContent.settings.searchConsole);
        await saveSiteContent(siteContent, {
          section: "settings",
          summary: "Updated sitemap submission status"
        });
        flash("search-console-status", result.message || "Sitemap check completed.");
      } catch (error) {
        flash("search-console-status", error.message || "Unable to ping the sitemap.", true);
      } finally {
        pingBtn.disabled = false;
        pingBtn.innerHTML = originalHtml;
      }
    });
  }
}

/* ================================================================
   TEAM & ACCESS — Admin user management
   ================================================================ */
async function setupAdminUsers() {
  const form = $("#invite-admin-form");
  if (!form) return;

  try {
    adminUsers = await loadAdminUsers();
  } catch (err) {
    adminUsers = [];
    flash("invite-status", "Unable to load admin access list: " + (err.message || "Unknown error."), true);
  }

  renderAdminUsersTable();

  if (form.dataset.bound === "true") {
    return;
  }

  form.dataset.bound = "true";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = getVal("invite-email").trim().toLowerCase();
    const role = document.getElementById("invite-role")?.value || "editor";
    if (!email) return;

    const existing = adminUsers.find((item) => item.email === email);

    try {
      const result = await inviteAdminUser({ email, role });
      adminUsers = await loadAdminUsers();
      renderAdminUsersTable();
      const baseMessage = existing
        ? `${email} access was updated to ${capitalize(role)}.`
        : `${email} invited as ${capitalize(role)}.`;
      const suffix = result.existingUser ? " Existing account detected, so access was refreshed." : " Invite email sent.";
      flash("invite-status", baseMessage + suffix);
      form.reset();
      const roleSelect = $("#invite-role");
      if (roleSelect) roleSelect.value = "editor";
    } catch (err) {
      flash("invite-status", "Failed to send invite: " + (err.message || "Unknown error."), true);
    }
  });
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function renderAdminUsersTable() {
  const tbody = document.getElementById("admin-users-tbody");
  const wrap = document.getElementById("admin-users-wrap");
  if (!tbody || !wrap) return;

  wrap.hidden = adminUsers.length === 0;
  if (adminUsers.length === 0) {
    tbody.innerHTML = "";
    return;
  }

  const ROLE_BADGE = {
    viewer: '<span class="badge-sm badge-read">Viewer</span>',
    editor: '<span class="badge-sm badge-published">Editor</span>',
    admin: '<span class="badge-sm badge-featured">Admin</span>'
  };

  const currentEmail = String(currentUser?.email || "").trim().toLowerCase();
  tbody.innerHTML = adminUsers.map((u) => {
    const isSelf = currentEmail && u.email === currentEmail;
    return `
    <tr>
      <td data-label="Email">${escapeHtml(u.email)}</td>
      <td data-label="Role">${ROLE_BADGE[u.role] || capitalize(u.role)}</td>
      <td data-label="Added">${u.createdAt ? formatDate(u.createdAt) : "&mdash;"}</td>
      <td class="row-actions" data-label="">
        <button class="danger" title="${isSelf ? "You cannot remove your own access here" : "Remove admin"}" data-email="${escapeHtml(u.email)}" ${isSelf ? "disabled" : ""}><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
  }).join("");

  tbody.querySelectorAll("[data-email]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const email = String(btn.dataset.email || "").trim().toLowerCase();
      if (!email) return;
      if (email === currentEmail) {
        flash("invite-status", "Use a different admin account if you need to remove your own access.", true);
        return;
      }
      if (adminUsers.length <= 1) {
        flash("invite-status", "At least one admin must remain on the allowlist.", true);
        return;
      }
      if (!confirm(`Remove admin access for ${email}?`)) return;

      try {
        await removeAdminUser(email);
        adminUsers = adminUsers.filter((user) => user.email !== email);
        renderAdminUsersTable();
        flash("invite-status", `${email} removed from the allowlist.`);
      } catch (err) {
        flash("invite-status", "Failed to remove admin: " + (err.message || "Unknown error."), true);
      }
    });
  });
}

/* ================================================================
   CHANGE PASSWORD
   ================================================================ */
function setupChangePassword() {
  const form = $("#change-pw-form");
  if (!form || form.dataset.bound === "true") return;

  form.dataset.bound = "true";

  // Password toggle buttons
  $$(".pw-toggle").forEach((btn) => {
    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      const icon = btn.querySelector("i");
      if (!input) return;
      if (input.type === "password") {
        input.type = "text";
        icon.className = "fa-solid fa-eye-slash";
      } else {
        input.type = "password";
        icon.className = "fa-solid fa-eye";
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPw = getVal("pw-current");
    const newPw = getVal("pw-new");
    const confirmPw = getVal("pw-confirm");

    if (!currentPw || !newPw || !confirmPw) return;

    if (newPw.length < 6) {
      flash("change-pw-status", "New password must be at least 6 characters.", true);
      return;
    }

    if (newPw !== confirmPw) {
      flash("change-pw-status", "New passwords do not match.", true);
      return;
    }

    // Verify current password by re-authenticating
    try {
      const email = currentUser?.email;
      if (!email) {
        flash("change-pw-status", "Unable to determine current user.", true);
        return;
      }
      await signInAdmin(email, currentPw);
    } catch (err) {
      flash("change-pw-status", "Current password is incorrect.", true);
      return;
    }

    // Update to new password
    try {
      await changeAdminPassword(newPw);
      flash("change-pw-status", "Password updated successfully!");
      form.reset();
    } catch (err) {
      flash("change-pw-status", "Failed to update password: " + err.message, true);
    }
  });
}

function setupImportExport() {
  setupChangePassword();
  if (document.body.dataset.importExportBound === "true") {
    return;
  }
  document.body.dataset.importExportBound = "true";

  $("#export-btn")?.addEventListener("click", () => {
    const data = exportStateSnapshot();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `portfolio-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    flash("settings-status", "Backup downloaded!");
  });

  $("#import-input")?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importStateSnapshot(payload);
      flash("settings-status", "Import complete — reloading…");
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      flash("settings-status", "Import failed: " + err.message, true);
    }
  });

  $("#seed-btn")?.addEventListener("click", async () => {
    if (!confirm("This will reset ALL content to defaults. Continue?")) return;
    await seedRemoteContent();
    flash("settings-status", "Defaults restored — reloading…");
    setTimeout(() => window.location.reload(), 800);
  });
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function getVersionScopeConfig(value) {
  return VERSION_SCOPES.find((entry) => entry.value === value) || VERSION_SCOPES[0];
}

function getVersionEntityOptions(scope) {
  if (scope.entityType === "project") {
    return projects.map((item) => ({ value: item.id, label: item.title }));
  }

  if (scope.entityType === "testimonial") {
    return testimonials.map((item) => ({ value: item.id, label: item.name }));
  }

  return [];
}

function humanizeHistoryScope(value) {
  return VERSION_SCOPES.find((entry) => entry.value === value)?.label || value || "Site Content";
}

function buildHistorySnapshotPayload(scopeValue, entityId) {
  const profile = siteContent?.profile || {};
  switch (scopeValue) {
    case "hero":
      return cloneJson({
        name: profile.name,
        animatedTitles: profile.animatedTitles || [],
        tagline: profile.tagline,
        yearsExperience: profile.yearsExperience,
        clientsServed: profile.clientsServed,
        avgSpeedImprovement: profile.avgSpeedImprovement,
        avgTrafficIncrease: profile.avgTrafficIncrease,
        availableForFreelance: profile.availableForFreelance,
        linkedin: profile.linkedin,
        github: profile.github,
        githubUsername: profile.githubUsername
      });
    case "profile":
      return cloneJson({
        bio: profile.bio,
        bio2: profile.bio2,
        bio3: profile.bio3,
        location: profile.location,
        email: profile.email,
        phone1: profile.phone1,
        phone2: profile.phone2,
        profileImage: profile.profileImage,
        profileImageAsset: profile.profileImageAsset || null
      });
    case "project-categories":
      return cloneJson(siteContent?.projectCategories || []);
    case "skills":
      return cloneJson({
        techStacks: siteContent?.techStacks || [],
        skills: siteContent?.skills || { technical: [], soft: [] }
      });
    case "experience":
      return cloneJson(siteContent?.experience || []);
    case "education":
      return cloneJson(siteContent?.education || []);
    case "certifications":
      return cloneJson(siteContent?.certifications || []);
    case "pages":
      return cloneJson(siteContent?.pageText || {});
    case "settings":
      return cloneJson(siteContent?.settings || {});
    case "projects":
      return cloneJson(projects.find((item) => item.id === entityId) || null);
    case "testimonials":
      return cloneJson(testimonials.find((item) => item.id === entityId) || null);
    default:
      return cloneJson(siteContent || {});
  }
}

function updateSearchConsoleSummary(searchConsole) {
  const summary = $("#search-console-last-ping");
  if (!summary) return;

  const lastAt = searchConsole?.lastPingAt ? formatDateTime(searchConsole.lastPingAt) : "";
  const status = searchConsole?.lastPingStatus || "";
  const message = searchConsole?.lastPingMessage || "";

  if (!lastAt) {
    summary.textContent = "No sitemap submission has been checked yet.";
    return;
  }

  summary.textContent = `Last sitemap check: ${lastAt}${status ? ` | ${status}` : ""}${message ? ` | ${message}` : ""}`;
}

function renderVersionEntitySelect() {
  const scope = getVersionScopeConfig(getVal("version-scope"));
  const entitySelect = $("#version-entity");
  if (!entitySelect) return;

  if (!scope.requiresEntity) {
    entitySelect.innerHTML = `<option value="">Not required for this section</option>`;
    entitySelect.disabled = true;
    return;
  }

  const options = getVersionEntityOptions(scope);
  entitySelect.disabled = options.length === 0;
  entitySelect.innerHTML = options.length
    ? options.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join("")
    : `<option value="">No items available</option>`;
}

function renderVersionsTable() {
  const tbody = $("#versions-tbody");
  if (!tbody) return;

  const scope = getVersionScopeConfig(getVal("version-scope"));
  const entityId = getVal("version-entity");
  const filtered = contentVersions.filter((entry) => {
    if (entry.section !== scope.value) {
      return false;
    }
    if (scope.requiresEntity && entityId && entry.entityId !== entityId) {
      return false;
    }
    return true;
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:1.25rem">No versions recorded for this selection yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((entry) => `
      <tr data-version-id="${escapeHtml(entry.id)}">
        <td data-label="Section">${escapeHtml(humanizeHistoryScope(entry.section))}</td>
        <td data-label="Type"><span class="badge-sm ${entry.snapshotType === "draft" ? "badge-draft" : entry.snapshotType === "restore" ? "badge-featured" : "badge-read"}">${escapeHtml(entry.snapshotType)}</span></td>
        <td data-label="Label">${escapeHtml(entry.label || entry.summary || "Restore point")}</td>
        <td data-label="Saved">${escapeHtml(formatDateTime(entry.createdAt))}</td>
        <td data-label="By">${escapeHtml(entry.createdBy || "Admin")}</td>
        <td class="row-actions" data-label="">
          <button type="button" class="version-restore-btn" title="Restore this version"><i class="fa-solid fa-rotate-left"></i></button>
        </td>
      </tr>
    `)
    .join("");

  tbody.querySelectorAll(".version-restore-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const row = button.closest("tr");
      const versionId = row?.dataset.versionId;
      if (!versionId) return;
      if (!confirm("Restore this version? The current state will be saved as a restore point first.")) return;

      const originalHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

      try {
        await restoreContentVersion(versionId);
        flash("version-status", "Version restored. Reloading the dashboard…");
        setTimeout(() => window.location.reload(), 500);
      } catch (error) {
        flash("version-status", error.message || "Unable to restore this version.", true);
      } finally {
        button.disabled = false;
        button.innerHTML = originalHtml;
      }
    });
  });
}

function renderAuditTable() {
  const tbody = $("#audit-tbody");
  if (!tbody) return;

  if (!auditLog.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:1.25rem">No audit entries yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = auditLog
    .map((entry) => `
      <tr>
        <td data-label="Actor">${escapeHtml(entry.actorEmail || "admin")}</td>
        <td data-label="Action">${escapeHtml(entry.summary || entry.action)}</td>
        <td data-label="Target">${escapeHtml(`${humanizeHistoryScope(entry.section || entry.entityType)}${entry.entityId && entry.entityId !== "main" ? ` (${entry.entityId})` : ""}`)}</td>
        <td data-label="When">${escapeHtml(formatDateTime(entry.createdAt))}</td>
      </tr>
    `)
    .join("");
}

async function refreshHistoryPanel() {
  auditLog = await loadAuditLog(60);
  contentVersions = await loadContentVersions({ limit: 80 });
  renderVersionEntitySelect();
  renderVersionsTable();
  renderAuditTable();
}

function setupHistoryPanel() {
  const scopeSelect = $("#version-scope");
  const entitySelect = $("#version-entity");
  const saveDraftBtn = $("#version-save-draft-btn");
  const refreshVersionsBtn = $("#versions-refresh-btn");
  const refreshAuditBtn = $("#audit-refresh-btn");

  if (scopeSelect && scopeSelect.dataset.bound !== "true") {
    scopeSelect.dataset.bound = "true";
    scopeSelect.innerHTML = VERSION_SCOPES
      .map((entry) => `<option value="${escapeHtml(entry.value)}">${escapeHtml(entry.label)}</option>`)
      .join("");

    scopeSelect.addEventListener("change", () => {
      renderVersionEntitySelect();
      renderVersionsTable();
    });
  }

  if (entitySelect && entitySelect.dataset.bound !== "true") {
    entitySelect.dataset.bound = "true";
    entitySelect.addEventListener("change", renderVersionsTable);
  }

  if (saveDraftBtn && saveDraftBtn.dataset.bound !== "true") {
    saveDraftBtn.dataset.bound = "true";
    saveDraftBtn.addEventListener("click", async () => {
      const scope = getVersionScopeConfig(getVal("version-scope"));
      const entityId = scope.requiresEntity ? getVal("version-entity") : (scope.entityId || "main");
      const payload = buildHistorySnapshotPayload(scope.value, entityId);
      const label = getVal("version-label");

      if (!payload) {
        flash("version-status", "Select a valid section or item before saving a draft.", true);
        return;
      }

      try {
        await createVersionSnapshot({
          section: scope.value,
          entityType: scope.entityType,
          entityId,
          snapshotType: "draft",
          label,
          summary: `Draft snapshot for ${scope.label}`,
          auditSummary: `Saved manual draft for ${scope.label}`,
          payload
        });
        setVal("version-label", "");
        await refreshHistoryPanel();
        flash("version-status", "Draft snapshot saved.");
      } catch (error) {
        flash("version-status", error.message || "Unable to save the draft.", true);
      }
    });
  }

  if (refreshVersionsBtn && refreshVersionsBtn.dataset.bound !== "true") {
    refreshVersionsBtn.dataset.bound = "true";
    refreshVersionsBtn.addEventListener("click", () => {
      refreshHistoryPanel().catch((error) => flash("version-status", error.message || "Unable to refresh versions.", true));
    });
  }

  if (refreshAuditBtn && refreshAuditBtn.dataset.bound !== "true") {
    refreshAuditBtn.dataset.bound = "true";
    refreshAuditBtn.addEventListener("click", () => {
      refreshHistoryPanel().catch((error) => flash("version-status", error.message || "Unable to refresh history.", true));
    });
  }

  renderVersionEntitySelect();
  renderVersionsTable();
  renderAuditTable();
}

/* ================================================================
   AI WRITING ASSISTANT
   ================================================================ */
const AI_PRESETS = {
  custom: {
    fieldContext: "custom portfolio copy",
    prompt: "",
    promptPlaceholder: "Describe what you want written or improved.",
    currentPlaceholder: "Paste existing copy here, or pull it from the last focused field."
  },
  bio: {
    fieldContext: "professional multi-paragraph bio for a web developer portfolio",
    prompt: "Write a polished professional bio for a web developer with strong WordPress, frontend, SEO, and performance experience.",
    promptPlaceholder: "Describe the background, strengths, and outcomes the bio should highlight.",
    currentPlaceholder: "Paste the current bio to improve, shorten, or expand it."
  },
  "hero-tagline": {
    fieldContext: "homepage hero tagline for a web developer portfolio",
    prompt: "Write a confident homepage hero tagline for a web developer who builds fast, conversion-focused websites.",
    promptPlaceholder: "Describe the positioning or audience the tagline should target.",
    currentPlaceholder: "Paste the current tagline if you want it rewritten."
  },
  "project-short": {
    fieldContext: "short project description for a portfolio card",
    prompt: "Write a concise project summary that explains the outcome, business value, and technical focus.",
    promptPlaceholder: "Describe the project, client, and main result.",
    currentPlaceholder: "Paste the current short description to improve it."
  },
  "project-case-study": {
    fieldContext: "detailed project case study for a portfolio",
    prompt: "Write a detailed project case study with the problem, approach, and outcome for a portfolio page.",
    promptPlaceholder: "Describe the project, scope, stack, challenges, and results.",
    currentPlaceholder: "Paste the current case study to expand, tighten, or rewrite it."
  },
  testimonial: {
    fieldContext: "client testimonial for a web developer portfolio",
    prompt: "Write a believable client testimonial that highlights communication, delivery quality, and business impact.",
    promptPlaceholder: "Describe the client relationship, work delivered, and visible result.",
    currentPlaceholder: "Paste the existing testimonial if you want it refined."
  },
  cta: {
    fieldContext: "portfolio call to action paragraph",
    prompt: "Write a clear call to action that encourages visitors to get in touch about web projects or collaboration.",
    promptPlaceholder: "Describe the action you want visitors to take.",
    currentPlaceholder: "Paste the current call to action to shorten or improve it."
  }
};

const AI_SKIPPED_FIELD_IDS = new Set([
  "hero-name",
  "hero-years",
  "hero-clients",
  "hero-speed",
  "hero-traffic",
  "hero-linkedin",
  "hero-github-url",
  "hero-github-user",
  "profile-location",
  "profile-email",
  "profile-phone1",
  "profile-phone2",
  "proj-url",
  "proj-github",
  "proj-tags",
  "tech-search",
  "tech-skill-icon",
  "soft-skill-icon",
  "exp-date",
  "exp-type",
  "exp-badge",
  "exp-badge-cls",
  "edu-period",
  "edu-icon",
  "cert-date",
  "cert-icon",
  "cert-url",
  "test-name",
  "set-email",
  "set-site-url",
  "set-analytics",
  "set-sc-tags",
  "set-sc-sitemap",
  "set-gh-scroll",
  "invite-email",
  "pw-current",
  "pw-new",
  "pw-confirm",
  "version-label"
]);

const AI_FIELD_OVERRIDES = {
  "hero-tagline": {
    preset: "hero-tagline",
    fieldContext: "homepage hero tagline for a web developer portfolio",
    tone: "confident",
    length: "short",
    fieldType: "single-line"
  },
  "profile-bio": {
    preset: "bio",
    fieldContext: "professional multi-paragraph bio for a web developer portfolio",
    length: "long",
    fieldType: "multi-paragraph"
  },
  "proj-title": {
    fieldContext: "project title for a portfolio case study",
    tone: "confident",
    length: "short",
    fieldType: "single-line"
  },
  "proj-short": {
    preset: "project-short",
    fieldContext: "short project description for a portfolio card",
    length: "short",
    fieldType: "paragraph"
  },
  "proj-long": {
    preset: "project-case-study",
    fieldContext: "detailed HTML project case study for a portfolio page",
    length: "long",
    fieldType: "html"
  },
  "soft-skill-desc": {
    fieldContext: "description of a soft skill on a portfolio page",
    length: "medium",
    fieldType: "paragraph"
  },
  "exp-summary": {
    fieldContext: "work experience summary for a portfolio timeline",
    length: "medium",
    fieldType: "paragraph"
  },
  "exp-bullets": {
    fieldContext: "achievement bullets for a portfolio experience entry",
    length: "medium",
    fieldType: "list"
  },
  "test-content": {
    preset: "testimonial",
    fieldContext: "client testimonial for a web developer portfolio",
    length: "medium",
    fieldType: "paragraph"
  },
  "pg-cta-title": {
    fieldContext: "short call-to-action heading for a portfolio page",
    tone: "confident",
    length: "short",
    fieldType: "single-line"
  },
  "pg-cta-body": {
    preset: "cta",
    fieldContext: "portfolio call to action paragraph",
    length: "medium",
    fieldType: "paragraph"
  },
  "pg-about-title": {
    fieldContext: "about section heading for a portfolio page",
    length: "short",
    fieldType: "single-line"
  },
  "pg-about-sub": {
    fieldContext: "about section subtitle for a portfolio page",
    length: "short",
    fieldType: "single-line"
  },
  "pg-projects-title": {
    fieldContext: "projects section heading for a portfolio page",
    length: "short",
    fieldType: "single-line"
  },
  "pg-projects-sub": {
    fieldContext: "projects section subtitle for a portfolio page",
    length: "short",
    fieldType: "single-line"
  },
  "pg-feedback-title": {
    fieldContext: "testimonials section heading for a portfolio page",
    length: "short",
    fieldType: "single-line"
  },
  "pg-feedback-sub": {
    fieldContext: "testimonials section subtitle for a portfolio page",
    length: "short",
    fieldType: "single-line"
  },
  "pg-footer": {
    fieldContext: "footer copy for a portfolio website",
    length: "short",
    fieldType: "single-line"
  },
  "set-sc-notes": {
    fieldContext: "internal Search Console indexing notes",
    length: "medium",
    fieldType: "multi-paragraph"
  }
};

function isAiEditableField(field) {
  if (!(field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement)) {
    return false;
  }

  if (field.closest("#ai-form") || field.closest("#ai-output") || field.closest("#admin-login-form")) {
    return false;
  }

  if (!field.id || field.disabled || field.readOnly || AI_SKIPPED_FIELD_IDS.has(field.id) || field.dataset.aiSkip === "true") {
    return false;
  }

  if (field instanceof HTMLInputElement) {
    return (field.type || "text").toLowerCase() === "text";
  }

  return true;
}

function trackLastFocusedAdminField(event) {
  const target = event.target;
  if (!isAiEditableField(target)) {
    return;
  }

  lastFocusedAdminField = target;
  updateAiTargetHint();
}

function getFieldLabel(field) {
  const label = field?.id ? document.querySelector(`label[for="${field.id}"]`) : null;
  if (label) {
    return label.textContent.replace(/\s+/g, " ").trim();
  }

  const wrappedLabel = field?.closest?.("label");
  if (wrappedLabel) {
    return wrappedLabel.textContent.replace(/\s+/g, " ").trim();
  }

  return field?.name || field?.id || "active field";
}

function getAiSectionLabel(field) {
  const heading = field?.closest?.(".admin-section")?.querySelector?.(".panel-header h1");
  return heading?.textContent?.replace(/\s+/g, " ").trim() || "Portfolio Content";
}

function getAiTargetField() {
  if (currentAiTargetFieldId) {
    const target = document.getElementById(currentAiTargetFieldId);
    if (isAiEditableField(target)) {
      return target;
    }
    currentAiTargetFieldId = "";
  }

  return isAiEditableField(lastFocusedAdminField) ? lastFocusedAdminField : null;
}

function setAiTargetField(field) {
  currentAiTargetFieldId = field?.id || "";
  if (field) {
    lastFocusedAdminField = field;
  }
}

function updateAiTargetHint() {
  const hint = $("#ai-target-hint");
  if (!hint) return;

  const target = getAiTargetField();
  if (target && document.body.contains(target)) {
    hint.textContent = `Target field: ${getFieldLabel(target)} | ${getAiSectionLabel(target)}`;
    hint.hidden = false;
    return;
  }

  hint.hidden = true;
}

function getAiPresetConfig(key) {
  return AI_PRESETS[key] || AI_PRESETS.custom;
}

function getAiFieldType(field, override = {}) {
  if (override.fieldType) {
    return override.fieldType;
  }

  const id = String(field?.id || "").toLowerCase();
  if (id === "proj-long") {
    return "html";
  }
  if (field.classList.contains("mono-ta") || /bullets|items/.test(id)) {
    return "list";
  }
  if (field instanceof HTMLTextAreaElement && (field.rows >= 6 || /bio|long|notes/.test(id))) {
    return "multi-paragraph";
  }
  if (field instanceof HTMLTextAreaElement) {
    return "paragraph";
  }
  return "single-line";
}

function getAiFieldLength(fieldType, overrideLength = "") {
  if (overrideLength) {
    return overrideLength;
  }
  if (fieldType === "single-line") {
    return "short";
  }
  if (fieldType === "multi-paragraph" || fieldType === "html") {
    return "long";
  }
  return "medium";
}

function getAiFieldConfig(field) {
  const override = AI_FIELD_OVERRIDES[field.id] || {};
  const fieldType = getAiFieldType(field, override);
  return {
    preset: override.preset || "custom",
    fieldContext: override.fieldContext || field.dataset.aiContext || `${getFieldLabel(field)} for the ${getAiSectionLabel(field).toLowerCase()}`,
    tone: override.tone || "professional",
    length: getAiFieldLength(fieldType, override.length || ""),
    fieldType
  };
}

function buildAiFieldPrompt(field, task, config) {
  const label = getFieldLabel(field);
  const section = getAiSectionLabel(field);
  if (task === "improve") {
    return `Improve the ${label} for the ${section}. Keep it aligned with the rest of this form.`;
  }
  if (task === "rewrite") {
    return `Rewrite the ${label} for the ${section} so it is clearer, stronger, and more polished.`;
  }
  if (task === "shorten") {
    return `Shorten the ${label} for the ${section} while keeping the most important points.`;
  }
  if (task === "expand") {
    return `Expand the ${label} for the ${section} with stronger detail and specificity.`;
  }
  return `Write ${config.fieldContext} for the ${section}.`;
}

function normalizeAiContextValue(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function collectAiRelatedFields(field) {
  const form = field?.closest?.("form");
  if (!form) {
    return [];
  }

  const related = [];
  let totalLength = 0;

  $$("input, textarea, select", form).forEach((input) => {
    if (input === field || input.closest("#ai-form")) {
      return;
    }

    let value = "";
    if (input instanceof HTMLInputElement) {
      const type = (input.type || "text").toLowerCase();
      if (["file", "hidden", "password", "search"].includes(type)) {
        return;
      }
      if (["checkbox", "radio"].includes(type)) {
        if (!input.checked) {
          return;
        }
        value = "Yes";
      } else {
        value = normalizeAiContextValue(input.value);
      }
    } else if (input instanceof HTMLTextAreaElement) {
      value = normalizeAiContextValue(input.value);
    } else if (input instanceof HTMLSelectElement) {
      value = normalizeAiContextValue(input.options[input.selectedIndex]?.textContent || input.value);
    }

    if (!value || (input.id && AI_SKIPPED_FIELD_IDS.has(input.id))) {
      return;
    }

    const label = getFieldLabel(input);
    if (!label) {
      return;
    }

    const compactValue = value.length > 420 ? `${value.slice(0, 417)}...` : value;
    totalLength += label.length + compactValue.length;
    if (related.length >= 14 || totalLength > 3800) {
      return;
    }

    related.push({ label, value: compactValue });
  });

  return related;
}

function formatAiRelatedFields(fields) {
  return fields.map((entry) => `${entry.label}: ${entry.value}`).join("\n\n");
}

function updateAiRelatedContextPreview(field = getAiTargetField()) {
  const relatedInput = $("#ai-related-context");
  if (!relatedInput) {
    return [];
  }

  if (!field) {
    relatedInput.value = "";
    return [];
  }

  const relatedFields = collectAiRelatedFields(field);
  relatedInput.value = formatAiRelatedFields(relatedFields);
  return relatedFields;
}

function syncAiPresetFields() {
  const preset = getAiPresetConfig(getVal("ai-preset"));
  const promptInput = $("#ai-prompt");
  const currentInput = $("#ai-current-text");

  if (promptInput) {
    promptInput.placeholder = preset.promptPlaceholder;
    if (!promptInput.value.trim() && preset.prompt) {
      promptInput.value = preset.prompt;
    }
  }

  if (currentInput) {
    currentInput.placeholder = preset.currentPlaceholder;
  }
}

function setAiResultState(result) {
  const output = $("#ai-output");
  const resultBox = $("#ai-result");
  const meta = $("#ai-meta");
  const targetField = getAiTargetField();

  if (resultBox) {
    resultBox.textContent = result.text;
  }

  if (meta) {
    const parts = [];
    if (targetField) parts.push(`Target: ${getFieldLabel(targetField)}`);
    if (result.provider) parts.push(`Provider: ${result.provider}`);
    if (result.model) parts.push(`Model: ${result.model}`);
    meta.textContent = parts.join(" | ");
    meta.hidden = parts.length === 0;
  }

  if (output) {
    output.hidden = false;
  }
}

async function requestAiResult(request) {
  const payload = {
    task: request.task || "generate",
    prompt: request.prompt || "",
    currentText: request.currentText || "",
    fieldContext: request.fieldContext || "portfolio copy",
    fieldLabel: request.fieldLabel || "",
    sectionContext: request.sectionContext || "",
    fieldType: request.fieldType || "",
    contextNotes: request.contextNotes || "",
    relatedFields: Array.isArray(request.relatedFields) ? request.relatedFields : [],
    tone: request.tone || "professional",
    length: request.length || "medium"
  };

  lastAiRequest = { ...payload };
  const result = await generateAdminAiText(payload);
  setAiResultState(result);
  return result;
}

function applyAiTextToField(field, text) {
  if (!isAiEditableField(field)) {
    throw new Error("Focus a content field first.");
  }

  if (!field.id) {
    throw new Error("The selected field cannot be updated automatically.");
  }

  lastAiReplacement = {
    fieldId: field.id,
    previousValue: field.value || ""
  };

  field.value = text;
  setAiTargetField(field);
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  field.focus();
}

function undoLastAiReplacement() {
  if (!lastAiReplacement?.fieldId) {
    throw new Error("Nothing to undo yet.");
  }

  const field = document.getElementById(lastAiReplacement.fieldId);
  if (!field || !isAiEditableField(field)) {
    throw new Error("The previous field is no longer available.");
  }

  field.value = lastAiReplacement.previousValue || "";
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  field.focus();
  setAiTargetField(field);
  lastAiReplacement = null;
  updateAiTargetHint();
  return getFieldLabel(field);
}

function prepareAiWriterForField(field, options = {}) {
  if (!isAiEditableField(field)) {
    throw new Error("Select a supported content field first.");
  }

  const config = getAiFieldConfig(field);
  const task = options.task || (String(field.value || "").trim() ? "improve" : "generate");

  setAiTargetField(field);
  setVal("ai-preset", options.preset || config.preset || "custom");
  syncAiPresetFields();
  setVal("ai-task", task);
  setVal("ai-tone", options.tone || config.tone || "professional");
  setVal("ai-length", options.length || config.length || "medium");
  setVal("ai-prompt", options.prompt || buildAiFieldPrompt(field, task, config));
  setVal("ai-current-text", String(field.value || ""));
  setVal("ai-context-notes", options.contextNotes || "");
  updateAiRelatedContextPreview(field);
  updateAiTargetHint();

  const output = $("#ai-output");
  const status = $("#ai-status");
  if (output) output.hidden = true;
  if (status) status.hidden = true;

  openAdminSection("ai-writer");
  const promptInput = $("#ai-prompt");
  promptInput?.focus();
  promptInput?.setSelectionRange?.(promptInput.value.length, promptInput.value.length);
}

function getInlineAiRequest(field, options = {}) {
  const config = getAiFieldConfig(field);
  const currentText = String(field.value || "");
  const task = options.task || (currentText.trim() ? "improve" : "generate");

  return {
    task,
    prompt: options.prompt || buildAiFieldPrompt(field, task, config),
    currentText,
    fieldContext: config.fieldContext,
    fieldLabel: getFieldLabel(field),
    sectionContext: getAiSectionLabel(field),
    fieldType: config.fieldType,
    contextNotes: options.contextNotes || "",
    relatedFields: collectAiRelatedFields(field),
    tone: options.tone || config.tone || "professional",
    length: options.length || config.length || "medium"
  };
}

function getNearestStatusId(field) {
  const form = field?.closest?.("form");
  const sameCard = form?.closest?.(".admin-card");
  const sameSection = field?.closest?.(".admin-section");
  const statusEl = sameCard?.querySelector?.(".admin-status[id]") || sameSection?.querySelector?.(".admin-status[id]");
  return statusEl?.id || "";
}

function flashInlineAiStatus(field, message, isError = false) {
  const statusId = getNearestStatusId(field);
  if (statusId) {
    flash(statusId, message, isError);
    return;
  }

  if ($("#ai-status")) {
    flash("ai-status", message, isError);
  }
}

async function runInlineAiAssist(field, button, options = {}) {
  if (!isAiEditableField(field)) {
    throw new Error("Select a supported content field first.");
  }

  const request = getInlineAiRequest(field, options);
  setAiTargetField(field);
  updateAiTargetHint();

  const originalHtml = button?.innerHTML || "";
  if (button) {
    button.disabled = true;
    button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  }

  try {
    const result = await requestAiResult(request);
    applyAiTextToField(field, result.text);
    flashInlineAiStatus(
      field,
      `${request.task === "generate" ? "Generated" : "Updated"} ${getFieldLabel(field)} with AI.`,
      false
    );
    return result;
  } catch (error) {
    flashInlineAiStatus(field, "AI assist failed: " + (error.message || "Unknown error."), true);
    throw error;
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = originalHtml;
    }
  }
}

function installAiFieldTriggers() {
  $$(".btn-ai-assist").forEach((button) => {
    const target = document.getElementById(button.dataset.target || "");
    const group = target?.closest?.(".form-group");
    group?.classList?.add("has-ai");
    if (target && isAiEditableField(target) && button.dataset.ctx && !target.dataset.aiContext) {
      target.dataset.aiContext = button.dataset.ctx;
    }
    button.setAttribute("title", "Improve with AI");
    button.setAttribute("aria-label", `Improve ${target ? getFieldLabel(target) : "this field"} with AI`);
  });

  $$("#admin-shell .admin-section form textarea, #admin-shell .admin-section form input[type='text']").forEach((field) => {
    if (!isAiEditableField(field)) {
      return;
    }

    const group = field.closest(".form-group");
    if (!group || group.querySelector(`.btn-ai-assist[data-target="${field.id}"]`) || group.querySelector(`.btn-ai-field-launch[data-target="${field.id}"]`)) {
      return;
    }

    group.classList.add("has-ai");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn-ai-field-launch";
    button.dataset.target = field.id;
    button.setAttribute("aria-label", `Improve ${getFieldLabel(field)} with AI`);
    button.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i><span>AI</span>';

    group.appendChild(button);
  });
}

function buildAiWriterRequest() {
  const preset = getAiPresetConfig(getVal("ai-preset"));
  const targetField = getAiTargetField();
  const targetConfig = targetField ? getAiFieldConfig(targetField) : null;
  const relatedFields = targetField ? updateAiRelatedContextPreview(targetField) : [];
  const currentText = getVal("ai-current-text");

  return {
    task: getVal("ai-task") || (currentText.trim() ? "improve" : "generate"),
    prompt: getVal("ai-prompt") || preset.prompt,
    currentText,
    fieldContext: targetConfig?.fieldContext || preset.fieldContext || "portfolio copy",
    fieldLabel: targetField ? getFieldLabel(targetField) : "",
    sectionContext: targetField ? getAiSectionLabel(targetField) : "",
    fieldType: targetConfig?.fieldType || "paragraph",
    contextNotes: getVal("ai-context-notes"),
    relatedFields,
    tone: getVal("ai-tone") || targetConfig?.tone || "professional",
    length: getVal("ai-length") || targetConfig?.length || "medium"
  };
}

function setupAIWriter() {
  const form = $("#ai-form");
  if (!form || form.dataset.bound === "true") return;

  form.dataset.bound = "true";

  const output = $("#ai-output");
  const resultBox = $("#ai-result");
  const statusBox = $("#ai-status");
  const genBtn = $("#ai-gen-btn");
  const presetSelect = $("#ai-preset");
  const currentInput = $("#ai-current-text");
  const relatedInput = $("#ai-related-context");

  installAiFieldTriggers();
  updateAiTargetHint();
  syncAiPresetFields();
  if (relatedInput) {
    relatedInput.value = "";
  }

  presetSelect?.addEventListener("change", () => {
    syncAiPresetFields();
  });

  $("#ai-pull-context")?.addEventListener("click", () => {
    const targetField = getAiTargetField();
    if (!targetField) {
      flash("ai-status", "Focus a content field first, then pull its text here.", true);
      return;
    }

    currentInput.value = targetField.value || "";
    updateAiTargetHint();
    flash("ai-status", `Loaded context from ${getFieldLabel(targetField)}.`, false);
  });

  $("#ai-pull-related")?.addEventListener("click", () => {
    const targetField = getAiTargetField();
    if (!targetField) {
      flash("ai-status", "Focus a content field first, then load its related form context.", true);
      return;
    }

    const relatedFields = updateAiRelatedContextPreview(targetField);
    flash(
      "ai-status",
      relatedFields.length
        ? `Loaded ${relatedFields.length} related field${relatedFields.length === 1 ? "" : "s"} from ${getAiSectionLabel(targetField)}.`
        : "No other filled fields were found in that form yet.",
      false
    );
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const request = buildAiWriterRequest();

    if (!request.prompt.trim() && !request.currentText.trim()) {
      flash("ai-status", "Add a prompt or current text before generating.", true);
      return;
    }

    genBtn.disabled = true;
    genBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Running AI...`;
    statusBox.hidden = true;
    output.hidden = true;

    try {
      await requestAiResult(request);
      flash("ai-status", "AI draft ready.", false);
    } catch (err) {
      statusBox.textContent = "Generation failed: " + (err.message || "Unknown error.");
      statusBox.hidden = false;
    } finally {
      genBtn.disabled = false;
      genBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Run AI`;
    }
  });

  $("#ai-copy")?.addEventListener("click", () => {
    const text = resultBox?.textContent || "";
    if (!text.trim()) {
      flash("ai-status", "Nothing to copy yet.", true);
      return;
    }
    navigator.clipboard.writeText(text).then(() => flash("ai-status", "AI draft copied.", false));
  });

  $("#ai-apply")?.addEventListener("click", () => {
    const text = resultBox?.textContent || "";
    if (!text.trim()) {
      flash("ai-status", "Generate content before applying it.", true);
      return;
    }

    try {
      const targetField = getAiTargetField();
      applyAiTextToField(targetField, text);
      flash("ai-status", `Inserted AI copy into ${getFieldLabel(targetField)}.`, false);
    } catch (err) {
      flash("ai-status", err.message || "Unable to apply AI copy.", true);
    }
  });

  $("#ai-undo")?.addEventListener("click", () => {
    try {
      const label = undoLastAiReplacement();
      flash("ai-status", `Restored the previous content in ${label}.`, false);
    } catch (err) {
      flash("ai-status", err.message || "Unable to undo the last AI change.", true);
    }
  });

  $("#ai-regen")?.addEventListener("click", async () => {
    if (!lastAiRequest) {
      form.requestSubmit();
      return;
    }

    genBtn.disabled = true;
    genBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Regenerating...`;
    statusBox.hidden = true;

    try {
      await requestAiResult(lastAiRequest);
      flash("ai-status", "AI draft refreshed.", false);
    } catch (err) {
      statusBox.textContent = "Generation failed: " + (err.message || "Unknown error.");
      statusBox.hidden = false;
    } finally {
      genBtn.disabled = false;
      genBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Run AI`;
    }
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-ai-assist, .btn-ai-field-launch");
    if (!btn) return;

    const targetId = btn.dataset.target;
    const field = document.getElementById(targetId);
    if (!isAiEditableField(field)) return;

    if (btn.dataset.ctx && !field.dataset.aiContext) {
      field.dataset.aiContext = btn.dataset.ctx;
    }

    runInlineAiAssist(field, btn).catch(() => undefined);
  });
}
/* ================================================================
   ICON PICKER
   ================================================================ */
function setupIconPicker() {
  const modal = $("#icon-picker-modal");
  const searchEl = $("#icon-picker-search");
  const catEl = $("#icon-picker-cat");
  const grid = $("#icon-picker-grid");
  const countEl = $("#icon-picker-count");
  const closeBtn = $("#icon-picker-close");
  if (!modal) return;

  // Populate category dropdown from data
  const cats = [...new Set(FA_ICONS.map((i) => i.cat))].sort();
  cats.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c;
    catEl.appendChild(opt);
  });

  function renderGrid() {
    const q = (searchEl.value || "").toLowerCase();
    const cat = catEl.value;
    const filtered = FA_ICONS.filter((icon) => {
      const matchQ = !q || icon.name.toLowerCase().includes(q) || icon.cls.toLowerCase().includes(q);
      const matchCat = !cat || icon.cat === cat;
      return matchQ && matchCat;
    });
    countEl.textContent = `${filtered.length} icon${filtered.length !== 1 ? "s" : ""}`;
    grid.innerHTML = filtered
      .map((icon) =>
        `<button type="button" class="icon-picker-item" data-cls="${escapeHtml(icon.cls)}" title="${escapeHtml(icon.name)}">
          <i class="${escapeHtml(icon.cls)}"></i>
          <span>${escapeHtml(icon.name)}</span>
        </button>`
      ).join("");
    grid.querySelectorAll(".icon-picker-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cls = btn.dataset.cls;
        if (_iconPickerTarget) {
          const inp = document.getElementById(_iconPickerTarget);
          if (inp) inp.value = cls;
        }
        if (_iconPickerPreview) {
          const prev = document.getElementById(_iconPickerPreview);
          if (prev) prev.className = cls;
        }
        closeIconPicker();
      });
    });
  }

  searchEl.addEventListener("input", renderGrid);
  catEl.addEventListener("change", renderGrid);
  closeBtn.addEventListener("click", closeIconPicker);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeIconPicker(); });

  // Open picker when any .icon-pick-trigger is clicked (event delegation on body)
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".icon-pick-trigger");
    if (!trigger) return;
    _iconPickerTarget = trigger.dataset.target;
    _iconPickerPreview = trigger.dataset.preview || null;
    modal.hidden = false;
    searchEl.value = "";
    catEl.value = "";
    renderGrid();
    requestAnimationFrame(() => searchEl.focus());
  });
}

function closeIconPicker() {
  const modal = $("#icon-picker-modal");
  if (modal) modal.hidden = true;
  _iconPickerTarget = null;
  _iconPickerPreview = null;
}

/* ================================================================
   UTILITIES
   ================================================================ */
function getVal(id) {
  return document.getElementById(id)?.value || "";
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? "";
}

function getChecked(id) {
  return document.getElementById(id)?.checked || false;
}

function setChecked(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = Boolean(val);
}

function setImgPreview(id, src) {
  const el = document.getElementById(id);
  if (el) el.src = src || "assets/images/profile-placeholder.svg";
}

function previewFile(input, previewId) {
  const file = input?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => setImgPreview(previewId, e.target.result);
  reader.readAsDataURL(file);
}

function flash(id, msg, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `admin-status ${isError ? "is-error" : "is-success"}`;
  el.hidden = false;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => (el.hidden = true), 4000);
}

function getCurrentAdminDescription() {
  return String(document.querySelector('meta[name="description"]')?.content || "").trim();
}

function formatDateLegacy(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}
function formatDateTimeLegacy(iso) {
  if (!iso) return "â€”";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}
function formatDate(iso) {
  if (!iso) return "--";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatDateTime(iso) {
  if (!iso) return "--";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

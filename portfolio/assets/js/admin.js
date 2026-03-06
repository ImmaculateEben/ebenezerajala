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
  getContentRuntimeMode
} from "./content-service.js";

import {
  signInAdmin,
  signOutAdmin,
  onAdminAuthChanged,
  isSupabaseReady
} from "./supabase-config.js";

import { escapeHtml, sanitizePlainText } from "./security.js";

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
let techStacks = [];

/* ── DOM refs ───────────────────────────────────────────────────── */
const $ = (s, p) => (p || document).querySelector(s);
const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

/* ── Init ───────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  techStacks = getAvailableTechStacks();
  setupAuth();
  setupNavigation();
  setupMobileMenu();
  setupQuickActions();
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
    currentUser = user;
    if (user) {
      setAuthVisibility(true);
      showRuntimeBanner();
      loadAll();
    } else {
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
    [siteContent, projects, testimonials, messages] = await Promise.all([
      loadSiteContent(),
      loadProjects(),
      loadTestimonials(),
      loadMessages()
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
  setupAdminUsers();
  setupImportExport();
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
    await saveSiteContent(siteContent);
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
        siteContent.profile.profileImage = await uploadProfileImage(file);
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
    await saveSiteContent(siteContent);
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
      return `<tr data-id="${escapeHtml(p.id)}">
        <td data-label="Project">${escapeHtml(p.title)}</td>
        <td data-label="Tags">${(p.tags || []).map((t) => escapeHtml(t)).join(", ")}</td>
        <td data-label="Type">${typeBadge}</td>
        <td class="row-actions">
          <button title="Edit" class="proj-edit"><i class="fa-solid fa-pen"></i></button>
          <button title="Delete" class="proj-del danger"><i class="fa-solid fa-trash"></i></button>
        </td></tr>`;
    })
    .join("");

  tbody.querySelectorAll("tr").forEach((row) => {
    const id = row.dataset.id;
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
    if (featFile) {
      try {
        featuredImage = await uploadProjectImage(id, featFile);
      } catch (err) {
        flash("proj-status", "Featured image upload failed: " + err.message, true);
        return;
      }
    }

    // Gallery images
    const galleryFiles = Array.from($("#proj-gallery-files")?.files || []);
    let gallery = existing.gallery || [];
    if (galleryFiles.length) {
      try {
        const uploads = await Promise.all(
          galleryFiles.map((f) => uploadProjectImage(id, f))
        );
        gallery = [...gallery, ...uploads];
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
      image: featuredImage,   // keep legacy field in sync
      gallery,
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
      await saveSiteContent(siteContent);
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
      await saveSiteContent(siteContent);
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
    await saveSiteContent(siteContent);
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
      await saveSiteContent(siteContent);
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
    await saveSiteContent(siteContent);
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
      await saveSiteContent(siteContent);
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
    await saveSiteContent(siteContent);
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
      await saveSiteContent(siteContent);
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
    await saveSiteContent(siteContent);
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
      await saveSiteContent(siteContent);
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
    await saveSiteContent(siteContent);
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
  setVal("edu-icon", x.icon);
  $("#edu-form-title").textContent = "Edit Entry";
}

function resetEduForm() {
  $("#edu-form")?.reset();
  setVal("edu-idx", "-1");
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
      await saveSiteContent(siteContent);
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
    await saveSiteContent(siteContent);
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
  setVal("cert-icon", x.icon);
  setVal("cert-url", x.url || "");
  $("#cert-form-title").textContent = "Edit Certification";
}

function resetCertForm() {
  $("#cert-form")?.reset();
  setVal("cert-idx", "-1");
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
    if (file) {
      try {
        image = await uploadTestimonialImage(id, file);
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
    await saveSiteContent(siteContent);
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
      siteContent.profile.profileImage = await uploadProfileImage(file);
      await saveSiteContent(siteContent);
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
  setVal("set-email", s.contactRecipientEmail);
  setVal("set-sender", s.notificationSenderName);
  setVal("set-analytics", s.analyticsMeasurementId);
  setVal("set-label", s.adminContactLabel);

  $("#settings-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    siteContent.settings.contactRecipientEmail = getVal("set-email");
    siteContent.settings.notificationSenderName = getVal("set-sender");
    siteContent.settings.analyticsMeasurementId = getVal("set-analytics");
    siteContent.settings.adminContactLabel = getVal("set-label");
    await saveSiteContent(siteContent);
    flash("settings-status", "Settings saved!");
  });
}

/* ================================================================
   TEAM & ACCESS — Admin user management
   ================================================================ */
function setupAdminUsers() {
  const form = $("#invite-admin-form");
  if (!form) return;

  renderAdminUsersTable();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = getVal("invite-email").trim();
    const role = document.getElementById("invite-role")?.value || "editor";
    if (!email) return;

    if (!siteContent.settings) siteContent.settings = {};
    const users = siteContent.settings.adminUsers || [];

    if (users.find((u) => u.email === email)) {
      flash("invite-status", "This email is already in the list.", true);
      return;
    }

    users.push({ email, role, addedAt: new Date().toISOString() });
    siteContent.settings.adminUsers = users;
    await saveSiteContent(siteContent);
    renderAdminUsersTable();
    flash("invite-status", `${email} added as ${capitalize(role)}.`);
    form.reset();
  });
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function renderAdminUsersTable() {
  const tbody = document.getElementById("admin-users-tbody");
  const wrap = document.getElementById("admin-users-wrap");
  if (!tbody || !wrap) return;

  const users = (siteContent?.settings?.adminUsers) || [];
  wrap.hidden = users.length === 0;
  if (users.length === 0) { tbody.innerHTML = ""; return; }

  const ROLE_BADGE = {
    viewer: '<span class="badge-sm badge-read">Viewer</span>',
    editor: '<span class="badge-sm badge-published">Editor</span>',
    admin: '<span class="badge-sm badge-featured">Admin</span>',
  };

  tbody.innerHTML = users.map((u, i) => `
    <tr>
      <td data-label="Email">${u.email}</td>
      <td data-label="Role">${ROLE_BADGE[u.role] || capitalize(u.role)}</td>
      <td data-label="Added">${u.addedAt ? new Date(u.addedAt).toLocaleDateString() : "&mdash;"}</td>
      <td class="row-actions" data-label="">
        <button class="danger" title="Remove admin" data-idx="${i}"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join("");

  tbody.querySelectorAll("[data-idx]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = parseInt(btn.dataset.idx, 10);
      siteContent.settings.adminUsers.splice(idx, 1);
      await saveSiteContent(siteContent);
      renderAdminUsersTable();
      flash("invite-status", "Admin removed.");
    });
  });
}

function setupImportExport() {
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

/* ================================================================
   AI WRITING ASSISTANT
   ================================================================ */
const AI_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";

async function generateAIText(prompt, tone = "professional", length = "medium") {
  const lengthGuide = { short: "1-2 sentences", medium: "one paragraph (3-5 sentences)", long: "2-3 paragraphs" };
  const systemPrompt = `You are a professional copywriter for web developer portfolios. Write content that is ${tone} in tone. Target length: ${lengthGuide[length] || lengthGuide.medium}. Only output the final text, no explanations or labels.`;

  const fullPrompt = `<s>[INST] ${systemPrompt}\n\nUser request: ${prompt} [/INST]`;

  // Try Hugging Face free inference first
  try {
    const res = await fetch(AI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: length === "long" ? 600 : length === "medium" ? 300 : 120,
          temperature: 0.7,
          return_full_text: false
        }
      })
    });

    if (!res.ok) {
      throw new Error(`API responded with ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text.trim();
    }
    throw new Error("Unexpected API response format.");
  } catch (err) {
    // Fallback: generate locally with templates
    return generateLocalFallback(prompt, tone, length);
  }
}

function generateLocalFallback(prompt, tone, length) {
  const templates = {
    bio: [
      "A dedicated web developer with a proven track record of delivering high-performance websites that drive results. Combining technical expertise with a keen eye for design, every project is approached with a commitment to excellence and user-centered thinking.",
      "With years of hands-on experience building websites for diverse clients, the focus has always been on creating solutions that work — fast load times, clean code, and designs that convert visitors into customers.",
      "Passionate about crafting digital experiences that make an impact. From concept to deployment, every step is guided by best practices, attention to detail, and a genuine desire to help businesses succeed online."
    ],
    project: [
      "This project was built to solve a real business problem — creating a digital presence that communicates trust, drives engagement, and delivers measurable performance improvements.",
      "A comprehensive web solution designed and developed from the ground up, focusing on user experience, performance optimization, and search engine visibility. The result exceeded client expectations in both speed and conversion metrics."
    ],
    testimonial: [
      "Working with this developer was an excellent experience. The attention to detail, clear communication, and technical skill made the entire project smooth and successful.",
      "Exceptional work that transformed our online presence. The website is faster, more professional, and has significantly improved our lead generation."
    ],
    generic: [
      "Delivering exceptional digital solutions with a focus on performance, user experience, and measurable business outcomes. Every project is an opportunity to create something meaningful.",
      "Combining technical expertise with creative problem-solving to build websites that don't just look great — they work hard for the businesses they represent."
    ]
  };

  const lower = prompt.toLowerCase();
  let pool = templates.generic;
  if (lower.includes("bio") || lower.includes("about")) pool = templates.bio;
  else if (lower.includes("project") || lower.includes("case study")) pool = templates.project;
  else if (lower.includes("testimonial") || lower.includes("review") || lower.includes("feedback")) pool = templates.testimonial;

  const idx = Math.floor(Math.random() * pool.length);
  let result = pool[idx];

  if (length === "long" && pool.length > 1) {
    const idx2 = (idx + 1) % pool.length;
    result += "\n\n" + pool[idx2];
  }

  return result;
}

function setupAIWriter() {
  const form = $("#ai-form");
  const output = $("#ai-output");
  const resultBox = $("#ai-result");
  const statusBox = $("#ai-status");
  const genBtn = $("#ai-gen-btn");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const prompt = getVal("ai-prompt");
    if (!prompt.trim()) return;

    genBtn.disabled = true;
    genBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating…`;
    statusBox.hidden = true;
    output.hidden = true;

    try {
      const text = await generateAIText(prompt, getVal("ai-tone"), getVal("ai-length"));
      resultBox.textContent = text;
      output.hidden = false;
    } catch (err) {
      statusBox.textContent = "Generation failed: " + err.message;
      statusBox.hidden = false;
    } finally {
      genBtn.disabled = false;
      genBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Generate`;
    }
  });

  $("#ai-copy")?.addEventListener("click", () => {
    const text = resultBox?.textContent || "";
    navigator.clipboard.writeText(text).then(() => flash("ai-status", "Copied!", false));
  });

  $("#ai-regen")?.addEventListener("click", () => {
    form?.requestSubmit();
  });

  // Inline AI buttons ( .btn-ai-assist throughout the dashboard )
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-ai-assist");
    if (!btn) return;
    const targetId = btn.dataset.target;
    const ctx = btn.dataset.ctx || "professional portfolio copy";
    const textarea = document.getElementById(targetId);
    if (!textarea) return;

    btn.disabled = true;
    const origHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

    try {
      const existing = textarea.value.trim();
      const prompt = existing
        ? `Improve and rewrite the following text for a ${ctx}: "${existing}"`
        : `Write ${ctx}`;
      const text = await generateAIText(prompt, "professional", "medium");
      textarea.value = text;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    } catch (err) {
      console.warn("AI assist failed:", err);
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHTML;
    }
  });
}

// Initialize AI writer when DOM is ready
document.addEventListener("DOMContentLoaded", setupAIWriter);

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

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

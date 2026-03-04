const THEMES = ["dark", "light", "gold"];
const THEME_KEY = "ea_theme";

const THEME_META = {
  dark: { short: "D", label: "Dark", next: "light" },
  light: { short: "L", label: "Light", next: "gold" },
  gold: { short: "G", label: "Gold", next: "dark" }
};

function getTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

function applyTheme(theme) {
  const active = THEMES.includes(theme) ? theme : "dark";
  document.documentElement.setAttribute("data-theme", active);
  localStorage.setItem(THEME_KEY, active);

  const button = document.getElementById("theme-toggle-btn");
  if (!button) {
    return;
  }

  const meta = THEME_META[active];
  button.title = `Switch to ${THEME_META[meta.next].label} mode`;
  button.querySelector(".theme-icon").textContent = meta.short;
  button.querySelector(".theme-label").textContent = meta.label;
}

function toggleTheme() {
  const current = getTheme();
  applyTheme(THEME_META[current]?.next || "dark");
}

function injectToggleButton() {
  if (document.getElementById("theme-toggle-btn")) {
    return;
  }

  const button = document.createElement("button");
  button.id = "theme-toggle-btn";
  button.setAttribute("aria-label", "Toggle theme");
  button.innerHTML = '<span class="theme-icon" aria-hidden="true"></span><span class="theme-label"></span>';
  button.addEventListener("click", toggleTheme);
  document.body.appendChild(button);
}

document.addEventListener("DOMContentLoaded", () => {
  injectToggleButton();
  applyTheme(getTheme());
});

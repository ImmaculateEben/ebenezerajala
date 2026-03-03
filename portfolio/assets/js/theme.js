/**
 * theme.js — 3-way theme system: dark | light | gold
 * Saves preference to localStorage, injects a floating toggle button.
 */

const THEMES = ['dark', 'light', 'gold'];
const THEME_KEY = 'ea_theme';

const THEME_ICONS = {
    dark: { icon: '🌙', label: 'Dark', next: 'light' },
    light: { icon: '☀️', label: 'Light', next: 'gold' },
    gold: { icon: '✦', label: 'Gold', next: 'dark' }
};

function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    // Update toggle button if it exists
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        const t = THEME_ICONS[theme];
        btn.title = `Switch to ${THEME_ICONS[t.next].label} mode`;
        btn.querySelector('.theme-icon').textContent = t.icon;
        btn.querySelector('.theme-label').textContent = t.label;
    }
}

function toggleTheme() {
    const current = getTheme();
    const next = THEME_ICONS[current].next;
    applyTheme(next);
}

function injectToggleButton() {
    const btn = document.createElement('button');
    btn.id = 'theme-toggle-btn';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.innerHTML = `<span class="theme-icon"></span><span class="theme-label"></span>`;
    btn.addEventListener('click', toggleTheme);
    document.body.appendChild(btn);
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const theme = getTheme();
    applyTheme(theme);
    injectToggleButton();
    applyTheme(theme); // apply again to refresh button after it's injected
});

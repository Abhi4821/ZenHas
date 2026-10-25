
const THEME_KEY = "zentalk_theme";

function getSavedTheme() {
    try {
        const savedTheme = localStorage.getItem(THEME_KEY);

        if (savedTheme === "light" || savedTheme === "dark") {
            return savedTheme;
        }
    } catch (error) {
        console.warn("Could not read saved theme.", error);
    }

    return "light";
}

function updateThemeButtons(theme) {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        const isDark = theme === "dark";

        button.setAttribute("aria-pressed", String(isDark));
        button.setAttribute(
            "aria-label",
            isDark ? "Switch to light mode" : "Switch to dark mode"
        );

        const icon = button.querySelector("[data-theme-icon]");
        if (icon) {
            icon.textContent = isDark ? "☀" : "☾";
        }

        const label = button.querySelector("[data-theme-label]");
        if (label) {
            label.textContent = isDark ? "Dark mode" : "Light mode";
        }
    });
}

function applyTheme(theme) {
    const selectedTheme = theme === "dark" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", selectedTheme);

    try {
        localStorage.setItem(THEME_KEY, selectedTheme);
    } catch (error) {
        console.warn("Could not save theme preference.", error);
    }

    updateThemeButtons(selectedTheme);
}

function toggleTheme() {
    const currentTheme =
        document.documentElement.getAttribute("data-theme") || "light";

    applyTheme(currentTheme === "dark" ? "light" : "dark");
}

// Apply the saved theme.
applyTheme(getSavedTheme());

// Support existing and dynamically added theme buttons.
document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-toggle]");

    if (button) {
        toggleTheme();
    }
});

window.ZenTalkTheme = {
    apply: applyTheme,
    toggle: toggleTheme,
    get: getSavedTheme
};

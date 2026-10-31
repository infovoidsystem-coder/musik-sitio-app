(() => {
  const storageKey = "musik-public-theme";
  const root = document.documentElement;
  const saved = localStorage.getItem(storageKey);
  const initial = saved === "light" || saved === "dark" ? saved : "dark";

  const applyTheme = (theme) => {
    root.dataset.siteTheme = theme;
    localStorage.setItem(storageKey, theme);
    const button = document.querySelector(".site-theme-toggle");
    if (button) {
      const isLight = theme === "light";
      button.innerHTML = `<span>${isLight ? "☾" : "☀"}</span><b>${isLight ? "Modo oscuro" : "Modo claro"}</b>`;
      button.setAttribute("aria-label", isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro");
      button.setAttribute("aria-pressed", String(isLight));
    }
  };

  const mount = () => {
    if (document.querySelector(".site-theme-toggle")) return;
    const button = document.createElement("button");
    button.className = "site-theme-toggle";
    button.type = "button";
    button.addEventListener("click", () => applyTheme(root.dataset.siteTheme === "light" ? "dark" : "light"));
    document.body.append(button);
    applyTheme(initial);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, {once:true});
  else mount();
})();

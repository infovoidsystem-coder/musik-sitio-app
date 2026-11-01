(() => {
  const storageKey = "musik-public-theme";
  const fontStorageKey = "musik-public-font-size";
  const root = document.documentElement;
  const saved = localStorage.getItem(storageKey);
  const initial = saved === "light" || saved === "dark" ? saved : "dark";

  const applyTheme = (theme) => {
    root.dataset.siteTheme = theme;
    localStorage.setItem(storageKey, theme);
    const button = document.querySelector(".site-theme-toggle");
    if (button) {
      const isLight = theme === "light";
      button.innerHTML = `<span>${isLight ? "☾" : "☀"}</span><b>${isLight ? "Oscuro" : "Claro"}</b>`;
      button.setAttribute("aria-label", isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro");
      button.setAttribute("aria-pressed", String(isLight));
    }
  };

  const applyFontSize = (size) => {
    const next = ["normal", "medium", "large"].includes(size) ? size : "normal";
    root.dataset.fontSize = next;
    localStorage.setItem(fontStorageKey, next);
    document.querySelectorAll(".font-size-option").forEach(button => {
      const active = button.dataset.fontSize === next;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const factor = next === "large" ? 1.2 : next === "medium" ? 1.1 : 1;
    document.querySelectorAll("main p,main h1,main h2,main h3,main h4,main li,main label,main small,main .product-copy a,footer p,footer a").forEach(element => {
      if (!element.dataset.musikBaseSize) element.dataset.musikBaseSize = String(parseFloat(getComputedStyle(element).fontSize));
      element.style.fontSize = `${Number(element.dataset.musikBaseSize) * factor}px`;
    });
  };

  const mount = () => {
    if (document.querySelector(".site-theme-toggle")) return;
    const tools = document.createElement("div");
    tools.className = "site-tools";
    tools.setAttribute("aria-label", "Apariencia y tamaño del texto");
    tools.innerHTML = '<div class="font-size-control" role="group" aria-label="Tamaño del texto"><button class="font-size-option" type="button" data-font-size="normal" aria-label="Texto normal">A</button><button class="font-size-option" type="button" data-font-size="medium" aria-label="Texto mediano">A+</button><button class="font-size-option" type="button" data-font-size="large" aria-label="Texto grande">A++</button></div>';
    const button = document.createElement("button");
    button.className = "site-theme-toggle";
    button.type = "button";
    button.addEventListener("click", () => applyTheme(root.dataset.siteTheme === "light" ? "dark" : "light"));
    tools.querySelectorAll(".font-size-option").forEach(option => option.addEventListener("click", () => applyFontSize(option.dataset.fontSize)));
    tools.append(button);
    const header = document.querySelector(".public-header");
    const clubButton = header?.querySelector(".cdj-load");
    if (header) header.insertBefore(tools, clubButton || null);
    else document.body.append(tools);
    applyTheme(initial);
    applyFontSize(localStorage.getItem(fontStorageKey) || "normal");
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, {once:true});
  else mount();
})();

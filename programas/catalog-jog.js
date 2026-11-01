(() => {
  const grid = document.querySelector(".catalog-grid");
  const wheel = document.getElementById("jog-wheel");
  const dial = wheel ? wheel.closest(".jog-dial") : null;
  if (!grid || !wheel || !dial) return;

  const items = [...grid.querySelectorAll("a")].map((a) => ({
    href: a.getAttribute("href"),
    tag: (a.querySelector("span") || {}).textContent || "",
    name: (a.querySelector("strong") || {}).textContent || "",
  }));
  const total = items.length;
  if (!total) return;
  const step = 360 / total;

  const indexEl = document.getElementById("jog-index");
  const tagEl = document.getElementById("jog-tag");
  const nameEl = document.getElementById("jog-name");
  const goEl = document.getElementById("jog-go");

  let index = 0;
  let rotation = 0;
  let lastIndex = -1;

  function render() {
    const i = ((index % total) + total) % total;
    const item = items[i];
    indexEl.textContent = String(i + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
    tagEl.textContent = item.tag;
    nameEl.textContent = item.name;
    goEl.setAttribute("href", item.href);
    wheel.setAttribute("aria-valuenow", String(i + 1));
    wheel.setAttribute("aria-valuetext", item.name);
  }

  function setRotation(deg, snap) {
    rotation = deg;
    const i = Math.round(rotation / step);
    if (i !== lastIndex) {
      lastIndex = i;
      index = i;
      render();
    }
    if (snap) rotation = i * step;
    wheel.style.transform = `rotate(${rotation}deg)`;
  }

  let dragging = false;
  let startAngle = 0;
  let startRotation = 0;
  let center = { x: 0, y: 0 };

  function angleFromEvent(e) {
    const dx = e.clientX - center.x;
    const dy = e.clientY - center.y;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }

  wheel.addEventListener("pointerdown", (e) => {
    dragging = true;
    wheel.setPointerCapture(e.pointerId);
    const rect = wheel.getBoundingClientRect();
    center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    startAngle = angleFromEvent(e);
    startRotation = rotation;
    wheel.classList.add("dragging");
    wheel.focus();
  });
  wheel.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const delta = angleFromEvent(e) - startAngle;
    setRotation(startRotation + delta, false);
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    wheel.classList.remove("dragging");
    setRotation(rotation, true);
  }
  wheel.addEventListener("pointerup", endDrag);
  wheel.addEventListener("pointercancel", endDrag);

  wheel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      setRotation((index + 1) * step, true);
      e.preventDefault();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      setRotation((index - 1) * step, true);
      e.preventDefault();
    } else if (e.key === "Enter" || e.key === " ") {
      location.href = goEl.getAttribute("href");
      e.preventDefault();
    }
  });

  render();
})();

(() => {
  const grid = document.querySelector(".catalog-grid");
  const wheel = document.getElementById("jog-wheel");
  const dial = wheel ? wheel.closest(".jog-dial") : null;
  if (!grid || !wheel || !dial) return;

  const items = [...grid.querySelectorAll("a")].map((a) => ({
    href: a.getAttribute("href"),
    tag: (a.querySelector("span") || {}).textContent || "",
    name: (a.querySelector("strong") || {}).textContent || "",
    detail: (a.querySelector("small") || {}).textContent || "FORMACIÓN MUSIK",
  }));
  const total = items.length;
  if (!total) return;
  const step = 360 / total;

  const indexEl = document.getElementById("jog-index");
  const tagEl = document.getElementById("jog-tag");
  const nameEl = document.getElementById("jog-name");
  const goEl = document.getElementById("jog-go");
  const bpmEl = document.getElementById("jog-bpm");
  const keyEl = document.getElementById("jog-key");
  const timeEl = document.getElementById("jog-time");
  const centerIndexEl = document.getElementById("jog-center-index");

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
    if (bpmEl) bpmEl.textContent = (122 + (i % 6) * .5).toFixed(1);
    if (keyEl) keyEl.textContent = item.tag.includes("PRODUCCIÓN") ? "LIVE" : item.tag.includes("CARRERA") ? "PRO" : "MUSIK";
    if (timeEl) timeEl.textContent = item.detail.split("·")[0].trim().toUpperCase();
    if (centerIndexEl) centerIndexEl.textContent = String(i + 1).padStart(2, "0");
    wheel.setAttribute("aria-valuenow", String(i + 1));
    wheel.setAttribute("aria-valuetext", item.name);
    grid.querySelectorAll("a").forEach((card, cardIndex) => card.classList.toggle("jog-selected", cardIndex === i));
    document.getElementById("catalog-jog")?.classList.add("course-change");
    clearTimeout(render.flashTimer);
    render.flashTimer = setTimeout(() => document.getElementById("catalog-jog")?.classList.remove("course-change"), 230);
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
  let previousAngle = 0;
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
    previousAngle = angleFromEvent(e);
    wheel.classList.add("dragging");
    wheel.focus();
  });
  wheel.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const currentAngle = angleFromEvent(e);
    let delta = currentAngle - previousAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    previousAngle = currentAngle;
    setRotation(rotation + delta, false);
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    wheel.classList.remove("dragging");
    setRotation(rotation, true);
  }
  wheel.addEventListener("pointerup", endDrag);
  wheel.addEventListener("pointercancel", endDrag);
  wheel.addEventListener("wheel", (e) => {
    setRotation((index + (e.deltaY > 0 ? 1 : -1)) * step, true);
    e.preventDefault();
  }, { passive: false });

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

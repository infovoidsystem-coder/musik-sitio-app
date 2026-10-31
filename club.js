const defaultEvents = [
  {
    id: 1,
    type: "clase",
    label: "CLASE",
    day: "30",
    month: "OCT",
    time: "19:00",
    title: "DJ Inicial · Clase abierta",
    place: "Musik Studio",
    capacity: 8,
    booked: 3,
    enabled: true,
  },
  {
    id: 2,
    type: "practica",
    label: "PRÁCTICA",
    day: "02",
    month: "NOV",
    time: "18:30",
    title: "Open Decks + feedback",
    place: "Cabina principal",
    capacity: 6,
    booked: 4,
    enabled: true,
  },
  {
    id: 3,
    type: "evento",
    label: "EVENTO",
    day: "08",
    month: "NOV",
    time: "23:30",
    title: "Musik Club Night",
    place: "Ubicación a confirmar",
    capacity: 30,
    booked: 24,
    enabled: true,
  },
  {
    id: 4,
    type: "clase",
    label: "MASTERCLASS",
    day: "12",
    month: "NOV",
    time: "20:00",
    title: "Hybrid DJ Performance",
    place: "Musik Lab",
    capacity: 10,
    booked: 10,
    enabled: true,
  },
  {
    id: 5,
    type: "practica",
    label: "PRÁCTICA",
    day: "16",
    month: "NOV",
    time: "17:00",
    title: "Vinyl Sunday",
    place: "Sala analógica",
    capacity: 5,
    booked: 2,
    enabled: true,
  },
  {
    id: 6,
    type: "evento",
    label: "STREAM",
    day: "21",
    month: "NOV",
    time: "21:00",
    title: "Producer Listening Session",
    place: "Online",
    capacity: 50,
    booked: 18,
    enabled: true,
  },
];
const loadEvents = () =>
  JSON.parse(localStorage.getItem("musik-events") || "null") || defaultEvents;
let events = loadEvents(),
  selectedEvent = null,
  currentFilter = "all";
const grid = document.querySelector("#booking-grid");
function render() {
  grid.innerHTML =
    events
      .filter(
        (e) =>
          e.enabled && (currentFilter === "all" || e.type === currentFilter),
      )
      .map((e) => {
        const left = e.capacity - e.booked,
          status = left === 0 ? "none" : left <= 3 ? "low" : "",
          text = left === 0 ? "Sin cupos" : `${left} lugares`;
        return `<article class="booking-card ${left === 0 ? "sold-out" : ""}"><div class="booking-card-head"><span class="booking-type">${e.label}</span><span class="spots ${status}">${text}</span></div><div class="booking-date">${e.day} <small>${e.month} · ${e.time} H</small></div><h3>${e.title}</h3><p>${e.place} · Cupo máximo ${e.capacity}</p><button data-reserve="${e.id}" ${left === 0 ? "disabled" : ""}>${left === 0 ? "Lista completa" : "Reservar mi lugar →"}</button></article>`;
      })
      .join("") || "<p>No hay fechas disponibles en esta categoría.</p>";
  grid
    .querySelectorAll("[data-reserve]")
    .forEach((b) => (b.onclick = () => openBooking(Number(b.dataset.reserve))));
}
document.querySelectorAll("[data-booking-filter]").forEach(
  (btn) =>
    (btn.onclick = () => {
      document
        .querySelectorAll("[data-booking-filter]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.bookingFilter;
      render();
    }),
);
const memberDialog = document.querySelector("#member-dialog"),
  bookingDialog = document.querySelector("#booking-dialog"),
  toast = document.querySelector(".toast");
let toastTimer;
function showToast(m) {
  toast.textContent = m;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}
document.querySelectorAll("[data-member]").forEach(
  (b) =>
    (b.onclick = () => {
      if (window.MusikAuth.user) location.href = "member.html";
      else memberDialog.showModal();
    }),
);
document.querySelector("#member-dialog .modal-close").onclick = () =>
  memberDialog.close();
const googleLogin = document.querySelector("#google-login"),
  authStatus = document.querySelector("#auth-status"),
  clubAuthForm = document.querySelector("#club-register");
googleLogin.remove();
authStatus.remove();
document.querySelector("#member-dialog .modal-separator")?.remove();
document.querySelector("#member-dialog h2").textContent =
  "Ingresá a Musik Club";
document.querySelector("#member-dialog h2+p").textContent =
  "El panel se habilita después del pago de un curso o membresía. Si ya compraste, ingresá con tu cuenta.";
clubAuthForm.innerHTML =
  '<label>Nombre completo <small>solo para registrarte</small><input name="name" autocomplete="name" placeholder="Tu nombre"></label><label>Email<input name="email" type="email" autocomplete="username" required placeholder="vos@email.com"></label><label>Contraseña<input name="password" type="password" autocomplete="current-password" minlength="8" required placeholder="Mínimo 8 caracteres"></label><button class="btn primary" type="submit">Iniciar sesión →</button><button class="auth-register" id="member-register" type="button">Crear una cuenta nueva</button>';
clubAuthForm.onsubmit = async (event) => {
  event.preventDefault();
  const form = new FormData(clubAuthForm),
    button = clubAuthForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Ingresando…";
  try {
    await window.MusikAuth.signInPassword(
      String(form.get("email")).trim(),
      String(form.get("password")),
    );
    memberDialog.close();
    location.href = "member.html";
  } catch (error) {
    showToast(
      error.message === "Invalid login credentials"
        ? "Email o contraseña incorrectos."
        : error.message || "No pudimos iniciar sesión.",
    );
  } finally {
    button.disabled = false;
    button.textContent = "Iniciar sesión →";
  }
};
document.querySelector("#member-register").onclick = async () => {
  const form = new FormData(clubAuthForm),
    name = String(form.get("name") || "").trim(),
    email = String(form.get("email") || "").trim(),
    password = String(form.get("password") || "");
  if (!name || !email || password.length < 8) {
    showToast("Completá nombre, email y una contraseña de 8 caracteres.");
    return;
  }
  try {
    const result = await window.MusikAuth.signUpPassword(name, email, password);
    if (result.session) {
      memberDialog.close();
      document.querySelector('#planes')?.scrollIntoView({behavior:'smooth'});
      showToast("Cuenta creada. Elegí un curso o membresía para habilitar tu panel.");
    } else showToast("Cuenta creada. Revisá tu email y luego elegí un curso o membresía.");
  } catch (error) {
    showToast(error.message || "No pudimos crear la cuenta.");
  }
};
document.querySelector("#google-logout").onclick = () =>
  window.MusikAuth.signOut();
function openBooking(id) {
  if (window.MusikAuth.configured && !window.MusikAuth.user) {
    if (!memberDialog.open) memberDialog.showModal();
    showToast("Ingresá como miembro para reservar.");
    return;
  }
  selectedEvent = events.find((e) => e.id === id);
  document.querySelector("#booking-title").textContent = selectedEvent.title;
  document.querySelector("#booking-summary").innerHTML =
    `<strong>${selectedEvent.day} ${selectedEvent.month} · ${selectedEvent.time} h</strong><br>${selectedEvent.place}<br>${selectedEvent.capacity - selectedEvent.booked} lugares disponibles`;
  const bookingForm=document.querySelector('#booking-form'),user=window.MusikAuth?.user,meta=user?.user_metadata||{},cached=user?JSON.parse(localStorage.getItem('musik-member-profiles')||'{}')[user.id]||{}:{};
  bookingForm.elements.name.value=meta.full_name||meta.name||cached.name||'';
  bookingForm.elements.artist_name.value=meta.artist_name||cached.artist_name||'';
  bookingForm.elements.email.value=user?.email||'';
  bookingDialog.showModal();
}
document.querySelector(".booking-close").onclick = () => bookingDialog.close();
document.querySelector("#booking-form").onsubmit = async (e) => {
  e.preventDefault();
  const user = window.MusikAuth?.user,
    client = window.MusikAuth?.client,
    fields = e.currentTarget.elements,
    submit = e.currentTarget.querySelector('button[type="submit"]');
  if (window.MusikAuth?.configured && !user) {
    bookingDialog.close();
    memberDialog.showModal();
    showToast("Ingresá como miembro para reservar.");
    return;
  }
  const meta = user?.user_metadata || {},
    entry = {
      id: crypto.randomUUID(),
      user_id: user?.id || null,
      member_email: user?.email || String(fields.email?.value || ""),
      member_name:
        meta.full_name ||
        meta.name ||
        String(fields.name?.value || "Miembro MUSIK"),
      member_artist_name:
        meta.artist_name || String(fields.artist_name?.value || "").trim(),
      event_key: String(selectedEvent.id),
      booking_type: selectedEvent.type,
      title: selectedEvent.title,
      day: selectedEvent.day,
      month: selectedEvent.month,
      time_label: selectedEvent.time,
      place: selectedEvent.place,
      status: "confirmed",
      created_at: new Date().toISOString(),
    };
  submit.disabled = true;
  submit.textContent = "Confirmando…";
  try {
    let saved = false;
    if (user && client) {
      let { error } = await client.from("club_bookings").insert(entry);
      if (error && /member_artist_name|column/i.test(error.message || "")) {
        const compatibleEntry = { ...entry };
        delete compatibleEntry.member_artist_name;
        ({ error } = await client.from("club_bookings").insert(compatibleEntry));
      }
      if (error?.code === "23505")
        throw new Error("Ya tenés una reserva para esta actividad.");
      saved = !error;
    }
    if (!saved) {
      const bookings = JSON.parse(
        localStorage.getItem("musik-club-bookings") || "[]",
      );
      if (
        bookings.some(
          (item) =>
            item.member_email === entry.member_email &&
            item.event_key === entry.event_key &&
            item.status === "confirmed",
        )
      )
        throw new Error("Ya tenés una reserva para esta actividad.");
      bookings.unshift(entry);
      localStorage.setItem("musik-club-bookings", JSON.stringify(bookings));
      const notifications = JSON.parse(
        localStorage.getItem("musik-member-notifications") || "[]",
      );
      notifications.unshift({
        id: crypto.randomUUID(),
        user_id: entry.user_id,
        member_email: entry.member_email,
        type: "booking",
        title: "Reserva confirmada",
        body: `${entry.title} · ${entry.day} ${entry.month} · ${entry.time_label} h · ${entry.place}`,
        booking_id: entry.id,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(
        "musik-member-notifications",
        JSON.stringify(notifications),
      );
    }
    const i = events.findIndex((x) => x.id === selectedEvent.id);
    events[i].booked++;
    localStorage.setItem("musik-events", JSON.stringify(events));
    bookingDialog.close();
    e.currentTarget.reset();
    render();
    showToast("Reserva confirmada. Ya aparece en tu panel ✓");
    if ("Notification" in window && Notification.permission === "granted")
      new Notification("MUSIK · Reserva confirmada", {
        body: `${entry.title} · ${entry.day} ${entry.month}, ${entry.time_label} h`,
      });
  } catch (error) {
    showToast(error.message || "No pudimos confirmar la reserva.");
  } finally {
    submit.disabled = false;
    submit.textContent = "Confirmar mi lugar →";
  }
};
window.addEventListener("storage", (e) => {
  if (e.key === "musik-events") {
    events = loadEvents();
    render();
  }
});
let installPrompt = null;
const installButton = document.querySelector("#install-button"),
  isIos = /iphone|ipad|ipod/i.test(navigator.userAgent),
  isStandalone =
    matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true;
const installGuide = document.createElement("dialog");
installGuide.className = "install-guide";
installGuide.innerHTML = `<button class="modal-close" aria-label="Cerrar">×</button><span class="kicker">INSTALAR MUSIK CLUB</span><h2>${isIos ? "Instalala desde Safari" : "Instalación en el dispositivo"}</h2><p>${isIos ? "Apple requiere confirmar la instalación desde el menú Compartir." : "Abrí el menú del navegador para instalar Musik Club como aplicación."}</p><ol>${isIos ? "<li>Abrí esta página con Safari.</li><li>Tocá el botón Compartir.</li><li>Elegí “Agregar a pantalla de inicio”.</li><li>Confirmá tocando “Agregar”.</li>" : "<li>Abrí el menú ⋮ del navegador.</li><li>Elegí “Instalar aplicación”.</li><li>Confirmá la instalación.</li>"}</ol><button class="btn primary" data-close-install>Entendido</button>`;
document.body.append(installGuide);
installGuide
  .querySelectorAll(".modal-close,[data-close-install]")
  .forEach((button) => (button.onclick = () => installGuide.close()));
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
  installButton.textContent = "Instalar Musik Club →";
});
window.addEventListener("appinstalled", () => {
  installPrompt = null;
  document.body.classList.add("app-installed");
  showToast("Musik Club quedó instalada ✓");
});
if (isStandalone) document.body.classList.add("app-installed");
installButton.onclick = async () => {
  if (isStandalone) {
    location.href = "member.html";
    return;
  }
  if (installPrompt) {
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") installPrompt = null;
    return;
  }
  installGuide.showModal();
};
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("sw.js", { scope: "./" });
render();
if (new URLSearchParams(location.search).get("admin") === "1")
  memberDialog.showModal();
const installedApp =
  matchMedia("(display-mode: standalone)").matches ||
  navigator.standalone === true ||
  new URLSearchParams(location.search).get("app") === "1";
if (installedApp) {
  document.body.classList.add("installed-app");
  const openInstalledLogin = () => {
    if (!memberDialog.open) memberDialog.showModal();
  };
  const appAuthWait = setInterval(() => {
    if (window.MusikAuth?.user) {
      clearInterval(appAuthWait);
      location.replace("member.html");
    } else if (window.MusikAuth?.configured) {
      clearInterval(appAuthWait);
      openInstalledLogin();
    }
  }, 350);
  setTimeout(() => {
    clearInterval(appAuthWait);
    if (!window.MusikAuth?.user) openInstalledLogin();
  }, 3500);
}

/* Navegación directa del Club, sin enlaces duplicados. */
const clubDesktopNav = document.querySelector(".club-top .desktop-nav");
if (clubDesktopNav)
  clubDesktopNav.innerHTML =
    '<a href="index.html">Inicio</a><a href="#nosotros">Nosotros</a><a href="#agenda">Reservas</a><a class="active" href="#home">Club</a><a href="#descargas">Descargas</a>';
const clubMobileNav = document.querySelector(".mobile-nav");
if (clubMobileNav)
  clubMobileNav.innerHTML =
    '<a href="index.html">⌂<span>Inicio</span></a><a href="#nosotros">◎<span>Nosotros</span></a><a href="#agenda">▣<span>Reservas</span></a><a class="active" href="#home">♫<span>Club</span></a><a href="#descargas">⇩<span>Descargas</span></a>';

/* Historia, equipo y dirección artística de MUSIK. */
const clubHero = document.querySelector(".club-hero");
const aboutSection = document.createElement("section");
aboutSection.className = "club-about section";
aboutSection.id = "nosotros";
aboutSection.innerHTML = `<div class="about-heading"><div><span class="kicker">NOSOTROS / MUSIK</span><h2>Una escuela nacida<br><em>desde la cabina.</em></h2></div><p>MUSIK es una academia de DJs y productores donde la técnica, la práctica y la identidad artística se trabajan como una sola experiencia.</p></div><div class="about-story"><article class="about-history"><span class="about-number">01</span><small>NUESTRA HISTORIA</small><h3>Formación con cultura de club.</h3><p>La escuela surge de una vida dedicada a la música y de una idea concreta: acercar al aula la experiencia real de la cabina. En MUSIK cada recorrido combina fundamentos, tecnología, escucha y práctica para que cada alumno pueda construir un sonido propio.</p><p>Hoy la academia reúne formación para DJs y productores, encuentros, masterclasses y una comunidad que continúa aprendiendo dentro y fuera de clase.</p><div class="about-values"><span><b>PRÁCTICA</b>Aprender haciendo</span><span><b>IDENTIDAD</b>Encontrar tu sonido</span><span><b>COMUNIDAD</b>Crecer con otros</span></div></article><article class="about-founder"><div class="founder-photo"><img src="assets/hernan-paredes-dj.png" alt="Hernán Paredes, director y fundador de MUSIK, en una cabina de DJ"><span>DIRECTOR / FOUNDER</span></div><div class="founder-copy"><small>BIOGRAFÍA</small><h3>Hernán Paredes</h3><p>DJ, productor, coach y director de MUSIK, con más de 30 años de trayectoria profesional. Su experiencia une técnica de mezcla, lectura de pista, selección musical y formación personalizada.</p><p>Como fundador, lleva a cada clase el conocimiento de quien vive la música desde adentro: guía procesos, comparte recursos de cabina y acompaña a cada alumno a desarrollar criterio, seguridad e identidad artística.</p><a href="index.html#musik-radio">Escuchar su música ↗</a></div></article></div><div class="about-team"><div><span class="kicker">QUIENES HACEN MUSIK</span><h3>Docentes, productores y artistas en actividad.</h3><p>Un equipo que comparte experiencia real, acompaña cada proceso y conecta la formación con la escena.</p></div><div class="team-roles"><span>Dirección académica</span><span>Docentes especializados</span><span>Artistas invitados</span><span>Comunidad MUSIK</span></div></div>`;
clubHero?.after(aboutSection);

/* Biblioteca visible para todos y descargable solo por miembros autenticados. */
const appDownloadSection = document.querySelector("#app");
const downloadsSection = document.createElement("section");
downloadsSection.className = "club-downloads section";
downloadsSection.id = "descargas";
downloadsSection.innerHTML = `<div class="section-head"><div><span class="kicker">BIBLIOTECA / CLUB</span><h2>Recursos para<br><em>seguir mezclando.</em></h2></div><p>Tips, tracks y materiales seleccionados por MUSIK. Podés explorar la biblioteca; la descarga está habilitada únicamente para miembros.</p></div><div class="download-filters"><button class="active" data-download-filter="all">Todo</button><button data-download-filter="tip">Tips</button><button data-download-filter="track">Tracks</button><button data-download-filter="material">Materiales</button></div><div class="download-grid" id="club-download-grid"></div>`;
appDownloadSection?.before(downloadsSection);
const defaultDownloads = [
  {
    id: "demo-tip",
    category: "tip",
    title: "Checklist antes de tocar",
    description:
      "Preparación de cabina, niveles, cues y organización para llegar listo a cada set.",
    file_name: "Checklist Musik.pdf",
    external_url: "",
    file_path: "",
    enabled: true,
  },
  {
    id: "demo-track",
    category: "track",
    title: "Warm-up tools · Vol. 01",
    description:
      "Selección de recursos y referencias para trabajar aperturas y construcción de energía.",
    file_name: "Warm-up tools",
    external_url: "",
    file_path: "",
    enabled: true,
  },
];
let downloadFilter = "all";
const clubDownloadGrid = document.querySelector("#club-download-grid");
function renderClubDownloads(items) {
  const visible = items.filter(
    (x) =>
      x.enabled !== false &&
      (downloadFilter === "all" || x.category === downloadFilter),
  );
  clubDownloadGrid.innerHTML = visible.length
    ? visible
        .map(
          (item, index) =>
            `<article class="download-card"><span class="download-index">${String(index + 1).padStart(2, "0")}</span><span class="download-kind">${item.category === "tip" ? "TIP" : item.category === "track" ? "TRACK" : "MATERIAL"}</span><h3>${item.title}</h3><p>${item.description}</p><small>${item.file_name || "Recurso Musik"}</small><button data-member-download="${item.id}">${window.MusikAuth?.user ? "Descargar recurso ↓" : "Solo miembros · Ingresar →"}</button></article>`,
        )
        .join("")
    : "<p>No hay recursos disponibles en esta categoría.</p>";
  clubDownloadGrid
    .querySelectorAll("[data-member-download]")
    .forEach(
      (button) =>
        (button.onclick = () =>
          downloadResource(
            items.find((x) => String(x.id) === button.dataset.memberDownload),
          )),
    );
}
async function loadClubDownloads() {
  let items =
    JSON.parse(localStorage.getItem("musik-downloads") || "null") ||
    defaultDownloads;
  const client = window.MusikAuth?.client;
  if (client) {
    const { data, error } = await client
      .from("member_downloads")
      .select("*")
      .eq("enabled", true)
      .order("created_at", { ascending: false });
    if (!error && data?.length) items = data;
  }
  renderClubDownloads(items);
  return items;
}
async function downloadResource(item) {
  if (!window.MusikAuth?.user) {
    memberDialog.showModal();
    showToast("Ingresá como miembro para descargar.");
    return;
  }
  try {
    let url = item.external_url;
    if (item.file_path) {
      const { data, error } = await window.MusikAuth.client.storage
        .from("member-downloads")
        .createSignedUrl(item.file_path, 60);
      if (error) throw error;
      url = data.signedUrl;
    }
    if (!url) {
      showToast("Este recurso es una demostración.");
      return;
    }
    window.open(url, "_blank", "noopener");
    showToast("Descarga autorizada ✓");
  } catch (_error) {
    showToast("No pudimos generar la descarga. Intentá nuevamente.");
  }
}
document.querySelectorAll("[data-download-filter]").forEach(
  (button) =>
    (button.onclick = async () => {
      document
        .querySelectorAll("[data-download-filter]")
        .forEach((x) => x.classList.remove("active"));
      button.classList.add("active");
      downloadFilter = button.dataset.downloadFilter;
      renderClubDownloads(await loadClubDownloads());
    }),
);
loadClubDownloads();
setTimeout(loadClubDownloads, 1200);

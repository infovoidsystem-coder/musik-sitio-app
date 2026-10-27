(() => {
  const isAdmin = document.body.classList.contains("admin-page"),
    statusText = {
      pending: "Pendiente de sincronización",
      processing: "Procesando",
      issued: "Emitida · falta enviar",
      sent: "Enviada",
      failed: "Error de sincronización",
      cancelled: "Cancelada",
    },
    money = (value) =>
      Number(value || 0).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }),
    date = (value) =>
      value
        ? new Date(value).toLocaleString("es-AR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
    notify = (text) => {
      const toast = document.querySelector(".toast");
      if (toast) {
        toast.textContent = text;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3200);
      }
    };
  const demo = {
    id: "demo-invoice",
    status: "issued",
    provider: "pending_integration",
    invoice_type: "C",
    invoice_number: "00001-00000123",
    recipient_email: "alumno@musik.com",
    issued_at: new Date().toISOString(),
    sent_at: null,
    pdf_url: "",
    payments: { amount_ars: 22000, provider: "mercadopago" },
    profiles: { full_name: "Alumno MUSIK", email: "alumno@musik.com" },
    demo: true,
  };
  function row(item, admin = false) {
    const sent = item.status === "sent",
      canSend = ["issued", "failed", "pending"].includes(item.status);
    return `<article class="invoice-row"><div class="invoice-mark">${item.invoice_type || "FC"}</div><div class="invoice-main"><small>${item.invoice_number || "COMPROBANTE PENDIENTE"}</small><h3>${admin ? item.profiles?.full_name || "Alumno MUSIK" : "Compra MUSIK"}</h3><p>${money(item.payments?.amount_ars)} · ${item.recipient_email || item.profiles?.email || "Email pendiente"}</p></div><span class="invoice-status ${item.status}"><i></i>${statusText[item.status] || item.status}</span><div class="invoice-meta"><small>${sent ? "ENVIADA" : "ÚLTIMA ACTUALIZACIÓN"}</small><strong>${date(item.sent_at || item.last_sync_at || item.issued_at || item.created_at)}</strong></div>${item.pdf_url ? `<a class="invoice-pdf" href="${item.pdf_url}" target="_blank" rel="noopener">Ver PDF ↗</a>` : ""}${canSend ? `<button class="invoice-send" data-send-invoice="${item.id}" ${item.demo ? 'data-demo="1"' : ""}>${item.status === "failed" ? "Reintentar" : "Enviar factura"} →</button>` : ""}</article>`;
  }
  async function send(button) {
    if (button.dataset.demo) {
      notify(
        "Vista previa: quedará activa al conectar el sistema de facturación.",
      );
      return;
    }
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "Enviando…";
    try {
      const { data, error } = await window.MusikAuth.client.functions.invoke(
        "billing-sync",
        { body: { invoice_id: button.dataset.sendInvoice, action: "send" } },
      );
      if (error) throw error;
      notify(data.message || "Solicitud de envío registrada.");
      isAdmin ? loadAdmin() : loadMember();
    } catch (error) {
      notify(error.message || "No pudimos enviar la factura.");
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }
  function bind(root) {
    root
      .querySelectorAll("[data-send-invoice]")
      .forEach((button) => (button.onclick = () => send(button)));
  }
  async function fetchInvoices(admin = false) {
    const client = window.MusikAuth?.client,
      user = window.MusikAuth?.user;
    if (!client || !user) return [demo];
    const query = client
      .from("billing_invoices")
      .select(
        "*,payments(amount_ars,provider,status),profiles(full_name,email)",
      )
      .order("created_at", { ascending: false });
    const { data, error } = admin
      ? await query
      : await query.eq("user_id", user.id);
    return error ? [demo] : data || [];
  }
  let adminList, memberList;
  async function loadAdmin() {
    const items = await fetchInvoices(true);
    adminList.innerHTML = items.length
      ? items.map((item) => row(item, true)).join("")
      : '<div class="invoice-empty"><strong>No hay facturas todavía.</strong><span>Se crearán automáticamente cuando se confirme un pago.</span></div>';
    bind(adminList);
    document.querySelector("#invoice-total").textContent = items.filter(
      (x) => !x.demo,
    ).length;
    document.querySelector("#invoice-pending").textContent = items.filter(
      (x) => x.status !== "sent" && !x.demo,
    ).length;
    document.querySelector("#invoice-sent").textContent = items.filter(
      (x) => x.status === "sent" && !x.demo,
    ).length;
  }
  async function loadMember() {
    const items = await fetchInvoices(false);
    memberList.innerHTML = items.length
      ? items.map((item) => row(item, false)).join("")
      : '<div class="invoice-empty"><strong>Todavía no tenés facturas.</strong><span>Después de una compra vas a poder consultar el estado y solicitar el envío desde acá.</span></div>';
    bind(memberList);
  }
  if (isAdmin) {
    const nav = document.querySelector(".admin-page aside nav"),
      tab = document.createElement("button");
    tab.dataset.adminTab = "billing";
    tab.textContent = "▤ Facturación";
    nav?.append(tab);
    const view = document.createElement("section");
    view.className = "admin-view";
    view.dataset.adminView = "billing";
    view.innerHTML =
      '<div class="admin-stats"><article><span>Total de facturas</span><b id="invoice-total">—</b></article><article><span>Pendientes</span><b id="invoice-pending">—</b></article><article><span>Enviadas</span><b id="invoice-sent">—</b></article></div><section class="admin-card"><div class="admin-card-head"><div><h2>Facturación de ventas</h2><p>Controlá emisión, sincronización y envío al alumno.</p></div><button class="preview-link" id="refresh-invoices">Actualizar ↻</button></div><div class="invoice-list" id="admin-invoice-list"></div></section>';
    document.querySelector(".admin-page main")?.append(view);
    adminList = view.querySelector("#admin-invoice-list");
    tab.onclick = () => {
      document
        .querySelectorAll("[data-admin-tab]")
        .forEach((x) => x.classList.remove("active"));
      document
        .querySelectorAll("[data-admin-view]")
        .forEach((x) => x.classList.remove("active"));
      tab.classList.add("active");
      view.classList.add("active");
      document.querySelector("#admin-title").textContent = "Facturación";
      loadAdmin();
    };
    view.querySelector("#refresh-invoices").onclick = loadAdmin;
  } else {
    const section = document.createElement("section");
    section.className = "member-invoices";
    section.id = "mis-facturas";
    section.innerHTML =
      '<div class="member-section-head"><div><span class="kicker">PAGOS / COMPROBANTES</span><h2>Mis facturas.</h2><p>Consultá si fue emitida, enviada o todavía está esperando sincronización.</p></div></div><div class="invoice-legend"><span class="pending">Pendiente</span><span class="processing">Procesando</span><span class="issued">Emitida</span><span class="sent">Enviada</span></div><div class="invoice-list" id="member-invoice-list"></div>';
    document.querySelector(".progress-section")?.before(section);
    memberList = section.querySelector("#member-invoice-list");
    const link = document.createElement("a");
    link.href = "#mis-facturas";
    link.textContent = "▤ Mis facturas";
    document.querySelector(".member-side nav")?.append(link);
    const wait = setInterval(() => {
      if (window.MusikAuth?.user) {
        clearInterval(wait);
        loadMember();
      }
    }, 400);
    setTimeout(() => {
      clearInterval(wait);
      loadMember();
    }, 4000);
  }
})();

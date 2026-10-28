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
  const demoInvoices = [
    demo,
    {
      ...demo,
      id: "demo-pending",
      status: "pending",
      invoice_number: "",
      recipient_email: "lucia@musik.com",
      issued_at: null,
      payments: { amount_ars: 75000, provider: "mercadopago" },
      profiles: { full_name: "Lucía Martínez", email: "lucia@musik.com" },
    },
    {
      ...demo,
      id: "demo-sent",
      status: "sent",
      invoice_number: "00001-00000122",
      recipient_email: "nicolas@musik.com",
      sent_at: new Date(Date.now() - 86400000).toISOString(),
      payments: { amount_ars: 50000, provider: "mercadopago" },
      profiles: { full_name: "Nicolás Fernández", email: "nicolas@musik.com" },
    },
  ];
  const setupKey = "musik-arca-demo-setup";
  let arcaSetup = JSON.parse(localStorage.getItem(setupKey) || "null") || {
    connected: false,
    cuit: "",
    businessName: "MUSIK Academia",
    taxCondition: "monotributo",
    pointOfSale: "00001",
    invoiceType: "C",
    certificateStatus: "pending",
  };
  const saveSetup = () => localStorage.setItem(setupKey, JSON.stringify(arcaSetup));
  function downloadDemoInvoice(item) {
    const content = `<!doctype html><html lang="es"><meta charset="utf-8"><title>Factura demo ${item.invoice_number || "pendiente"}</title><style>body{font:15px Arial;color:#151515;max-width:760px;margin:45px auto;padding:30px}header{display:flex;justify-content:space-between;border-bottom:3px solid #00bac4;padding-bottom:20px}h1{margin:0}section{display:grid;grid-template-columns:1fr 1fr;gap:25px;margin:30px 0}.box{border:1px solid #ccc;border-radius:10px;padding:18px}.demo{padding:12px;background:#fff3cd;border:1px solid #ffe69c;text-align:center}footer{margin-top:35px;color:#666}</style><header><div><h1>MUSIK</h1><p>Academia de DJs y Productores</p></div><div><b>FACTURA ${item.invoice_type || "C"}</b><p>${item.invoice_number || "Pendiente"}</p></div></header><p class="demo"><b>COMPROBANTE DEMOSTRATIVO</b><br>No posee validez fiscal ni CAE real.</p><section><div class="box"><b>Cliente</b><p>${item.profiles?.full_name || "Alumno MUSIK"}<br>${item.recipient_email || item.profiles?.email || ""}</p></div><div class="box"><b>Operación</b><p>Curso o membresía MUSIK<br>Total: ${money(item.payments?.amount_ars)}</p></div></section><footer>Al conectar WSAA y Facturación Electrónica, este documento incluirá CAE, vencimiento y datos fiscales autorizados por ARCA.</footer><script>window.onload=()=>window.print()<\/script></html>`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function row(item, admin = false) {
    const sent = item.status === "sent",
      canSend = ["issued", "failed", "pending"].includes(item.status);
    return `<article class="invoice-row"><div class="invoice-mark">${item.invoice_type || "FC"}</div><div class="invoice-main"><small>${item.invoice_number || "COMPROBANTE PENDIENTE"}</small><h3>${admin ? item.profiles?.full_name || "Alumno MUSIK" : "Compra MUSIK"}</h3><p>${money(item.payments?.amount_ars)} · ${item.recipient_email || item.profiles?.email || "Email pendiente"}</p></div><span class="invoice-status ${item.status}"><i></i>${statusText[item.status] || item.status}</span><div class="invoice-meta"><small>${sent ? "ENVIADA" : "ÚLTIMA ACTUALIZACIÓN"}</small><strong>${date(item.sent_at || item.last_sync_at || item.issued_at || item.created_at)}</strong></div>${item.pdf_url ? `<a class="invoice-pdf" href="${item.pdf_url}" target="_blank" rel="noopener">Ver PDF ↗</a>` : ""}${canSend ? `<button class="invoice-send" data-send-invoice="${item.id}" ${item.demo ? 'data-demo="1"' : ""}>${item.status === "failed" ? "Reintentar" : "Enviar factura"} →</button>` : ""}</article>`;
  }
  async function send(button) {
    if (button.dataset.demo) {
      const item = demoInvoices.find((invoice) => invoice.id === button.dataset.sendInvoice) || demo;
      item.status = item.status === "pending" ? "issued" : "sent";
      item.invoice_number ||= "00001-00000124";
      item.issued_at ||= new Date().toISOString();
      if (item.status === "sent") item.sent_at = new Date().toISOString();
      notify(item.status === "sent" ? "Demo: factura marcada como enviada." : "Demo: ARCA devolvió un CAE simulado.");
      loadAdmin();
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
    if (!client || !user) return admin ? demoInvoices : [demoInvoices[2]];
    const query = client
      .from("billing_invoices")
      .select(
        "*,payments(amount_ars,provider,status),profiles(full_name,email)",
      )
      .order("created_at", { ascending: false });
    const { data, error } = admin
      ? await query
      : await query.eq("user_id", user.id);
    return error ? (admin ? demoInvoices : [demoInvoices[2]]) : data || [];
  }
  let adminList, memberList;
  async function loadAdmin() {
    const items = await fetchInvoices(true);
    adminList.innerHTML = items.length
      ? items.map((item) => row(item, true)).join("")
      : '<div class="invoice-empty"><strong>No hay facturas todavía.</strong><span>Se crearán automáticamente cuando se confirme un pago.</span></div>';
    bind(adminList);
    document.querySelector("#invoice-total").textContent = items.filter(
      () => true,
    ).length;
    document.querySelector("#invoice-pending").textContent = items.filter(
      (x) => x.status !== "sent",
    ).length;
    document.querySelector("#invoice-sent").textContent = items.filter(
      (x) => x.status === "sent",
    ).length;
    const state = document.querySelector("#arca-connection-state"),
      detail = document.querySelector("#arca-connection-detail"),
      badge = document.querySelector("#arca-status-badge");
    if (state) state.textContent = arcaSetup.connected ? "Conectado" : "Modo demostración";
    if (detail)
      detail.textContent = arcaSetup.connected
        ? `CUIT ${arcaSetup.cuit} · PV ${arcaSetup.pointOfSale} · Factura ${arcaSetup.invoiceType}`
        : "Sin credenciales reales. No se emiten comprobantes fiscales.";
    if (badge) {
      badge.textContent = arcaSetup.connected ? "CONEXIÓN VERIFICADA" : "ARCA NO CONECTADA";
      badge.classList.toggle("connected", arcaSetup.connected);
    }
    adminList.querySelectorAll(".invoice-row").forEach((rowElement, index) => {
      const item = items[index];
      if (!item?.demo) return;
      const button = document.createElement("button");
      button.className = "invoice-pdf";
      button.type = "button";
      button.textContent = "Vista previa ↗";
      button.onclick = () => downloadDemoInvoice(item);
      rowElement.append(button);
    });
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
      '<section class="arca-setup-card"><div><span class="kicker">INTEGRACIÓN FISCAL</span><h2 id="arca-connection-state">Modo demostración</h2><p id="arca-connection-detail">Sin credenciales reales. No se emiten comprobantes fiscales.</p><span class="arca-status" id="arca-status-badge">ARCA NO CONECTADA</span></div><ol><li><b>1</b> Completá los datos fiscales</li><li><b>2</b> Autorizá el certificado en ARCA</li><li><b>3</b> Verificá y activá la emisión</li></ol><button class="btn primary" id="configure-arca">Configurar ARCA →</button></section><div class="admin-stats"><article><span>Total de facturas</span><b id="invoice-total">—</b></article><article><span>Pendientes</span><b id="invoice-pending">—</b></article><article><span>Enviadas</span><b id="invoice-sent">—</b></article></div><section class="admin-card"><div class="admin-card-head"><div><h2>Facturación de ventas</h2><p>Controlá emisión, sincronización, comprobantes y envío al alumno.</p></div><div class="billing-actions"><button class="preview-link" id="billing-audit">Ver auditoría</button><button class="preview-link" id="refresh-invoices">Actualizar ↻</button></div></div><div class="demo-notice"><b>Entorno de prueba</b><span>Las operaciones que ves abajo son ficticias y no generan comprobantes fiscales reales.</span></div><div class="invoice-list" id="admin-invoice-list"></div></section>';
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
    view.querySelector("#billing-audit").onclick = () =>
      notify("Auditoría demo: configuración revisada y sin operaciones fiscales reales.");
    const dialog = document.createElement("dialog");
    dialog.className = "arca-dialog";
    dialog.innerHTML = `<button class="modal-close" type="button">×</button><span class="kicker">ASISTENTE SEGURO</span><h2>Conectar facturación ARCA</h2><p class="arca-security">MUSIK nunca solicita ni guarda la clave fiscal. El titular autoriza el certificado directamente en el sitio oficial de ARCA.</p><form id="arca-setup-form"><div class="arca-step"><b>01</b><div><h3>Datos del emisor</h3><p>Información que deberá validar el contador.</p></div></div><label>Razón social<input name="businessName" required value="${arcaSetup.businessName}"></label><div class="form-row"><label>CUIT<input name="cuit" inputmode="numeric" placeholder="30-00000000-0" value="${arcaSetup.cuit}"></label><label>Condición fiscal<select name="taxCondition"><option value="monotributo">Monotributo</option><option value="responsable_inscripto">Responsable inscripto</option><option value="exento">Exento</option></select></label></div><div class="form-row"><label>Punto de venta<input name="pointOfSale" inputmode="numeric" maxlength="5" value="${arcaSetup.pointOfSale}"></label><label>Comprobante<select name="invoiceType"><option value="C">Factura C</option><option value="B">Factura B</option><option value="A">Factura A</option></select></label></div><div class="arca-step"><b>02</b><div><h3>Autorización externa</h3><p>El cliente ingresa personalmente en ARCA y vincula el certificado al servicio de Facturación Electrónica.</p></div></div><a class="arca-external" href="https://auth.afip.gob.ar/contribuyente_/login.xhtml" target="_blank" rel="noopener">Abrir sitio oficial de ARCA ↗</a><label class="certificate-check"><input type="checkbox" name="authorized"> El titular confirma que completó la autorización</label><div class="arca-step"><b>03</b><div><h3>Verificación</h3><p>En producción, el servidor comprueba WSAA, punto de venta y último comprobante.</p></div></div><button class="btn primary" type="submit">Guardar configuración de prueba →</button><small>Esta versión guarda únicamente datos ficticios en este navegador. No cargues certificados ni claves reales.</small></form>`;
    document.body.append(dialog);
    dialog.querySelector(".modal-close").onclick = () => dialog.close();
    view.querySelector("#configure-arca").onclick = () => dialog.showModal();
    dialog.querySelector("[name=taxCondition]").value = arcaSetup.taxCondition;
    dialog.querySelector("[name=invoiceType]").value = arcaSetup.invoiceType;
    dialog.querySelector("#arca-setup-form").onsubmit = (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget),
        authorized = data.get("authorized") === "on";
      arcaSetup = {
        ...arcaSetup,
        businessName: data.get("businessName"),
        cuit: data.get("cuit"),
        taxCondition: data.get("taxCondition"),
        pointOfSale: data.get("pointOfSale"),
        invoiceType: data.get("invoiceType"),
        connected: authorized && Boolean(data.get("cuit")),
        certificateStatus: authorized ? "demo_verified" : "pending",
      };
      saveSetup();
      dialog.close();
      notify(arcaSetup.connected ? "Conexión demostrativa verificada." : "Configuración guardada. Falta la autorización.");
      loadAdmin();
    };
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

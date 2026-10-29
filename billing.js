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
    invoice_number: "00003-00000123",
    recipient_email: "alumno@musik.com",
    issued_at: new Date().toISOString(),
    sent_at: null,
    pdf_url: "",
    payments: { amount_ars: 22000, provider: "mercadopago" },
    profiles: { full_name: "Alumno MUSIK", email: "alumno@musik.com" },
    concept: "Membresía Pro Club · Octubre 2026",
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
      concept: "MUSIK Masterclass · Mezcla profesional",
    },
    {
      ...demo,
      id: "demo-sent",
      status: "sent",
      invoice_number: "00003-00000122",
      recipient_email: "nicolas@musik.com",
      sent_at: new Date(Date.now() - 86400000).toISOString(),
      payments: { amount_ars: 50000, provider: "mercadopago" },
      profiles: { full_name: "Nicolás Fernández", email: "nicolas@musik.com" },
      concept: "Curso DJ Profesional · Cuota 1",
    },
  ];
  const setupKey = "musik-arca-demo-setup";
  let arcaSetup = JSON.parse(localStorage.getItem(setupKey) || "null") || {
    connected: false,
    cuit: "",
    businessName: "MUSIK Academia",
    taxCondition: "monotributo",
    pointOfSale: "00003",
    invoiceType: "C",
    certificateStatus: "pending",
  };
  const saveSetup = () => localStorage.setItem(setupKey, JSON.stringify(arcaSetup));
  function downloadDemoInvoice(item) {
    const amount = money(item.payments?.amount_ars),
      logoUrl = new URL("assets/musik-logo-hd.png", location.href).href,
      invoiceNumber = item.invoice_number || "00003-00000001",
      issueDate = new Date(item.issued_at || Date.now()).toLocaleDateString("es-AR"),
      content = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Factura demo ${invoiceNumber}</title><style>:root{--cyan:#00dce6;--magenta:#c900ff;--ink:#090a0d;--muted:#6d727b}*{box-sizing:border-box}body{margin:0;background:#e9eaed;color:var(--ink);font:14px Arial,sans-serif}.toolbar{position:sticky;top:0;display:flex;justify-content:center;gap:10px;padding:14px;background:#101116;z-index:2}.toolbar button{border:0;border-radius:99px;padding:12px 20px;background:var(--cyan);font-weight:800;cursor:pointer}.sheet{width:min(850px,calc(100% - 24px));min-height:1120px;margin:30px auto;padding:46px;background:#fff;box-shadow:0 12px 50px #0002}.top{display:grid;grid-template-columns:1fr auto 1fr;gap:28px;align-items:start;padding-bottom:28px;border-bottom:1px solid #dfe1e5}.brand{display:flex;align-items:center;gap:14px}.brand img{width:82px;height:82px;object-fit:contain;background:#050507;border-radius:12px}.brand h1{margin:0;font-size:27px;letter-spacing:.18em}.brand p,.issuer p,.client p{margin:5px 0;color:var(--muted);line-height:1.5}.letter{display:grid;place-items:center;width:62px;height:62px;border:2px solid var(--ink);font-size:34px;font-weight:900}.invoice-title{text-align:right}.invoice-title h2{margin:0 0 7px;font-size:26px}.invoice-title strong{font-size:16px}.demo{margin:22px 0;padding:11px;border:1px solid #e4b94e;background:#fff8de;text-align:center;color:#76570d;font-size:12px;letter-spacing:.06em}.data{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:28px 0}.box{min-height:145px;padding:20px;border:1px solid #dfe1e5;border-radius:14px}.box small{color:#008b94;font-weight:800;letter-spacing:.12em}.box h3{margin:12px 0 7px;font-size:18px}.meta{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #dfe1e5;border-radius:12px;overflow:hidden}.meta div{padding:14px 18px;border-right:1px solid #dfe1e5}.meta div:last-child{border:0}.meta span{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.1em}.meta b{display:block;margin-top:6px}.items{width:100%;margin:30px 0;border-collapse:collapse}.items th{padding:14px;background:var(--ink);color:#fff;text-align:left;font-size:11px;letter-spacing:.1em}.items td{padding:19px 14px;border-bottom:1px solid #dfe1e5}.items th:last-child,.items td:last-child{text-align:right}.totals{display:grid;grid-template-columns:1fr 300px;gap:30px;align-items:start}.payment{padding:18px;border-left:4px solid var(--cyan);background:#f3fbfc}.payment b{display:block;margin-bottom:6px}.total{padding:22px;border-radius:14px;background:var(--ink);color:#fff}.total div{display:flex;justify-content:space-between;align-items:center}.total strong{font-size:28px;color:var(--cyan)}.fiscal{display:grid;grid-template-columns:1fr 110px;gap:24px;align-items:center;margin-top:50px;padding-top:24px;border-top:1px solid #dfe1e5}.fiscal p{margin:5px 0;color:var(--muted)}.qr{display:grid;place-items:center;width:105px;height:105px;background:repeating-conic-gradient(#111 0 25%,#fff 0 50%) 0/18px 18px;border:9px solid #fff;outline:1px solid #bbb;font-size:0}.foot{margin-top:30px;text-align:center;color:#8a8e95;font-size:11px}.accent{height:6px;margin-top:30px;background:linear-gradient(90deg,var(--cyan),#286cff,var(--magenta))}@media(max-width:650px){.sheet{padding:24px}.top{grid-template-columns:1fr auto}.invoice-title{grid-column:1/-1;text-align:left}.data,.totals{grid-template-columns:1fr}.meta{grid-template-columns:1fr}.meta div{border-right:0;border-bottom:1px solid #dfe1e5}.fiscal{grid-template-columns:1fr}.qr{display:none}}@media print{body{background:#fff}.toolbar{display:none}.sheet{width:100%;min-height:auto;margin:0;padding:25px;box-shadow:none}}</style></head><body><div class="toolbar"><button onclick="window.print()">Imprimir / Guardar PDF</button></div><main class="sheet"><section class="top"><div class="brand"><img src="${logoUrl}" alt="MUSIK"><div><h1>MUSIK</h1><p>Academia de DJs y Productores</p></div></div><div class="letter">${item.invoice_type || "C"}</div><div class="invoice-title"><h2>FACTURA ${item.invoice_type || "C"}</h2><strong>N.º ${invoiceNumber}</strong><p>Fecha: ${issueDate}</p></div></section><div class="demo"><b>COMPROBANTE DEMOSTRATIVO · SIN VALIDEZ FISCAL</b></div><section class="data"><div class="box issuer"><small>EMISOR</small><h3>MUSIK Academia</h3><p>CUIT: 30-00000000-0<br>Condición fiscal: Monotributo<br>Buenos Aires, Argentina</p></div><div class="box client"><small>ALUMNO</small><h3>${item.profiles?.full_name || "Alumno MUSIK"}</h3><p>${item.recipient_email || item.profiles?.email || ""}<br>Consumidor final<br>DNI: —</p></div></section><section class="meta"><div><span>Punto de venta</span><b>00003 · MUSIK WEB</b></div><div><span>Forma de pago</span><b>Mercado Pago</b></div><div><span>Estado</span><b>Pagado</b></div></section><table class="items"><thead><tr><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody><tr><td><b>${item.concept || "Curso o membresía MUSIK"}</b><br><small>Acceso y contenidos digitales</small></td><td>1</td><td>${amount}</td><td>${amount}</td></tr></tbody></table><section class="totals"><div class="payment"><b>Pago confirmado</b>Operación procesada mediante Mercado Pago. El acceso se acredita al confirmarse el cobro.</div><div class="total"><div><span>TOTAL</span><strong>${amount}</strong></div></div></section><section class="fiscal"><div><b>CAE: DEMO-NO-VÁLIDO</b><p>Vencimiento CAE: —</p><p>En producción, ARCA incorporará aquí el CAE, vencimiento y código QR fiscal correspondiente.</p></div><div class="qr">QR DEMO</div></section><div class="foot">Este diseño es una muestra visual para validación del cliente. No reemplaza un comprobante autorizado por ARCA.</div><div class="accent"></div></main></body></html>`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function row(item, admin = false) {
    const sent = item.status === "sent",
      canSend = ["issued", "failed", "pending"].includes(item.status);
    return `<article class="invoice-row"><div class="invoice-mark">${item.invoice_type || "FC"}</div><div class="invoice-main"><small>${item.invoice_number || "COMPROBANTE PENDIENTE"}</small><h3>${admin ? item.profiles?.full_name || "Alumno MUSIK" : item.concept || "Compra MUSIK"}</h3><p>${money(item.payments?.amount_ars)} · ${item.recipient_email || item.profiles?.email || "Email pendiente"}</p></div><span class="invoice-status ${item.status}"><i></i>${statusText[item.status] || item.status}</span><div class="invoice-meta"><small>${sent ? "ENVIADA" : "ÚLTIMA ACTUALIZACIÓN"}</small><strong>${date(item.sent_at || item.last_sync_at || item.issued_at || item.created_at)}</strong></div>${item.pdf_url ? `<a class="invoice-pdf" href="${item.pdf_url}" target="_blank" rel="noopener">Ver PDF ↗</a>` : ""}${canSend ? `<button class="invoice-send" data-send-invoice="${item.id}" ${item.demo ? 'data-demo="1"' : ""}>${item.status === "failed" ? "Reintentar" : "Enviar factura"} →</button>` : ""}</article>`;
  }
  async function send(button) {
    if (button.dataset.demo) {
      const item = demoInvoices.find((invoice) => invoice.id === button.dataset.sendInvoice) || demo;
      item.status = item.status === "pending" ? "issued" : "sent";
      item.invoice_number ||= "00003-00000124";
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
    if (error || !data?.length) return admin ? demoInvoices : [demoInvoices[2]];
    return data;
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
        ? `Facturación automática habilitada para ${arcaSetup.businessName}.`
        : "Completá una configuración guiada antes de emitir facturas.";
    if (badge) {
      badge.textContent = arcaSetup.connected ? "LISTO PARA FACTURAR" : "FALTA CONECTAR";
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
    memberList.querySelectorAll(".invoice-row").forEach((rowElement, index) => {
      const item = items[index];
      if (!item?.demo) return;
      const button = document.createElement("button");
      button.className = "invoice-pdf invoice-preview-member";
      button.type = "button";
      button.textContent = "Ver factura de ejemplo ↗";
      button.onclick = () => downloadDemoInvoice(item);
      rowElement.append(button);
    });
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
      '<section class="arca-setup-card"><div><span class="kicker">FACTURACIÓN</span><h2 id="arca-connection-state">Modo demostración</h2><p id="arca-connection-detail">Completá una configuración guiada antes de emitir facturas.</p><span class="arca-status" id="arca-status-badge">FALTA CONECTAR</span></div><div class="arca-simple-copy"><strong>Configuración única</strong><span>Ingresá los datos de MUSIK y confirmá la conexión. Después, las facturas se procesan automáticamente.</span></div><button class="btn primary" id="configure-arca">Conectar facturación →</button></section><div class="admin-stats"><article><span>Total de facturas</span><b id="invoice-total">—</b></article><article><span>Pendientes</span><b id="invoice-pending">—</b></article><article><span>Enviadas</span><b id="invoice-sent">—</b></article></div><section class="admin-card"><div class="admin-card-head"><div><h2>Facturas</h2><p>Revisá, enviá o reintentá un comprobante.</p></div><button class="preview-link" id="refresh-invoices">Actualizar ↻</button></div><div class="demo-notice"><b>Versión de muestra</b><span>Estas facturas son ficticias y no tienen validez fiscal.</span></div><div class="invoice-list" id="admin-invoice-list"></div></section>';
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
    const dialog = document.createElement("dialog");
    dialog.className = "arca-dialog";
    dialog.innerHTML = `<button class="modal-close" type="button">×</button><span class="kicker">CONFIGURACIÓN ÚNICA</span><h2>Activar facturación</h2><p class="arca-security">Tu clave fiscal se ingresa solamente en ARCA. MUSIK no puede verla ni guardarla.</p><form id="arca-setup-form"><div class="arca-step"><b>1</b><div><h3>Datos de MUSIK</h3><p>Completá los datos fiscales de la academia.</p></div></div><label>Razón social<input name="businessName" required value="${arcaSetup.businessName}"></label><div class="form-row"><label>CUIT<input name="cuit" inputmode="numeric" required placeholder="30-00000000-0" value="${arcaSetup.cuit}"></label><label>Condición fiscal<select name="taxCondition"><option value="monotributo">Monotributo</option><option value="responsable_inscripto">Responsable inscripto</option><option value="exento">Exento</option></select></label></div><div class="arca-step"><b>2</b><div><h3>Punto de venta</h3><p>Elegí el punto exclusivo que el contador habilite para la web.</p></div></div><label>Punto de venta<select name="pointOfSale"><option value="00003">00003 · MUSIK WEB (recomendado)</option><option value="00001">00001 · Facturación general</option></select></label><input type="hidden" name="invoiceType" value="${arcaSetup.invoiceType}"><div class="arca-step"><b>3</b><div><h3>Confirmar en ARCA</h3><p>Abrí ARCA, completá la autorización indicada y regresá a esta pantalla.</p></div></div><a class="arca-external" href="https://auth.afip.gob.ar/contribuyente_/login.xhtml" target="_blank" rel="noopener">Continuar en ARCA ↗</a><label class="certificate-check"><input type="checkbox" name="authorized" required> Ya completé la autorización</label><button class="btn primary" type="submit">Verificar y finalizar →</button><small>En esta demostración la lista de puntos de venta es simulada. En producción se consultará directamente a ARCA.</small></form>`;
    document.body.append(dialog);
    dialog.querySelector(".modal-close").onclick = () => dialog.close();
    view.querySelector("#configure-arca").onclick = () => dialog.showModal();
    dialog.querySelector("[name=taxCondition]").value = arcaSetup.taxCondition;
    dialog.querySelector("[name=pointOfSale]").value = arcaSetup.pointOfSale;
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

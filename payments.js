(() => {
  const toast = document.querySelector(".toast");
  let selectedButton = null;
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "payment-profile.css?v=1";
  document.head.appendChild(style);
  const dialog = document.createElement("dialog");
  dialog.id = "checkout-profile-dialog";
  dialog.innerHTML = `<button class="modal-close checkout-profile-close" aria-label="Cerrar">×</button><span class="kicker">DATOS DEL ALUMNO</span><h2>Completá tu ficha</h2><p>Los necesitamos para registrar tu compra, habilitar tu acceso y emitir el comprobante correspondiente.</p><form id="checkout-profile-form"><div class="checkout-product" id="checkout-product"></div><div class="checkout-grid"><label>Nombre completo<input name="full_name" required maxlength="100" autocomplete="name"></label><label>Email<input name="email" type="email" readonly></label><label>Teléfono<input name="phone" type="tel" required maxlength="40" autocomplete="tel"></label><label>DNI / documento<input name="document_number" required maxlength="30" inputmode="numeric"></label><label>Fecha de nacimiento<input name="birth_date" type="date"></label><label>Domicilio<input name="address" required maxlength="180" autocomplete="street-address"></label><label class="checkout-full">Contacto de emergencia <small>Opcional</small><input name="emergency_contact" maxlength="120" placeholder="Nombre y teléfono"></label></div><label class="checkout-consent"><input name="consent" type="checkbox" required><span>Confirmo que los datos son correctos y autorizo su uso para gestionar mi inscripción, acceso y facturación.</span></label><button class="btn primary" type="submit">Continuar a Mercado Pago →</button></form>`;
  document.body.appendChild(dialog);
  const form = dialog.querySelector("form");
  function message(text) {
    if (toast) {
      toast.textContent = text;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 3500);
    } else alert(text);
  }
  async function openCheckout(button) {
    if (!window.MUSIK_AUTH_CONFIG?.paymentsEnabled)
      return message("La pasarela está preparada. Se habilitará al conectar la cuenta comercial de Mercado Pago.");
    if (!window.MusikAuth?.configured) return message("Falta conectar Supabase.");
    if (!window.MusikAuth.user) {
      document.querySelector("#member-modal,#member-dialog")?.showModal();
      return message("Ingresá o registrate para continuar con el pago.");
    }
    selectedButton = button;
    const user = window.MusikAuth.user, meta = user.user_metadata || {};
    form.elements.email.value = user.email || "";
    form.elements.full_name.value = meta.full_name || meta.name || "";
    document.querySelector("#checkout-product").innerHTML = `<small>${button.dataset.checkoutKind === "course" ? "CURSO" : "MEMBRESÍA"}</small><strong>${button.dataset.checkoutSku}</strong>`;
    const { data } = await window.MusikAuth.client.from("profiles").select("full_name,phone,document_number,birth_date,address,emergency_contact").eq("id", user.id).maybeSingle();
    if (data) ["full_name","phone","document_number","birth_date","address","emergency_contact"].forEach((key) => { if (data[key]) form.elements[key].value = data[key]; });
    dialog.showModal();
  }
  async function checkout(profile) {
    const button = selectedButton;
    if (!button) return;
    const original = button.textContent, submit = form.querySelector('button[type="submit"]');
    button.disabled = true;
    submit.disabled = true;
    submit.textContent = "Guardando ficha…";
    try {
      const { data, error } = await window.MusikAuth.client.functions.invoke("create-checkout", { body: { kind: button.dataset.checkoutKind, sku: button.dataset.checkoutSku, profile } });
      if (error) throw error;
      if (!data?.checkout_url) throw new Error(data?.error || "No se pudo iniciar el pago.");
      submit.textContent = "Abriendo Mercado Pago…";
      location.href = data.checkout_url;
    } catch (error) {
      message(error.message || "No pudimos iniciar Mercado Pago.");
      button.disabled = false;
      button.textContent = original;
      submit.disabled = false;
      submit.textContent = "Continuar a Mercado Pago →";
    }
  }
  form.onsubmit = (event) => {
    event.preventDefault();
    const values = new FormData(form);
    checkout({ full_name:String(values.get("full_name")||"").trim(),phone:String(values.get("phone")||"").trim(),document_number:String(values.get("document_number")||"").trim(),birth_date:String(values.get("birth_date")||"")||null,address:String(values.get("address")||"").trim(),emergency_contact:String(values.get("emergency_contact")||"").trim()||null });
  };
  dialog.querySelector(".checkout-profile-close").onclick = () => dialog.close();
  document.querySelectorAll("[data-checkout-kind]").forEach((button) => (button.onclick = () => openCheckout(button)));
})();

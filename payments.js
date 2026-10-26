(() => {
  const toast = document.querySelector(".toast");
  function message(text) {
    if (toast) {
      toast.textContent = text;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 3500);
    } else alert(text);
  }
  async function checkout(button) {
    if (!window.MUSIK_AUTH_CONFIG?.paymentsEnabled)
      return message(
        "La pasarela está preparada. Se habilitará al conectar la cuenta comercial de Mercado Pago.",
      );
    if (!window.MusikAuth?.configured)
      return message("Falta conectar Supabase.");
    if (!window.MusikAuth.user) {
      document.querySelector("#member-modal,#member-dialog")?.showModal();
      return message("Ingresá o registrate para continuar con el pago.");
    }
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "Abriendo Mercado Pago…";
    try {
      const { data, error } = await window.MusikAuth.client.functions.invoke(
        "create-checkout",
        {
          body: {
            kind: button.dataset.checkoutKind,
            sku: button.dataset.checkoutSku,
          },
        },
      );
      if (error) throw error;
      if (!data?.checkout_url)
        throw new Error(data?.error || "No se pudo iniciar el pago.");
      location.href = data.checkout_url;
    } catch (error) {
      message(error.message || "No pudimos iniciar Mercado Pago.");
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }
  document
    .querySelectorAll("[data-checkout-kind]")
    .forEach((button) => (button.onclick = () => checkout(button)));
})();

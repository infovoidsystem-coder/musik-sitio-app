(() => {
  const gate = document.querySelector("#admin-access");
  const gateStatus = document.querySelector("#admin-access-status");
  const loginForm = document.querySelector("#admin-login-form");
  const resetForm = document.querySelector("#admin-reset-form");
  const timeout = (promise, milliseconds = 12000) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Authentication timeout")), milliseconds),
      ),
    ]);
  const friendlyError = (error) => {
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("invalid login credentials"))
      return "Email o contraseña incorrectos.";
    if (
      message.includes("failed to fetch") ||
      message.includes("network") ||
      message.includes("timeout")
    )
      return "El servicio de acceso administrativo no está disponible. No es un problema de tu contraseña.";
    return error?.message || "No pudimos verificar el acceso administrativo.";
  };

  if (loginForm) loginForm.noValidate = true;
  if (loginForm?.email && !loginForm.email.value)
    loginForm.email.value = window.MUSIK_AUTH_CONFIG?.adminEmail || "";

  const showGate = (message) => {
    document.body.classList.add("admin-locked");
    gate?.removeAttribute("hidden");
    if (gateStatus)
      gateStatus.textContent =
        message || "Ingresá con el email administrativo registrado.";
  };
  const deny = (message) => showGate(message);

  const run = async () => {
    const auth = window.MusikAuth;
    if (!auth?.configured || !auth.client) {
      showGate("Falta conectar Supabase para habilitar el acceso administrativo.");
      return;
    }
    const {
      data: { session },
    } = await timeout(auth.client.auth.getSession());
    if (new URLSearchParams(location.search).get("reset") === "1") {
      showGate("Elegí una contraseña nueva para la cuenta administrativa.");
      loginForm.hidden = true;
      resetForm.hidden = false;
      return;
    }
    if (!session) {
      showGate();
      return;
    }
    const { data, error } = await timeout(
      auth.client.from("profiles").select("role").eq("id", session.user.id).single(),
    );
    if (error || data?.role !== "admin") {
      deny("Esta cuenta no tiene permisos de administración.");
      return;
    }
    gate?.setAttribute("hidden", "");
    document.body.classList.remove("admin-locked");
  };

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(loginForm);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    if (!email) {
      showGate("Escribí el email administrativo.");
      loginForm.email.focus();
      return;
    }
    if (!password) {
      showGate("Escribí la contraseña administrativa.");
      loginForm.password.focus();
      return;
    }
    if (gateStatus) gateStatus.textContent = "Verificando credenciales…";
    try {
      await timeout(window.MusikAuth.signInPassword(email, password));
      await run();
    } catch (error) {
      showGate(friendlyError(error));
    }
  });

  document.querySelector("#admin-forgot-password")?.addEventListener("click", async () => {
    const email = String(new FormData(loginForm).get("email") || "").trim();
    if (!email) {
      showGate("Escribí primero el email administrativo.");
      loginForm.email.focus();
      return;
    }
    if (gateStatus) gateStatus.textContent = "Enviando correo de recuperación…";
    try {
      await timeout(window.MusikAuth.sendPasswordReset(email));
      showGate(`Enviamos las instrucciones a ${email}.`);
    } catch (error) {
      showGate(friendlyError(error));
    }
  });

  resetForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(resetForm);
    const password = String(form.get("password"));
    const confirmation = String(form.get("confirmation"));
    if (password !== confirmation) {
      showGate("Las contraseñas no coinciden.");
      return;
    }
    try {
      await timeout(window.MusikAuth.updatePassword(password));
      history.replaceState({}, "", new URL("admin.html", location.href));
      loginForm.hidden = false;
      resetForm.hidden = true;
      await run();
    } catch (error) {
      showGate(friendlyError(error));
    }
  });

  document.querySelector("#admin-logout")?.addEventListener("click", async () => {
    const button = document.querySelector("#admin-logout");
    button.disabled = true;
    button.textContent = "Cerrando…";
    try {
      await window.MusikAuth.signOut();
    } finally {
      location.replace("admin.html");
    }
  });

  run().catch((error) => deny(friendlyError(error)));
})();

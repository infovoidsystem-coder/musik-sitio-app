(() => {
  const cfg = window.MUSIK_AUTH_CONFIG || {};
  const configured =
    /^https:\/\/.+\.supabase\.co$/.test(cfg.supabaseUrl || "") &&
    !String(cfg.supabaseAnonKey || "").startsWith("TU_");
  const client =
    configured && window.supabase
      ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        })
      : null;
  const api = { configured, client, user: null };
  const adminRequested =
    new URLSearchParams(location.search).get("admin") === "1" ||
    sessionStorage.getItem("musik-admin-login") === "1";
  function paint(user) {
    api.user = user || null;
    document.body.classList.toggle("authenticated", !!user);
    if (user && adminRequested && !location.pathname.endsWith("/admin.html")) {
      sessionStorage.removeItem("musik-admin-login");
      location.replace("admin.html");
      return;
    }
    const box = document.querySelector("#member-session"),
      login = document.querySelector("#google-login"),
      form = document.querySelector("#club-register"),
      help = document.querySelector("#auth-help");
    if (!box) return;
    if (user) {
      const meta = user.user_metadata || {},
        name = meta.full_name || meta.name || user.email.split("@")[0];
      box.hidden = false;
      if (login) login.hidden = true;
      if (form) form.hidden = true;
      document.querySelector("#member-name").textContent = name;
      document.querySelector("#member-email").textContent = user.email;
      document.querySelector("#member-avatar").src =
        meta.avatar_url || meta.picture || "assets/musik-logo-hd.png";
      document
        .querySelectorAll("[data-member]")
        .forEach(
          (b) => (b.firstChild.textContent = "Ingresar al panel "),
        );
      help.textContent =
        "Tu sesión está protegida y se mantiene activa en este dispositivo.";
    } else {
      box.hidden = true;
      if (login) login.hidden = false;
      if (form) form.hidden = false;
      help.textContent = configured
        ? "Ingresá con la cuenta asociada a tu membresía."
        : "Falta agregar la URL y la clave pública de Supabase en auth-config.js.";
    }
  }
  api.signInGoogle = async () => {
    if (!client) return false;
    if (adminRequested) sessionStorage.setItem("musik-admin-login", "1");
    const redirectTo = new URL("club.html", location.href).href;
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
    return true;
  };
  api.signInPassword = async (email, password) => {
    if (!client) return false;
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    paint(data.user);
    return data;
  };
  api.signUpPassword = async (name, email, password) => {
    if (!client) return false;
    const redirectTo = new URL("club.html#planes", location.href).href;
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo, data: { full_name: name } },
    });
    if (error) throw error;
    paint(data.user);
    return data;
  };
  api.sendPasswordReset = async (email) => {
    if (!client) return false;
    const redirectTo = new URL("admin.html?reset=1", location.href).href;
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
    return true;
  };
  api.updatePassword = async (password) => {
    if (!client) return false;
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
    return true;
  };
  api.signOut = async () => {
    if (client) await client.auth.signOut();
    paint(null);
  };
  if (client) {
    client.auth.getSession().then(({ data }) => paint(data.session?.user));
    client.auth.onAuthStateChange((_event, session) => paint(session?.user));
  } else document.addEventListener("DOMContentLoaded", () => paint(null));
  window.MusikAuth = api;
})();

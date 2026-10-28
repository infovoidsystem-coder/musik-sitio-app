(() => {
  if (document.querySelector(".whatsapp-float")) return;
  const link = document.createElement("a");
  link.className = "whatsapp-float";
  link.href =
    "https://wa.me/5491154190480?text=Hola%20MUSIK%2C%20quiero%20hacer%20una%20consulta.";
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("aria-label", "Consultar a MUSIK por WhatsApp");
  link.innerHTML =
    '<span class="whatsapp-tooltip"><strong>¿Necesitás ayuda?</strong><small>Escribinos por WhatsApp</small></span><span class="whatsapp-button" aria-hidden="true"><svg viewBox="0 0 32 32"><path fill="currentColor" d="M16.04 3A12.9 12.9 0 0 0 5 22.55L3.28 29l6.6-1.73A12.95 12.95 0 1 0 16.04 3Zm0 23.7a10.7 10.7 0 0 1-5.46-1.5l-.39-.23-3.91 1.03 1.04-3.82-.25-.4A10.75 10.75 0 1 1 16.04 26.7Zm5.9-8.05c-.32-.16-1.91-.94-2.21-1.05-.3-.11-.51-.16-.73.16-.22.32-.84 1.05-1.03 1.27-.19.22-.38.24-.7.08-.33-.16-1.37-.5-2.61-1.61-.97-.86-1.62-1.92-1.81-2.24-.19-.32-.02-.5.14-.66.15-.14.33-.38.49-.57.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.56-.08-.16-.73-1.75-1-2.4-.26-.63-.53-.55-.73-.56h-.62c-.22 0-.57.08-.87.4-.3.33-1.14 1.12-1.14 2.72 0 1.6 1.17 3.15 1.33 3.37.16.21 2.3 3.51 5.57 4.92.78.34 1.39.54 1.86.69.78.25 1.49.21 2.05.13.63-.1 1.92-.79 2.19-1.55.27-.76.27-1.41.19-1.55-.08-.14-.3-.22-.62-.38Z"/></svg></span>';
  document.body.append(link);
})();

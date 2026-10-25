(()=>{
  const gate=document.querySelector('#admin-access');
  const gateStatus=document.querySelector('#admin-access-status');
  const loginForm=document.querySelector('#admin-login-form');
  const resetForm=document.querySelector('#admin-reset-form');
  const showGate=message=>{
    document.body.classList.add('admin-locked');
    gate?.removeAttribute('hidden');
    if(gateStatus)gateStatus.textContent=message||'Ingresá con el email administrativo registrado.';
  };
  const deny=message=>{
    showGate(message);
  };
  const run=async()=>{
    const auth=window.MusikAuth;
    if(!auth?.configured||!auth.client){showGate('Falta conectar Supabase para habilitar el acceso administrativo.');return}
    const {data:{session}}=await auth.client.auth.getSession();
    if(new URLSearchParams(location.search).get('reset')==='1'){
      showGate('Elegí una contraseña nueva para la cuenta administrativa.');
      loginForm.hidden=true;resetForm.hidden=false;return;
    }
    if(!session){showGate();return}
    const {data,error}=await auth.client.from('profiles').select('role').eq('id',session.user.id).single();
    if(error||data?.role!=='admin'){deny('Esta cuenta no tiene permisos de administración.');return}
    gate?.setAttribute('hidden','');
    document.body.classList.remove('admin-locked');
  };
  loginForm?.addEventListener('submit',async event=>{event.preventDefault();const form=new FormData(loginForm);if(gateStatus)gateStatus.textContent='Verificando credenciales…';try{await window.MusikAuth.signInPassword(String(form.get('email')).trim(),String(form.get('password')));await run()}catch(_error){showGate('Email o contraseña incorrectos.')}});
  document.querySelector('#admin-forgot-password')?.addEventListener('click',async()=>{const email=String(new FormData(loginForm).get('email')||'').trim();if(!email){showGate('Escribí primero el email administrativo.');loginForm.email.focus();return}if(gateStatus)gateStatus.textContent='Enviando correo de recuperación…';try{await window.MusikAuth.sendPasswordReset(email);showGate(`Enviamos las instrucciones a ${email}.`)}catch(_error){showGate('No pudimos enviar el correo. Revisá el email e intentá nuevamente.')}});
  resetForm?.addEventListener('submit',async event=>{event.preventDefault();const form=new FormData(resetForm),password=String(form.get('password')),confirmation=String(form.get('confirmation'));if(password!==confirmation){showGate('Las contraseñas no coinciden.');return}try{await window.MusikAuth.updatePassword(password);history.replaceState({},'',new URL('admin.html',location.href));loginForm.hidden=false;resetForm.hidden=true;await run()}catch(_error){showGate('No pudimos actualizar la contraseña. Pedí un nuevo enlace.')}});
  run().catch(()=>deny('No pudimos verificar los permisos de administración.'));
})();

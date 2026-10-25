(()=>{
  const gate=document.querySelector('#admin-access');
  const gateStatus=document.querySelector('#admin-access-status');
  const showGate=message=>{
    document.body.classList.add('admin-locked');
    gate?.removeAttribute('hidden');
    if(gateStatus)gateStatus.textContent=message||'Ingresá con la cuenta Google autorizada como administradora.';
  };
  const deny=message=>{
    showGate(message);
  };
  const run=async()=>{
    const auth=window.MusikAuth;
    if(!auth?.configured||!auth.client){showGate('Falta conectar Supabase para habilitar el acceso administrativo.');return}
    const {data:{session}}=await auth.client.auth.getSession();
    if(!session){showGate();return}
    const {data,error}=await auth.client.from('profiles').select('role').eq('id',session.user.id).single();
    if(error||data?.role!=='admin'){deny('Esta cuenta no tiene permisos de administración.');return}
    gate?.setAttribute('hidden','');
    document.body.classList.remove('admin-locked');
  };
  document.querySelector('#admin-google-login')?.addEventListener('click',async()=>{
    sessionStorage.setItem('musik-admin-login','1');
    if(gateStatus)gateStatus.textContent='Abriendo el acceso seguro de Google…';
    try{await window.MusikAuth.signInGoogle()}catch(_error){showGate('No pudimos iniciar sesión. Intentá nuevamente.')}
  });
  run().catch(()=>deny('No pudimos verificar los permisos de administración.'));
})();

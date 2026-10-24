(()=>{
  const deny=message=>{
    sessionStorage.setItem('musik-access-message',message);
    location.replace('member.html');
  };
  const run=async()=>{
    const auth=window.MusikAuth;
    if(!auth?.configured||!auth.client){location.replace('club.html?admin=1');return}
    const {data:{session}}=await auth.client.auth.getSession();
    if(!session){location.replace('club.html?admin=1');return}
    const {data,error}=await auth.client.from('profiles').select('role').eq('id',session.user.id).single();
    if(error||data?.role!=='admin'){deny('Esta cuenta no tiene permisos de administración.');return}
    document.body.classList.remove('admin-locked');
  };
  run().catch(()=>deny('No pudimos verificar los permisos de administración.'));
})();

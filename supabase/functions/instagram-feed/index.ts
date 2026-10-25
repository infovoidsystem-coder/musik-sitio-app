const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async(request)=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  try{
    const token=Deno.env.get('INSTAGRAM_ACCESS_TOKEN');
    const userId=Deno.env.get('INSTAGRAM_USER_ID');
    if(!token||!userId)throw new Error('Instagram secrets are not configured');
    const fields='id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const url=new URL(`https://graph.instagram.com/v22.0/${userId}/media`);
    url.searchParams.set('fields',fields);
    url.searchParams.set('limit','6');
    url.searchParams.set('access_token',token);
    const response=await fetch(url,{headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error(`Instagram API returned ${response.status}`);
    const payload=await response.json();
    return new Response(JSON.stringify({posts:payload.data||[]}),{headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'public, max-age=600'}});
  }catch(error){
    return new Response(JSON.stringify({error:error instanceof Error?error.message:'Unknown error'}),{status:503,headers:{...corsHeaders,'Content-Type':'application/json'}});
  }
});

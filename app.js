const modal=document.querySelector('#member-modal');
document.querySelectorAll('[data-open-modal]').forEach(btn=>btn.addEventListener('click',()=>modal.showModal()));
document.querySelector('.modal-close').addEventListener('click',()=>modal.close());
modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
document.querySelector('.join-link').addEventListener('click',()=>modal.close());

const toast=document.querySelector('.toast');let toastTimer;
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2800)}
document.querySelectorAll('[data-toast]').forEach(btn=>btn.addEventListener('click',()=>showToast(btn.dataset.toast)));
document.querySelector('#login-form').addEventListener('submit',async e=>{e.preventDefault();const fields=e.currentTarget.elements,button=e.currentTarget.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Ingresando…';try{if(!window.MusikAuth?.configured)throw new Error('Falta conectar Supabase.');await window.MusikAuth.signInPassword(fields[0].value.trim(),fields[1].value);modal.close();showToast('Sesión iniciada. Ya podés descargar ✓');loadPublicDownloads()}catch(error){showToast(error.message==='Invalid login credentials'?'Email o contraseña incorrectos.':error.message||'No pudimos iniciar sesión.')}finally{button.disabled=false;button.textContent='Ingresar →'}});

document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.media-card').forEach(card=>card.classList.toggle('hidden',btn.dataset.filter!=='all'&&card.dataset.type!==btn.dataset.filter))}));

document.querySelectorAll('[data-cycle]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-cycle]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const annual=btn.dataset.cycle==='annual';document.querySelectorAll('[data-price]').forEach(p=>{const monthly=Number(p.dataset.price);p.innerHTML=`$${(annual?monthly*10:monthly).toLocaleString('es-AR')}<small>/${annual?'año':'mes'}</small>`})}));

document.querySelectorAll('[data-play],.round-play').forEach(btn=>btn.addEventListener('click',()=>{btn.textContent=btn.textContent==='Ⅱ'?'▶':'Ⅱ';btn.closest('.visual-card')?.classList.toggle('playing',btn.textContent==='Ⅱ');showToast(btn.textContent==='Ⅱ'?'Reproduciendo preview':'Preview en pausa')}));

const navLinks=[...document.querySelectorAll('.desktop-nav a,.mobile-nav a')];
const sections=[...document.querySelectorAll('main section[id]')];
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${entry.target.id}`))}}),{rootMargin:'-35% 0px -60%'});sections.forEach(s=>observer.observe(s));

const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');reveal.unobserve(entry.target)}}),{threshold:.12});
document.querySelectorAll('.media-card,.event-list article').forEach((el,i)=>{el.style.transitionDelay=`${(i%3)*90}ms`;reveal.observe(el)});

const glow=document.querySelector('.cursor-glow');
window.addEventListener('pointermove',e=>{glow.style.left=`${e.clientX}px`;glow.style.top=`${e.clientY}px`},{passive:true});
const tilt=document.querySelector('[data-tilt]');
if(tilt){tilt.addEventListener('pointermove',e=>{const r=tilt.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;tilt.style.transform=`perspective(900px) rotateX(${-y*8}deg) rotateY(${x*9}deg) rotateZ(2deg)`});tilt.addEventListener('pointerleave',()=>tilt.style.transform='perspective(900px) rotate(2deg)')}

const persona=document.querySelector('.hernan-portrait'),personaSwitch=document.querySelector('.persona-switch');let grooveMode=false,personaTimer;
function setPersona(next){grooveMode=next;persona.classList.add('transforming');persona.classList.toggle('groove-mode',grooveMode);personaSwitch.setAttribute('aria-pressed',String(grooveMode));clearTimeout(personaSwitch._flash);personaSwitch._flash=setTimeout(()=>persona.classList.remove('transforming'),900)}
function restartPersona(){clearInterval(personaTimer);personaTimer=setInterval(()=>setPersona(!grooveMode),7000)}
if(persona&&personaSwitch){personaSwitch.addEventListener('click',()=>{setPersona(!grooveMode);restartPersona()});restartPersona()}

/* Navegación inspirada en el fader TEMPO/PITCH de una cabina profesional. */
const tempoScroll=document.createElement('div');tempoScroll.className='tempo-scroll';tempoScroll.setAttribute('aria-hidden','true');tempoScroll.innerHTML='<span class="tempo-plus">+10</span><b>TEMPO</b><i class="tempo-zero">0</i><span class="tempo-minus">-10</span><div class="tempo-rail"><u></u></div>';document.body.appendChild(tempoScroll);const tempoHandle=tempoScroll.querySelector('u'),tempoRail=tempoScroll.querySelector('.tempo-rail');let tempoDragging=false;function syncTempoScroll(){const range=Math.max(1,document.documentElement.scrollHeight-innerHeight),ratio=Math.min(1,scrollY/range),travel=Math.max(0,tempoRail.clientHeight-tempoHandle.offsetHeight);tempoHandle.style.transform=`translateY(${ratio*travel}px)`}function setScrollFromTempo(clientY){const rect=tempoRail.getBoundingClientRect(),travel=Math.max(1,rect.height-tempoHandle.offsetHeight),position=Math.min(travel,Math.max(0,clientY-rect.top-tempoHandle.offsetHeight/2)),ratio=position/travel;scrollTo({top:ratio*(document.documentElement.scrollHeight-innerHeight),behavior:'auto'})}addEventListener('scroll',syncTempoScroll,{passive:true});addEventListener('resize',syncTempoScroll,{passive:true});tempoRail.addEventListener('pointerdown',event=>{tempoDragging=true;tempoScroll.classList.add('dragging');tempoRail.setPointerCapture?.(event.pointerId);setScrollFromTempo(event.clientY);event.preventDefault()});tempoRail.addEventListener('pointermove',event=>{if(tempoDragging)setScrollFromTempo(event.clientY)});tempoRail.addEventListener('pointerup',event=>{tempoDragging=false;tempoScroll.classList.remove('dragging');tempoRail.releasePointerCapture?.(event.pointerId)});tempoRail.addEventListener('pointercancel',()=>{tempoDragging=false;tempoScroll.classList.remove('dragging')});tempoScroll.addEventListener('wheel',event=>{event.preventDefault();scrollBy({top:event.deltaY*3.4,behavior:'auto'})},{passive:false});syncTempoScroll();

const soundcloudFrame=document.querySelector('#soundcloud-player');
let radioTracks=[...document.querySelectorAll('.radio-track[data-sound]')];
let soundcloudWidget=null;
let communityAudio=null;
function buildLiveEqualizer(element,count){
  if(!element||element.children.length)return;
  const fragment=document.createDocumentFragment();
  for(let index=0;index<count;index++){
    const bar=document.createElement('i');
    const base=18+((index*37)%58),peak=55+((index*29)%46);
    bar.style.setProperty('--base',`${base}%`);
    bar.style.setProperty('--peak',`${peak}%`);
    bar.style.setProperty('--speed',`${.34+((index*13)%28)/100}s`);
    bar.style.setProperty('--delay',`${-((index*17)%43)/100}s`);
    fragment.appendChild(bar);
  }
  element.appendChild(fragment);
}
buildLiveEqualizer(document.querySelector('.hero-eq'),54);
buildLiveEqualizer(document.querySelector('.radio-wave'),42);
function setRadioPlaying(playing){
  document.body.classList.toggle('music-playing',playing);
  radioTracks.forEach(btn=>{
    const icon=btn.querySelector(':scope > b');
    if(icon)icon.textContent=btn.classList.contains('active')&&playing?'Ⅱ':'▶';
    btn.setAttribute('aria-pressed',String(btn.classList.contains('active')&&playing));
  });
}
function connectSoundcloudWidget(){
  if(!soundcloudFrame||!window.SC?.Widget)return;
  soundcloudWidget=window.SC.Widget(soundcloudFrame);
  soundcloudWidget.bind(window.SC.Widget.Events.PLAY,()=>setRadioPlaying(true));
  soundcloudWidget.bind(window.SC.Widget.Events.PAUSE,()=>setRadioPlaying(false));
  soundcloudWidget.bind(window.SC.Widget.Events.FINISH,()=>setRadioPlaying(false));
  soundcloudWidget.bind(window.SC.Widget.Events.READY,()=>soundcloudWidget.isPaused(paused=>setRadioPlaying(!paused)));
}
soundcloudFrame?.addEventListener('load',connectSoundcloudWidget);
connectSoundcloudWidget();
function bindRadioTrack(btn){btn.addEventListener('click',()=>{
  radioTracks.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  if(btn.dataset.audio){
    soundcloudWidget?.pause();
    communityAudio?.pause();
    communityAudio=new Audio(btn.dataset.audio);
    communityAudio.addEventListener('play',()=>setRadioPlaying(true));
    communityAudio.addEventListener('pause',()=>setRadioPlaying(false));
    communityAudio.addEventListener('ended',()=>setRadioPlaying(false));
    communityAudio.play().catch(()=>setRadioPlaying(false));
    return;
  }
  const nextSource=new URL(btn.dataset.sound);
  nextSource.searchParams.set('auto_play','true');
  soundcloudFrame.src=nextSource.href;
  setRadioPlaying(true);
})}
radioTracks.forEach(bindRadioTrack);

const communityTracks=document.querySelector('#community-tracks');
const safeTrack=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const trackSourceAttribute=url=>String(url||'').includes('soundcloud.com/')?`data-sound="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%2300eaf2&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true"`:`data-audio="${safeTrack(url)}"`;
function renderCommunityTracks(items){
  if(!communityTracks)return;
  const approved=items.filter(item=>item.status==='approved');
  communityTracks.innerHTML=approved.map((item,index)=>`<button class="radio-track community-track" ${trackSourceAttribute(item.audio_url||item.url)}><span class="radio-number">${String(index+3).padStart(2,'0')}</span><span class="radio-avatar student">${safeTrack((item.artist_name||'M').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase())}</span><span class="radio-copy"><small>ALUMNI MUSIK / APROBADO</small><strong>${safeTrack(item.title)}</strong><em>${safeTrack(item.artist_name)} · ${safeTrack(item.genre||'Musik')}</em></span><b>▶</b></button>`).join('');
  const dynamic=[...communityTracks.querySelectorAll('.radio-track')];
  dynamic.forEach(bindRadioTrack);
  radioTracks=[...document.querySelectorAll('.radio-track[data-sound],.radio-track[data-audio]')];
}
async function loadCommunityTracks(){
  let items=JSON.parse(localStorage.getItem('musik-track-submissions')||'[]');
  const config=window.MUSIK_AUTH_CONFIG||{};
  if(config.supabaseUrl&&config.supabaseAnonKey){
    try{const response=await fetch(`${config.supabaseUrl}/rest/v1/track_submissions?status=eq.approved&select=id,title,artist_name,genre,audio_url,status&order=reviewed_at.desc`,{headers:{apikey:config.supabaseAnonKey,Authorization:`Bearer ${config.supabaseAnonKey}`}});if(response.ok)items=await response.json()}catch(_error){}
  }
  renderCommunityTracks(items);
}
loadCommunityTracks();

/* Catálogo público administrado desde el panel; descarga exclusiva para miembros. */
const publicDownloadGrid=document.querySelector('#public-download-grid');
const publicDownloadFallback=[{id:'demo-tip',category:'tip',title:'Checklist antes de tocar',description:'Preparación de cabina, niveles, cues y organización para llegar listo a cada set.',file_name:'Checklist Musik.pdf',enabled:true},{id:'demo-track',category:'track',title:'Warm-up tools · Vol. 01',description:'Recursos y referencias para trabajar aperturas y construcción de energía.',file_name:'Audio pack',enabled:true},{id:'demo-material',category:'material',title:'Guía de selección musical',description:'Un método simple para ordenar música, momentos y energía de un set.',file_name:'Guía Musik.pdf',enabled:true}];
const escapeDownload=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function renderPublicDownloads(items){if(!publicDownloadGrid)return;publicDownloadGrid.innerHTML=items.filter(item=>item.enabled!==false).map((item,index)=>`<article class="public-download-card"><div class="public-download-top"><span>${escapeDownload(item.category||'material')}</span><b>${String(index+1).padStart(2,'0')}</b></div><h3>${escapeDownload(item.title)}</h3><p>${escapeDownload(item.description)}</p><small>${escapeDownload(item.file_name||'Recurso MUSIK')}</small><button data-public-download="${escapeDownload(item.id)}">${window.MusikAuth?.user?'Descargar recurso ↓':'Ingresar para descargar →'}</button></article>`).join('')||'<p class="download-empty">Próximamente vas a encontrar nuevos recursos MUSIK.</p>';publicDownloadGrid.querySelectorAll('[data-public-download]').forEach(button=>button.onclick=()=>downloadPublicResource(items.find(item=>String(item.id)===button.dataset.publicDownload)))}
async function loadPublicDownloads(){let items=publicDownloadFallback;renderPublicDownloads(items);const client=window.MusikAuth?.client;if(client){const{data,error}=await client.from('member_downloads').select('*').eq('enabled',true).order('created_at',{ascending:false});if(!error&&data?.length){items=data;renderPublicDownloads(items)}}return items}
async function downloadPublicResource(item){if(!window.MusikAuth?.user){modal.showModal();showToast('Ingresá como miembro para descargar.');return}try{let url=item.external_url;if(item.file_path){const{data,error}=await window.MusikAuth.client.storage.from('member-downloads').createSignedUrl(item.file_path,60);if(error)throw error;url=data.signedUrl}if(!url){showToast('Este recurso es una demostración.');return}window.open(url,'_blank','noopener');showToast('Descarga autorizada ✓')}catch(_error){showToast('No pudimos generar la descarga. Intentá nuevamente.')}}
loadPublicDownloads();setTimeout(loadPublicDownloads,1000);

/* Algunos navegadores no propagan PLAY desde el iframe: sincronizamos su estado real. */
setInterval(()=>{
  if(!soundcloudWidget||communityAudio&&!communityAudio.paused&&!communityAudio.ended)return;
  try{soundcloudWidget.isPaused(paused=>setRadioPlaying(!paused))}catch(_error){}
},700);

const instagramGrid=document.querySelector('#instagram-grid');
const escapeInstagramText=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function renderInstagramPosts(posts){
  if(!instagramGrid)return;
  instagramGrid.innerHTML=posts.slice(0,6).map((post,index)=>{
    const media=post.media_type==='VIDEO'?(post.thumbnail_url||post.media_url):post.media_url;
    const caption=escapeInstagramText(post.caption||'Publicación de Musik Academy');
    return `<a class="instagram-post" href="${post.permalink}" target="_blank" rel="noopener" aria-label="Ver publicación ${index+1} en Instagram"><img src="${media}" alt="${caption.slice(0,120)}" loading="lazy"><span class="instagram-overlay"><b>${post.media_type==='VIDEO'?'▶ REEL':'◎ POST'}</b><small>${caption.slice(0,115)}</small></span></a>`;
  }).join('');
}
async function loadInstagramFeed(){
  if(!instagramGrid)return;
  const config=window.MUSIK_AUTH_CONFIG||{};
  if(!config.supabaseUrl||!config.supabaseAnonKey){instagramGrid.innerHTML='<a class="instagram-connect" href="https://www.instagram.com/musik_academy/" target="_blank" rel="noopener"><strong>@musik_academy</strong><span>Visitá nuestras últimas publicaciones →</span></a>';return}
  try{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),5000);
    const response=await fetch(`${config.supabaseUrl}/functions/v1/instagram-feed`,{signal:controller.signal,headers:{apikey:config.supabaseAnonKey,Authorization:`Bearer ${config.supabaseAnonKey}`}});
    clearTimeout(timeout);
    if(!response.ok)throw new Error('feed unavailable');
    const data=await response.json();
    if(!Array.isArray(data.posts)||!data.posts.length)throw new Error('empty feed');
    renderInstagramPosts(data.posts);
  }catch(_error){instagramGrid.innerHTML='<a class="instagram-connect" href="https://www.instagram.com/musik_academy/" target="_blank" rel="noopener"><strong>Instagram · @musik_academy</strong><span>El feed automático está listo para conectar. Mientras tanto, mirá las publicaciones en Instagram →</span></a>'}
}
loadInstagramFeed();

const masterclassBanner={id:20261022,section:'news',eyebrow:'MUSIK MASTERCLASS',title:'Técnicas profesionales de mezcla',text:'Una experiencia exclusiva junto a Hernán Paredes, DJ, productor y director de MUSIK, con más de 30 años de trayectoria profesional.',meta:'3 h 30 min · Solo 20 participantes',details:['Técnicas profesionales de mezcla y secretos de cabina','Demostraciones en vivo','HANDS-ON: práctica en 4 islas con setups profesionales','Supervisión y correcciones personalizadas','Coffee break, networking y certificado MUSIK'],prices:['General · $75.000','Preventa · $60.000','Alumnos MUSIK · $50.000'],cta:'Reservá tu lugar',url:'https://wa.me/5491154190480',color:'#cf00ff',image:'',enabled:true};
const defaultBanners=[masterclassBanner,{id:1,section:'home',eyebrow:'INSCRIPCIONES',title:'Inscripciones abiertas',text:'Nuevos grupos de DJ y Producción Musical.',meta:'Vacantes disponibles',details:[],prices:[],cta:'Conocer cursos',url:'#academia',color:'#00eaf2',image:'',enabled:true}];
const promo=document.querySelector('#promo-carousel'),news=document.querySelector('#news-slider');let bannerIndex=0,newsIndex=0,promoTimer,newsTimer;
try{if(!localStorage.getItem('musik-masterclass-seed-v1')){const stored=JSON.parse(localStorage.getItem('musik-banners')||'null');if(Array.isArray(stored)&&!stored.some(b=>b.id===masterclassBanner.id)){stored.unshift(masterclassBanner);localStorage.setItem('musik-banners',JSON.stringify(stored))}localStorage.setItem('musik-masterclass-seed-v1','1')}}catch{}
function safeBanners(){try{return (JSON.parse(localStorage.getItem('musik-banners')||'null')||defaultBanners).map(b=>({...b,section:b.section||(b.id===20261022?'news':'home')}))}catch{return defaultBanners}}
function homeBanners(){return safeBanners().filter(b=>b.enabled&&(b.section||'home')==='home')}
function newsBanners(){return safeBanners().filter(b=>b.enabled&&(b.section||'home')==='news')}
function renderPromos(){const banners=homeBanners();if(!banners.length){promo.hidden=true;return}promo.hidden=false;promo.innerHTML=banners.map((b,i)=>{const shortTitle=b.promoTitle||(b.id===20261022?'Masterclass · Mezcla profesional':b.title);return `<article class="promo-slide ${i===bannerIndex%banners.length?'active':''}" style="--promo:${b.color||'#00eaf2'};${b.image?`background-image:linear-gradient(90deg,rgba(5,5,7,.94),rgba(5,5,7,.32)),url('${b.image}')`:''}"><div class="promo-identity"><span class="promo-signal" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="promo-tag">${b.eyebrow||'NOVEDAD / MUSIK'}</span></div><div class="promo-copy"><strong>${shortTitle}</strong><p>${b.text}</p></div><a href="${b.url||'#academia'}"><span>${b.cta||'Ver más'}</span> →</a><span class="promo-progress" aria-hidden="true"></span></article>`}).join('')+`<div class="promo-dots">${banners.map((_,i)=>`<button aria-label="Ver banner ${i+1}" class="${i===bannerIndex%banners.length?'active':''}" data-promo="${i}"></button>`).join('')}</div>`;promo.querySelectorAll('[data-promo]').forEach(b=>b.onclick=()=>{bannerIndex=Number(b.dataset.promo);renderPromos();restartPromos()})}
function restartPromos(){clearInterval(promoTimer);promoTimer=setInterval(()=>{const n=homeBanners().length;if(n>1){bannerIndex=(bannerIndex+1)%n;renderPromos()}},6000)}
function listItems(value){if(Array.isArray(value))return value;return String(value||'').split('\n').map(x=>x.trim()).filter(Boolean)}
function renderNews(){const banners=newsBanners();if(!news)return;if(!banners.length){news.innerHTML='<p class="news-empty">No hay novedades publicadas por el momento.</p>';return}newsIndex%=banners.length;news.innerHTML=banners.map((b,i)=>{const details=listItems(b.details),prices=listItems(b.prices);return `<article class="news-card ${i===newsIndex?'active':''}" style="--news:${b.color||'#00eaf2'};${b.image?`--news-image:url('${b.image}')`:''}"><div class="news-main"><span class="news-kicker">${b.eyebrow||'NOVEDAD / MUSIK'}</span><h3>${b.title}</h3><strong class="news-callout">${i===0?'¡LLEVÁ TUS MEZCLAS A OTRO NIVEL!':b.meta||'Descubrí lo nuevo de Musik'}</strong><p>${b.text||''}</p>${details.length?`<ul>${details.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}</div><aside class="news-info"><span>INFORMACIÓN</span><h4>${b.meta||'Consultá disponibilidad'}</h4>${prices.length?`<div class="news-prices">${prices.map((x,j)=>`<p class="${j===1?'featured':''}">${x}</p>`).join('')}</div>`:''}<a class="btn primary" href="${b.url||'#academia'}" ${String(b.url||'').startsWith('http')?'target="_blank" rel="noopener"':''}>${b.cta||'Ver más'} →</a>${i===0?'<a class="news-social" href="https://www.instagram.com/musik_academy/" target="_blank" rel="noopener">Instagram · @musik_academy ↗</a>':''}<small>MUSIK | Academia de DJs y Productores</small></aside></article>`}).join('')+`<div class="news-controls"><button data-news-prev aria-label="Novedad anterior">←</button><span>${String(newsIndex+1).padStart(2,'0')} / ${String(banners.length).padStart(2,'0')}</span><button data-news-next aria-label="Novedad siguiente">→</button></div>`;news.querySelector('[data-news-prev]').onclick=()=>{newsIndex=(newsIndex-1+banners.length)%banners.length;renderNews();restartNews()};news.querySelector('[data-news-next]').onclick=()=>{newsIndex=(newsIndex+1)%banners.length;renderNews();restartNews()}}
function restartNews(){clearInterval(newsTimer);newsTimer=setInterval(()=>{const n=newsBanners().length;if(n>1){newsIndex=(newsIndex+1)%n;renderNews()}},8000)}
function renderSectionBanners(){['club','downloads'].forEach(section=>{const host=document.querySelector(section==='downloads'?'#descargas':'#club'),items=safeBanners().filter(b=>b.enabled&&b.section===section);if(!host)return;host.querySelector('.section-banner-grid')?.remove();if(!items.length)return;const grid=document.createElement('div');grid.className='section-banner-grid';grid.innerHTML=items.map(item=>`<article class="section-banner" style="--section-accent:${item.color||'#00eaf2'};${item.image?`background-image:linear-gradient(90deg,rgba(5,5,7,.92),rgba(5,5,7,.28)),url('${item.image}')`:''}"><span>${item.eyebrow||'MUSIK'}</span><h3>${item.title}</h3><p>${item.text||''}</p><a href="${item.url||'#'}">${item.cta||'Ver más'} →</a></article>`).join('');host.querySelector('.section-head')?.after(grid)})}
window.addEventListener('storage',e=>{if(e.key==='musik-banners'){bannerIndex=0;newsIndex=0;renderPromos();renderNews();renderSectionBanners();restartPromos();restartNews()}});renderPromos();renderNews();renderSectionBanners();restartPromos();restartNews();

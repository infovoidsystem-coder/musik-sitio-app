const modal=document.querySelector('#member-modal');
document.querySelectorAll('[data-open-modal]').forEach(btn=>btn.addEventListener('click',()=>modal.showModal()));
document.querySelector('.modal-close').addEventListener('click',()=>modal.close());
modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
document.querySelector('.join-link').addEventListener('click',()=>modal.close());

const toast=document.querySelector('.toast');let toastTimer;
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2800)}
document.querySelectorAll('[data-toast]').forEach(btn=>btn.addEventListener('click',()=>showToast(btn.dataset.toast)));
document.querySelector('#login-form').addEventListener('submit',e=>{e.preventDefault();modal.close();showToast('Demo iniciada. ¡Bienvenido a Musik Club!')});

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

const soundcloudFrame=document.querySelector('#soundcloud-player');
const radioTracks=[...document.querySelectorAll('.radio-track[data-sound]')];
let soundcloudWidget=null;
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
}
soundcloudFrame?.addEventListener('load',connectSoundcloudWidget);
connectSoundcloudWidget();
radioTracks.forEach(btn=>btn.addEventListener('click',()=>{
  radioTracks.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const nextSource=new URL(btn.dataset.sound);
  nextSource.searchParams.set('auto_play','true');
  soundcloudFrame.src=nextSource.href;
  setRadioPlaying(true);
}));

const masterclassBanner={id:20261022,eyebrow:'MUSIK MASTERCLASS',title:'Técnicas profesionales de mezcla',text:'Una experiencia exclusiva junto a Hernán Paredes, DJ, productor y director de MUSIK, con más de 30 años de trayectoria profesional.',meta:'3 h 30 min · Solo 20 participantes',details:['Técnicas profesionales de mezcla y secretos de cabina','Demostraciones en vivo','HANDS-ON: práctica en 4 islas con setups profesionales','Supervisión y correcciones personalizadas','Coffee break, networking y certificado MUSIK'],prices:['General · $75.000','Preventa · $60.000','Alumnos MUSIK · $50.000'],cta:'Reservá tu lugar',url:'https://wa.me/5491154190480',color:'#cf00ff',image:'',enabled:true};
const defaultBanners=[masterclassBanner,{id:1,eyebrow:'INSCRIPCIONES',title:'Inscripciones abiertas',text:'Nuevos grupos de DJ y Producción Musical.',meta:'Vacantes disponibles',details:[],prices:[],cta:'Conocer cursos',url:'#academia',color:'#00eaf2',image:'',enabled:true}];
const promo=document.querySelector('#promo-carousel'),news=document.querySelector('#news-slider');let bannerIndex=0,newsIndex=0,promoTimer,newsTimer;
try{if(!localStorage.getItem('musik-masterclass-seed-v1')){const stored=JSON.parse(localStorage.getItem('musik-banners')||'null');if(Array.isArray(stored)&&!stored.some(b=>b.id===masterclassBanner.id)){stored.unshift(masterclassBanner);localStorage.setItem('musik-banners',JSON.stringify(stored))}localStorage.setItem('musik-masterclass-seed-v1','1')}}catch{}
function safeBanners(){try{return JSON.parse(localStorage.getItem('musik-banners')||'null')||defaultBanners}catch{return defaultBanners}}
function renderPromos(){const banners=safeBanners().filter(b=>b.enabled);if(!banners.length){promo.hidden=true;return}promo.hidden=false;promo.innerHTML=banners.map((b,i)=>{const shortTitle=b.promoTitle||(b.id===20261022?'Masterclass · Mezcla profesional':b.title);return `<article class="promo-slide ${i===bannerIndex%banners.length?'active':''}" style="--promo:${b.color||'#00eaf2'};${b.image?`background-image:linear-gradient(90deg,rgba(5,5,7,.94),rgba(5,5,7,.32)),url('${b.image}')`:''}"><span class="promo-tag">${b.eyebrow||'NOVEDAD / MUSIK'}</span><div><strong>${shortTitle}</strong><p>${b.text}</p></div><a href="${b.url||'#academia'}">${b.cta||'Ver más'} →</a></article>`}).join('')+`<div class="promo-dots">${banners.map((_,i)=>`<button aria-label="Ver banner ${i+1}" class="${i===bannerIndex%banners.length?'active':''}" data-promo="${i}"></button>`).join('')}</div>`;promo.querySelectorAll('[data-promo]').forEach(b=>b.onclick=()=>{bannerIndex=Number(b.dataset.promo);renderPromos();restartPromos()})}
function restartPromos(){clearInterval(promoTimer);promoTimer=setInterval(()=>{const n=safeBanners().filter(b=>b.enabled).length;if(n>1){bannerIndex=(bannerIndex+1)%n;renderPromos()}},6000)}
function listItems(value){if(Array.isArray(value))return value;return String(value||'').split('\n').map(x=>x.trim()).filter(Boolean)}
function renderNews(){const banners=safeBanners().filter(b=>b.enabled);if(!news)return;if(!banners.length){news.innerHTML='<p class="news-empty">No hay novedades publicadas por el momento.</p>';return}newsIndex%=banners.length;news.innerHTML=banners.map((b,i)=>{const details=listItems(b.details),prices=listItems(b.prices);return `<article class="news-card ${i===newsIndex?'active':''}" style="--news:${b.color||'#00eaf2'};${b.image?`--news-image:url('${b.image}')`:''}"><div class="news-main"><span class="news-kicker">${b.eyebrow||'NOVEDAD / MUSIK'}</span><h3>${b.title}</h3><strong class="news-callout">${i===0?'¡LLEVÁ TUS MEZCLAS A OTRO NIVEL!':b.meta||'Descubrí lo nuevo de Musik'}</strong><p>${b.text||''}</p>${details.length?`<ul>${details.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}</div><aside class="news-info"><span>INFORMACIÓN</span><h4>${b.meta||'Consultá disponibilidad'}</h4>${prices.length?`<div class="news-prices">${prices.map((x,j)=>`<p class="${j===1?'featured':''}">${x}</p>`).join('')}</div>`:''}<a class="btn primary" href="${b.url||'#academia'}" ${String(b.url||'').startsWith('http')?'target="_blank" rel="noopener"':''}>${b.cta||'Ver más'} →</a>${i===0?'<a class="news-social" href="https://www.instagram.com/musik_academy/" target="_blank" rel="noopener">Instagram · @musik_academy ↗</a>':''}<small>MUSIK | Academia de DJs y Productores</small></aside></article>`}).join('')+`<div class="news-controls"><button data-news-prev aria-label="Novedad anterior">←</button><span>${String(newsIndex+1).padStart(2,'0')} / ${String(banners.length).padStart(2,'0')}</span><button data-news-next aria-label="Novedad siguiente">→</button></div>`;news.querySelector('[data-news-prev]').onclick=()=>{newsIndex=(newsIndex-1+banners.length)%banners.length;renderNews();restartNews()};news.querySelector('[data-news-next]').onclick=()=>{newsIndex=(newsIndex+1)%banners.length;renderNews();restartNews()}}
function restartNews(){clearInterval(newsTimer);newsTimer=setInterval(()=>{const n=safeBanners().filter(b=>b.enabled).length;if(n>1){newsIndex=(newsIndex+1)%n;renderNews()}},8000)}
window.addEventListener('storage',e=>{if(e.key==='musik-banners'){bannerIndex=0;newsIndex=0;renderPromos();renderNews();restartPromos();restartNews()}});renderPromos();renderNews();restartPromos();restartNews();

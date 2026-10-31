const products = [
  {name:"CDJ-3000",brand:"Pioneer DJ",type:"nuevo reproductor",state:"NUEVO",price:"U$S 3.599",image:"assets/shop/cdj3000.jpg",promo:true,description:"Reproductor profesional de referencia para cabinas y performances."},
  {name:"DDJ-FLX10",brand:"Pioneer DJ",type:"nuevo controlador",state:"NUEVO",price:"Consultar",image:"assets/shop/flx10.jpg",promo:true,description:"Controlador DJ profesional de cuatro canales con funciones de performance."},
  {name:"EAH-DJ1200",brand:"Technics",type:"nuevo auricular",state:"NUEVO",price:"U$S 330",image:"assets/shop/headphones-technics.jpg",description:"Auriculares DJ profesionales para monitoreo de cabina."},
  {name:"DDJ-XP1",brand:"Pioneer DJ",type:"usado controlador",state:"USADO · OPORTUNIDAD",price:"U$S 450",image:"assets/shop/pioneer-ddj-xp1.jpg",description:"Controlador adicional para performance, pads, loops y efectos."},
  {name:"XDJ-1000 MK2 · PAR",brand:"Pioneer DJ",type:"usado reproductor",state:"USADO · OPORTUNIDAD",price:"U$S 2.999",image:"assets/shop/used-ddj.jpg",description:"Dos reproductores profesionales. Estado y disponibilidad a confirmar."},
  {name:"RMX-1000",brand:"Pioneer DJ",type:"nuevo controlador",state:"NUEVO",price:"Consultar",image:"assets/shop/rmx1000.jpg",promo:true,description:"Remix Station y unidad de efectos para DJ sets en vivo."},
  {name:"XDJ-RX3",brand:"Pioneer DJ",type:"nuevo controlador",state:"NUEVO",price:"U$S 3.390",image:"assets/shop/image-3.png",description:"Sistema all-in-one profesional para cabina y eventos."},
  {name:"XDJ-1000 MK2",brand:"Pioneer DJ",type:"nuevo reproductor",state:"NUEVO",price:"U$S 2.050",image:"assets/shop/used-ddj.jpg",description:"Reproductor táctil profesional para configuraciones modulares."},
  {name:"HDJ-X7",brand:"Pioneer DJ",type:"nuevo auricular",state:"NUEVO",price:"U$S 325",image:"assets/shop/headphones-technics.jpg",description:"Auriculares de monitoreo profesional. Imagen ilustrativa de categoría."},
  {name:"HD25 Plus",brand:"Sennheiser",type:"nuevo auricular",state:"NUEVO",price:"U$S 350",image:"assets/shop/headphones-technics.jpg",description:"Auricular profesional para DJ y monitoreo. Imagen ilustrativa de categoría."},
  {name:"HDJ-X5K",brand:"Pioneer DJ",type:"nuevo auricular",state:"NUEVO",price:"U$S 175",image:"assets/shop/headphones-technics.jpg",description:"Auricular DJ de monitoreo. Imagen ilustrativa de categoría."},
  {name:"OMNIS-DUO",brand:"AlphaTheta",type:"nuevo controlador",state:"NUEVO",price:"U$S 1.999",image:"assets/shop/image-3.png",description:"Sistema all-in-one portátil para mezclar en cualquier lugar."},
  {name:"PRIME GO",brand:"Denon DJ",type:"nuevo controlador",state:"NUEVO",price:"U$S 1.650",image:"assets/shop/image-3.png",description:"Sistema DJ portátil autónomo. Foto ilustrativa de la categoría."},
  {name:"SC LIVE 4",brand:"Denon DJ",type:"nuevo controlador",state:"NUEVO",price:"U$S 2.199",image:"assets/shop/image-3.png",description:"Sistema DJ autónomo de cuatro canales. Imagen de categoría."},
  {name:"XDJ-RR",brand:"Pioneer DJ",type:"nuevo controlador",state:"NUEVO",price:"U$S 1.750",image:"assets/shop/image-3.png",description:"Sistema all-in-one de dos canales para práctica y eventos."},
  {name:"XDJ-AZ",brand:"AlphaTheta",type:"nuevo controlador",state:"NUEVO",price:"U$S 5.200",image:"assets/shop/image-3.png",description:"Sistema all-in-one profesional de cuatro canales."},
  {name:"XDJ-700",brand:"Pioneer DJ",type:"nuevo reproductor",state:"NUEVO",price:"U$S 1.199",image:"assets/shop/used-ddj.jpg",description:"Reproductor compacto con pantalla táctil. Imagen ilustrativa."},
  {name:"SL-1200 MK7",brand:"Technics",type:"nuevo reproductor",state:"NUEVO",price:"U$S 2.150",image:"assets/shop/image-1.png",description:"Bandeja profesional para vinilo. Foto general de equipamiento."},
  {name:"CLASSIC 5 G3 · PAR",brand:"KRK",type:"nuevo monitor",state:"NUEVO",price:"U$S 670",image:"assets/shop/image-2.png",description:"Par de monitores potenciados para producción y estudio."},
  {name:"SL-1200 MK2",brand:"Technics",type:"usado reproductor",state:"USADO · OPORTUNIDAD",price:"U$S 1.390",image:"assets/shop/image-1.png",description:"Bandeja profesional usada. Estado y stock a confirmar."},
  {name:"SC5000",brand:"Denon DJ",type:"usado reproductor",state:"USADO · OPORTUNIDAD",price:"U$S 2.000",image:"assets/shop/used-ddj.jpg",description:"Reproductor profesional usado. Imagen ilustrativa de categoría."},
  {name:"DDJ-SR1",brand:"Pioneer DJ",type:"usado controlador",state:"USADO · OPORTUNIDAD",price:"U$S 699",image:"assets/shop/image-3.png",description:"Controlador DJ usado de dos canales. Stock a confirmar."},
  {name:"DDJ-RX",brand:"Pioneer DJ",type:"usado controlador",state:"USADO · OPORTUNIDAD",price:"U$S 1.100",image:"assets/shop/image-3.png",description:"Controlador DJ usado de cuatro canales. Stock a confirmar."},
  {name:"XONE:96",brand:"Allen & Heath",type:"usado controlador",state:"USADO · OPORTUNIDAD",price:"U$S 2.500",image:"assets/shop/image-1.png",description:"Mixer profesional usado. Estado y disponibilidad a confirmar."},
  {name:"DDJ-400 + BOLSO",brand:"Pioneer DJ",type:"usado controlador",state:"USADO · OPORTUNIDAD",price:"U$S 650",image:"assets/shop/image-3.png",description:"Controlador con bolso. Estado y disponibilidad a confirmar."}
];

const grid = document.querySelector("#product-grid");
const moneyText = (value) => value === "Consultar" ? value : value;
function renderProducts(){
  grid.innerHTML = products.map((product,index) => {
    const message = encodeURIComponent(`Hola MUSIK, quiero consultar por ${product.brand} ${product.name} (${product.state}).`);
    return `<article class="product-card" data-type="${product.type}"><div class="product-media ${product.promo ? "promo" : ""}"><img src="${product.image}" alt="${product.brand} ${product.name}" loading="lazy"><span class="product-status ${product.type.includes("usado") ? "used" : ""}">${product.state}</span></div><div class="product-copy"><span class="product-brand">${product.brand}</span><h3>${product.name}</h3><p>${product.description}</p><div class="product-buy"><span class="product-price"><small>PRECIO PUBLICADO</small><strong>${moneyText(product.price)}</strong></span><a href="https://wa.me/5491157190480?text=${message}" target="_blank" rel="noopener" aria-label="Consultar por ${product.name}">Consultar →</a></div></div></article>`;
  }).join("");
}
renderProducts();
document.querySelectorAll("[data-shop-filter]").forEach(button => button.addEventListener("click",()=>{
  document.querySelectorAll("[data-shop-filter]").forEach(item=>item.classList.toggle("active",item===button));
  const filter=button.dataset.shopFilter;
  document.querySelectorAll(".product-card").forEach(card=>card.classList.toggle("hidden",filter!=="all"&&!card.dataset.type.includes(filter)));
}));

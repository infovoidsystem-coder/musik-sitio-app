(()=>{
  document.querySelectorAll('.brand').forEach((brand)=>{
    const href=brand.getAttribute('href')||'index.html';
    let count=0,timer=null;
    brand.addEventListener('click',(e)=>{
      e.preventDefault();
      count++;
      clearTimeout(timer);
      if(count>=3){
        count=0;
        window.location.href='admin.html';
        return;
      }
      timer=setTimeout(()=>{
        count=0;
        window.location.href=href;
      },420);
    });
  });
})();

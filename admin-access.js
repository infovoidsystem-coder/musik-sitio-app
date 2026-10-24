(()=>{
  document.querySelectorAll('.brand img').forEach(logo=>{
    let clicks=0,timer;
    logo.style.cursor='pointer';
    logo.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      clicks+=1;
      clearTimeout(timer);
      if(clicks===3){clicks=0;location.href='admin.html';return}
      timer=setTimeout(()=>{
        const href=logo.closest('a')?.getAttribute('href');
        clicks=0;
        if(href)location.href=href;
      },650);
    });
  });
})();

// Central analytics — edit this file to update tracking across all pages

// Google Tag Manager
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-54Z873L3');

document.addEventListener('DOMContentLoaded', function() {
  // AdSense — push one entry per slot so every slot on the page fills
  var slots = document.querySelectorAll('ins.adsbygoogle');
  for (var i = 0; i < slots.length; i++) {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }

  // Mobile hamburger menu — injected once for all pages
  var header = document.querySelector('.site-header .container');
  if (!header) return;
  var nav = header.querySelector('nav');
  if (!nav) return;

  var btn = document.createElement('button');
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-label', 'Toggle navigation');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span></span><span></span><span></span>';
  header.appendChild(btn);

  btn.addEventListener('click', function() {
    var open = nav.classList.toggle('nav-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.classList.toggle('active', open);
  });

  nav.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() {
      nav.classList.remove('nav-open');
      btn.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
});

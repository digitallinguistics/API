(function () {

  var nav = document.getElementById('nav');

  var resize = function () {

    var mobile = (function () {
      return window.matchMedia && window.matchMedia('(max-device-width: 699px)').matches || screen.width < 700 || window.innerWidth < 700;
    })();


    if (mobile) {
      document.body.classList.add('mobile');
      document.body.classList.remove('desktop');
      nav.style.display = 'none';
    } else {
      document.body.classList.add('desktop');
      document.body.classList.remove('mobile');
      nav.style.display = 'flex';
    }

  };

  var toggleMenu = function () {
    nav.style.display = getComputedStyle(nav).display === 'none' ? 'flex' : 'none';
  };

  resize();

  document.getElementById('menuButton').addEventListener('click', toggleMenu);
  window.addEventListener('resize', resize);

})();

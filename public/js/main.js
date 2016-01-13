(function () {

  var nav = document.getElementById('nav');
  var userName = document.getElementById('userName');

  var resize = function () {

    var mobile = (function () {
      return window.matchMedia && window.matchMedia('(max-device-width: 699px)').matches || screen.width < 700 || window.innerWidth < 700;
    })();


    if (mobile) {
      document.body.classList.add('mobile');
      document.body.classList.remove('desktop');
      nav.style.display = 'none';
      userName.style.display = 'none';
    } else {
      document.body.classList.add('desktop');
      document.body.classList.remove('mobile');
      nav.style.display = 'flex';
      userName.style.display = 'flex';
    }

  };

  var toggleMenu = function () {
    nav.style.display = getComputedStyle(nav).display === 'none' ? 'flex' : 'none';
    userName.style.display = getComputedStyle(userName).display === 'none' ? 'flex' : 'none';
  };

  resize();

  document.getElementById('menuButton').addEventListener('click', toggleMenu);
  window.addEventListener('resize', resize);

})();

// global utilities & functions
var qs = (function () {

  var hasOwnProperty = function (obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };

  var stringifyPrimitive = function(v) {
    switch (typeof v) {
      case 'string':
        return v;

      case 'boolean':
        return v ? 'true' : 'false';

      case 'number':
        return isFinite(v) ? v : '';

      default:
        return '';
    }
  };

  var qs = {

    parse: function (qs, sep, eq, options) {
      sep = sep || '&';
      eq = eq || '=';
      var obj = {};

      if (typeof qs !== 'string' || qs.length === 0) {
        return obj;
      }

      var regexp = /\+/g;
      qs = qs.split(sep);

      var maxKeys = 1000;
      if (options && typeof options.maxKeys === 'number') {
        maxKeys = options.maxKeys;
      }

      var len = qs.length;
      // maxKeys <= 0 means that we should not limit keys count
      if (maxKeys > 0 && len > maxKeys) {
        len = maxKeys;
      }

      for (var i = 0; i < len; ++i) {
        var x = qs[i].replace(regexp, '%20'),
            idx = x.indexOf(eq),
            kstr, vstr, k, v;

        if (idx >= 0) {
          kstr = x.substr(0, idx);
          vstr = x.substr(idx + 1);
        } else {
          kstr = x;
          vstr = '';
        }

        k = decodeURIComponent(kstr);
        v = decodeURIComponent(vstr);

        if (!hasOwnProperty(obj, k)) {
          obj[k] = v;
        } else if (Array.isArray(obj[k])) {
          obj[k].push(v);
        } else {
          obj[k] = [obj[k], v];
        }
      }

      return obj;

    },

    stringify: function(obj, sep, eq, name) {
      sep = sep || '&';
      eq = eq || '=';
      if (obj === null) {
        obj = undefined;
      }

      if (typeof obj === 'object') {
        return Object.keys(obj).map(function(k) {
          var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
          if (Array.isArray(obj[k])) {
            return obj[k].map(function(v) {
              return ks + encodeURIComponent(stringifyPrimitive(v));
            }).join(sep);
          } else {
            return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
          }
        }).join(sep);

      }

      if (!name) { return ''; }
      return encodeURIComponent(stringifyPrimitive(name)) + eq +
             encodeURIComponent(stringifyPrimitive(obj));
    }

  };

  return qs;

})();

window.location.query = qs.parse(window.location.search.replace('?', ''));


// main.handlebars
var main = {

  logoutButton: document.getElementById('logoutButton') || null,
  menuButton: document.getElementById('menuButton'),
  nav: document.getElementById('nav'),
  userName: document.getElementById('userName'),

  logout: function () {
    window.location.query.logout = true;
    window.location.search = '?' + qs.stringify(window.location.query);
  },

  resize: function () {

    var mobile = (function () {
      return window.matchMedia && window.matchMedia('(max-device-width: 699px)').matches || screen.width < 700 || window.innerWidth < 700;
    })();


    if (mobile) {
      document.body.classList.add('mobile');
      document.body.classList.remove('desktop');
      main.nav.style.display = 'none';
      main.userName.style.display = 'none';
    } else {
      document.body.classList.add('desktop');
      document.body.classList.remove('mobile');
      main.nav.style.display = 'flex';
      main.userName.style.display = 'flex';
    }

  },

  toggleMenu: function () {
    main.nav.style.display = getComputedStyle(main.nav).display === 'none' ? 'flex' : 'none';
    main.userName.style.display = getComputedStyle(main.userName).display === 'none' ? 'flex' : 'none';
  }

};

main.resize();
if (main.logoutButton) { main.logoutButton.addEventListener('click', main.logout); }
main.menuButton.addEventListener('click', main.toggleMenu);
window.addEventListener('resize', main.resize);

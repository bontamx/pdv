/* bonta.js — comunica las pantallas con la API de Bonta y emula google.script.run.
   Las pantallas siguen escritas igual; este archivo manda cada llamada a la API con la sesión del usuario. */
(function () {
  var API = ''; try { API = localStorage.getItem('bonta_api') || ''; } catch (e) {}
  function leerToken() { try { var s = JSON.parse(localStorage.getItem('bonta_sesion') || 'null'); return s && s.token && Date.now() - s.t < 12 * 3600e3 ? s.token : ''; } catch (e) { return ''; } }
  function irLogin() { try { localStorage.removeItem('bonta_sesion'); } catch (e) {} location.replace('index.html'); }
  if (!leerToken() || !API) irLogin();

  function llamar(fn, args) {
    return fetch(API, { method: 'POST', body: JSON.stringify({ accion: 'negocio', token: leerToken(), datos: { fn: fn, args: args } }), redirect: 'follow' })
      .then(function (r) { return r.text(); }, function () { throw new Error('No se pudo conectar con el servidor. Revisa tu internet e intenta de nuevo.'); })
      .then(function (txt) {
        var j; try { j = JSON.parse(txt); } catch (x) { throw new Error('El servidor respondió algo inesperado. Intenta de nuevo.'); }
        if (j && j.ok) return j.resultado;
        var e = new Error((j && j.error) || 'No se pudo completar la acción.'); e.codigo = j && j.codigo; throw e;
      });
  }
  function runner(ok, fallo) {
    return new Proxy({}, { get: function (_, nombre) {
      if (nombre === 'withSuccessHandler') return function (f) { return runner(f, fallo); };
      if (nombre === 'withFailureHandler') return function (f) { return runner(ok, f); };
      return function () {
        var args = Array.prototype.slice.call(arguments);
        llamar(String(nombre), args).then(function (r) { if (ok) ok(r); }, function (e) {
          if (e && (e.codigo === 'SESION' || e.codigo === 'DEBE_CAMBIAR')) { irLogin(); return; }
          if (fallo) fallo(e); else console.error(e);
        });
      };
    } });
  }
  window.google = { script: { run: runner(null, null), host: { close: function () { location.href = 'index.html'; } } } };

  document.addEventListener('DOMContentLoaded', function () {
    var b = document.createElement('div');
    b.style.cssText = 'position:sticky;top:0;z-index:50;background:#222;padding:10px 12px;margin:-12px -12px 10px';
    b.innerHTML = '<a href="index.html" style="color:#fff;text-decoration:none;font-weight:bold;font-size:15px">← Inicio · Bonta</a>';
    document.body.insertBefore(b, document.body.firstChild);
  });
})();

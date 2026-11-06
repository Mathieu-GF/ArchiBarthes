/* ArchiBarthes — Atlas : chargeur des modules, version 1 */
(function () {
  'use strict';
  if (window.__archibarthesAtlasLoader) return;
  window.__archibarthesAtlasLoader = true;

  const base = 'https://mathieu-gf.github.io/ArchiBarthes/';
  function load(path) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = base + path;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Chargement impossible : ' + path));
      document.head.appendChild(script);
    });
  }

  async function start() {
    try {
      await load('atlas/core.js');
      await load('atlas/personnes.js');
      console.info('ArchiBarthes : Atlas chargé depuis GitHub Pages');
    } catch (error) {
      console.error('ArchiBarthes : erreur de chargement', error);
    }
  }
  start();
})();

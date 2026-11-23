
/* ArchiBarthes — Chargeur de l'Atlas de test */
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

  // Accès direct à une section depuis l'accueil
  function naviguerVersSection() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('section') !== 'relations') return;

  const cible = document.querySelector('#relations .abn-panel');
  if (!cible) return;

  let dernierePosition = null;
  let stable = 0;
  let essais = 0;

  function attendreStabilisation() {
    const position = Math.round(
      cible.getBoundingClientRect().top + window.scrollY
    );

    stable = position === dernierePosition ? stable + 1 : 0;
    dernierePosition = position;
    essais++;

    if (stable >= 5 || essais >= 100) {
      cible.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      console.info('ArchiBarthes : navigation vers relations');
      return;
    }

    setTimeout(attendreStabilisation, 100);
  }

  attendreStabilisation();
}

  async function start() {
    try {
      await load('atlas/core.js');
      await load('atlas/personnes-v48-test.js?v=' + Date.now());
      await load('atlas/lieux-test.js?v=' + Date.now());
      console.info('ArchiBarthes : Atlas de test chargé');

      naviguerVersSection();

    } catch (error) {
      console.error('ArchiBarthes : erreur', error);
    }
  }

  start();
})();

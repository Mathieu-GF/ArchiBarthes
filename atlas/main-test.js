
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
    const section = params.get('section');

    if (section !== 'relations') return;

    const cible = document.getElementById('relations');
    if (!cible) {
      console.warn('ArchiBarthes : section relations introuvable');
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cible.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        console.info('ArchiBarthes : navigation vers relations');
      });
    });
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

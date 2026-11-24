/* =====================================================
   ARCHIBARTHES — JAVASCRIPT GLOBAL
   Réinitialisation, compteur, francisation
   ===================================================== */

(function () {

  /* 1. BOUTON RÉINITIALISER */

 
/* ARCHIBARTHES — Reset natif, positionnement unique */

function placerReset() {
  const bouton = document.querySelector(
    'button[title^="Clear all fields"]'
  );

  if (!bouton || !bouton.offsetParent) return false;

  const bandeau = document.getElementById(
    "archibarthes-compteur"
  );

  const discover = document.getElementById("ab-query-v6");

  // Sur les autres pages, conserver le placement existant.
  if (!discover || !bandeau) {
    const loupe = document.querySelector(
      'button[title^="To clear previous search"]'
    );

    if (!loupe || !bouton.offsetParent) return false;

    const cible = loupe.getBoundingClientRect();
    const parent = bouton.offsetParent.getBoundingClientRect();

    bouton.style.setProperty("position", "absolute", "important");
    bouton.style.setProperty(
      "left", `${cible.right - parent.left + 10}px`, "important"
    );
    bouton.style.setProperty(
      "top", `${cible.top - parent.top}px`, "important"
    );
    bouton.style.setProperty("right", "auto", "important");
    bouton.style.setProperty("z-index", "9999", "important");

    return true;
  }

  // Discover : alignement par rapport au compteur.
  const compteur = bandeau.lastElementChild;
  const libelle = [...bandeau.children].find(
    el => el.textContent.trim() === "Filtres"
  );

  if (!compteur || !libelle) return false;

  bouton.style.setProperty("position", "absolute", "important");
  bouton.style.setProperty("transform", "none", "important");

  const b = bouton.getBoundingClientRect();
  const t = libelle.getBoundingClientRect();
  const c = compteur.getBoundingClientRect();

  const assezDePlace =
    c.left - t.right >= b.width + 32;

  // Ne réserver une seconde ligne que si nécessaire.
  if (assezDePlace) {
    bandeau.style.removeProperty("margin-bottom");
  } else {
    bandeau.style.setProperty(
      "margin-bottom", "54px", "important"
    );
  }

  const parent = bouton.offsetParent;
  const p = parent.getBoundingClientRect();
  const f = bandeau.getBoundingClientRect();

  const x = assezDePlace
    ? c.left - b.width - 16
    : f.left + 8;

  const y = assezDePlace
    ? f.top + (f.height - b.height) / 2
    : f.bottom + 8;

  bouton.style.setProperty(
    "left",
    `${x - p.left - parent.clientLeft + parent.scrollLeft}px`,
    "important"
  );

  bouton.style.setProperty(
    "top",
    `${y - p.top - parent.clientTop + parent.scrollTop}px`,
    "important"
  );

  bouton.style.setProperty("right", "auto", "important");
  bouton.style.setProperty("z-index", "9999", "important");

  return true;
}


  let essaisReset = 0;

  const attenteReset = setInterval(function () {
    essaisReset++;

    if (placerReset() || essaisReset >= 40) {
      clearInterval(attenteReset);
    }
  }, 250);

  document.addEventListener('input', function () {
    requestAnimationFrame(placerReset);
  });

  window.addEventListener('resize', placerReset);


  /* 2. COMPTEUR ARCHIBARTHES */

  function installerCompteur() {

    const compteur = document.querySelector(
      'div[title^="n ="]'
    );

    const filtres = [...document.querySelectorAll('fieldset')]
      .find(e => e.querySelector('.facets'));

    if (!compteur || !filtres) {
      return false;
    }

    if (document.querySelector('#archibarthes-compteur')) {
      return true;
    }

    const titre = document.createElement('div');
    titre.id = 'archibarthes-compteur';

    titre.style.cssText = `
      display:flex;
      align-items:center;
      gap:14px;
      margin:16px 0 20px;
      padding:14px 18px;
      background:#f0f5fa;
      border:1px solid #cfdaea;
      border-left:4px solid #3978a8;
      border-radius:7px;
      font-size:14px;
      color:#17365d;
      box-sizing:border-box;
    `;

    const icone = document.createElement('span');
    icone.textContent = '☰';

    icone.style.cssText = `
      font-size:18px;
      color:#3978a8;
      line-height:1;
    `;

    const libelle = document.createElement('span');
    libelle.textContent = 'Filtres';

    libelle.style.cssText = `
      font-size:15px;
      font-weight:600;
      color:#17365d;
    `;

    const nombre = document.createElement('span');

    nombre.style.cssText = `
      margin-left:auto;
      padding:6px 12px;
      background:#ffffff;
      border:1px solid #d5e2ef;
      border-radius:20px;
      color:#235d96;
      font-size:13px;
      font-weight:500;
      white-space:nowrap;
    `;

    titre.append(icone, libelle, nombre);
    filtres.parentElement.insertBefore(titre, filtres);

    function actualiser() {
      const n = Number(
        compteur.title.match(/\d+/)?.[0] || 0
      );

      nombre.textContent =
        `${n.toLocaleString('fr-FR')} fiches trouvées`;
    }

    actualiser();

    new MutationObserver(actualiser).observe(compteur, {
      attributes: true,
      attributeFilter: ['title']
    });

    return true;
  }

  /* Surveillance permanente :
     réinstallation après navigation interne */

  setInterval(function () {
    installerCompteur();
 placerReset();
  }, 500);


  /* 3. RÉINSTALLATION APRÈS RÉINITIALISATION */

  function surveillerReset() {

    const bouton = document.querySelector(
      'button[title^="Clear all fields"]'
    );

    if (!bouton) {
      return false;
    }

    bouton.addEventListener('click', function () {
      setTimeout(installerCompteur, 500);
    });

    return true;
  }

  let essaisSurveillance = 0;

  const attenteSurveillance = setInterval(function () {
    essaisSurveillance++;

    if (surveillerReset() || essaisSurveillance >= 40) {
      clearInterval(attenteSurveillance);
    }
  }, 250);

})();


/* =====================================================
   4. FRANCISATION AUTOMATIQUE DES FACETTES
   ===================================================== */

(function () {

  const traductions = {
    'select...': 'Sélectionner…',
    'no values': 'Aucune valeur disponible'
  };

  function traduireDans(doc) {
    if (!doc) return;

    doc.querySelectorAll(
      '#cms-widget-10_search_faceted .ui-selectmenu-text, ' +
      '#cms-widget-10_search_faceted .ui-menu-item-wrapper'
    ).forEach(function (el) {

      const texte = el.textContent.trim();

      if (traductions[texte]) {
        el.textContent = traductions[texte];
      }

    });
  }

/* ARCHIBARTHES — Header natif :
   masqué sur l'accueil, visible sur les pages intérieures */

function gererHeaderAccueil() {

  const params = new URLSearchParams(window.location.search);
  const estPageInterieure = params.has("pageid");

  // Le CSS global détermine la visibilité.
  document.documentElement.classList.toggle(
    "ab-page-interieure",
    estPageInterieure
  );

  // Neutraliser les anciens masquages JavaScript.
  const header = document.getElementById("main-header");

  if (header) {
    header.style.removeProperty("display");
    delete header.dataset.abAccueilMasque;
    delete header.dataset.abDisplayInitial;
  }
}

  function traduire() {

    // Document courant
    traduireDans(document);

    // Iframes accessibles
    document.querySelectorAll('iframe').forEach(function (iframe) {
      try {
        traduireDans(iframe.contentDocument);
      } catch (e) {
        // Ignorer les iframes non accessibles
      }
    });
gererHeaderAccueil();
  }

  traduire();
  setInterval(traduire, 500);

})();

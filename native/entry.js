import { Capacitor, CapacitorHttp, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { createGeoFetch, createDiningFetch, createMoneyFetch } from './geo-fetch.mjs';

if (Capacitor.isNativePlatform()) {
  window.vfMoneyFetch = createMoneyFetch(options => CapacitorHttp.get(options));
  const TravelFiles = registerPlugin('TravelFiles');
  window.vfGeoFetch = createGeoFetch(options => CapacitorHttp.get(options));
  window.vfDiningFetch = createDiningFetch(options => CapacitorHttp.get(options));
  const status = message => window.vf9Status(message);
  let exporting = false;
  window.vf9Export = async () => {
    if (exporting) return;
    exporting = true;
    try {
      window.vf8SaveActive();
      const data = window.ViajaBackup.serialize(window.vf9All());
      const result = await TravelFiles.saveBackup({ data,
        name: `ViajaFacil-copia-${new Date().toISOString().slice(0, 10)}.json` });
      status(result.cancelled ? 'Guardado cancelado. Tus viajes se conservan.' : 'Copia guardada en la ubicación elegida.');
      return !result.cancelled;
    } catch (error) {
      status('No se pudo guardar la copia: ' + error.message);
      return false;
    } finally { exporting = false; }
  };

  document.addEventListener('click', async event => {
    const link = event.target.closest('a[href]');
    if (!link || !/^https:\/\//i.test(link.href)) return;
    event.preventDefault();
    try { await TravelFiles.openExternal({ url: link.href }); }
    catch { alert('No se pudo abrir el enlace. Comprueba que tienes un navegador instalado.'); }
  });

  const sections = [];
  let goingBack = false;
  const previousShow = window.show;
  window.show = id => {
    const before = document.querySelector('section.active')?.id;
    previousShow(id);
    const after = document.querySelector('section.active')?.id;
    if (!goingBack && before && after !== before) {
      sections.push(before);
      if (sections.length > 50) sections.shift();
    }
  };
  App.addListener('backButton', () => {
    const form = document.getElementById('dpForm');
    if (form && !form.hidden) {
      if (confirm('¿Cerrar la actividad sin guardar los cambios del formulario?')) form.hidden = true;
      return;
    }
    if (sections.length) {
      goingBack = true;
      try { window.show(sections.pop()); } finally { goingBack = false; }
    } else if (document.querySelector('section.active')?.id !== 'home') {
      goingBack = true;
      try { window.show('home'); } finally { goingBack = false; }
    } else {
      window.vf8SaveActive();
      App.minimizeApp();
    }
  });
  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) {
      try { window.vf8SaveActive(); } catch { status('No se pudieron guardar los últimos cambios. Exporta una copia.'); }
    }
  });
}


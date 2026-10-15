/* Shared by the PWA and Android. No network access. Compatible with backup format v1. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ViajaBackup = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_BYTES = 5 * 1024 * 1024;
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const scoped = k => k.startsWith('vf-') || k.startsWith('vf08-');
  const text = (v, max) => typeof v === 'string' && v.length <= max;
  function validatePlanner(raw) {
    let plan;
    try { plan = JSON.parse(raw); } catch { throw Error('El itinerario de la copia no es válido.'); }
    if (!object(plan) || !Array.isArray(plan.days) || !plan.days.length || plan.days.length > 90)
      throw Error('El itinerario debe contener entre 1 y 90 días.');
    const ids = new Set();
    for (const day of plan.days) {
      if (!object(day) || !text(day.id, 160) || !day.id || ids.has(day.id) || !text(day.date, 10) ||
          (day.date !== '' && (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isFinite(Date.parse(day.date)))) ||
          !Array.isArray(day.items)) throw Error('Hay un día dañado en el itinerario.');
      ids.add(day.id);
      const itemIds = new Set();
      for (const item of day.items) {
        if (!object(item) || !text(item.id, 160) || !item.id || itemIds.has(item.id) ||
            !text(item.name, 120) || !item.name.trim() || !text(item.time, 5) ||
            (item.time !== '' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)) ||
            !(item.cost === null || (typeof item.cost === 'number' && Number.isFinite(item.cost) && item.cost >= 0 && item.cost <= 1000000)) ||
            !text(item.kind, 80) || !text(item.transport, 200) || !text(item.notes, 1500))
          throw Error('Hay una actividad dañada en el itinerario.');
        itemIds.add(item.id);
      }
    }
    return plan;
  }
  function validate(obj) {
    if (!object(obj) || obj.app !== 'ViajaFácil' || obj.format !== 'viajafacil-backup' || obj.version !== 1 || !object(obj.data))
      throw Error('Este archivo no es una copia compatible de ViajaFácil.');
    const d = obj.data, keys = Object.keys(d);
    if (keys.length > 3000 || keys.some(k => !(scoped(k) || k.startsWith('vf8-')) || !text(d[k], 250000)))
      throw Error('La copia contiene datos incompatibles.');
    let trips;
    try { trips = JSON.parse(d['vf8-trips']); } catch { throw Error('La lista de viajes no es válida.'); }
    if (!Array.isArray(trips) || !trips.length || trips.length > 100 ||
        trips.some(t => !object(t) || !text(t.id, 160) || !/^trip-[a-z0-9-]+$/.test(t.id) || !text(t.name, 70) || !t.name.trim()) ||
        new Set(trips.map(t => t.id)).size !== trips.length || !trips.some(t => t.id === d['vf8-active']))
      throw Error('La lista de viajes de la copia está incompleta o dañada.');
    for (const trip of trips) {
      let snapshot;
      try { snapshot = JSON.parse(d['vf8-data-' + trip.id]); } catch { throw Error('Faltan datos de un viaje.'); }
      if (!object(snapshot) || Object.keys(snapshot).length > 300 ||
          Object.entries(snapshot).some(([k, v]) => !scoped(k) || !text(v, 250000)))
        throw Error('Los datos de un viaje están dañados.');
      if (snapshot['vf-day-planner-v1'] !== undefined) validatePlanner(snapshot['vf-day-planner-v1']);
    }
    if (d['vf-day-planner-v1'] !== undefined) validatePlanner(d['vf-day-planner-v1']);
    return { data: d, trips };
  }
  function serialize(data) {
    const obj = { app: 'ViajaFácil', format: 'viajafacil-backup', version: 1, exportedAt: new Date().toISOString(), data };
    validate(obj);
    const raw = JSON.stringify(obj, null, 2);
    if (new TextEncoder().encode(raw).length > MAX_BYTES) throw Error('La copia supera el máximo de 5 MB.');
    return raw;
  }
  return { MAX_BYTES, validatePlanner, validate, serialize };
});

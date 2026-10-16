const ENDPOINT = 'https://viajafacil-conexion.fairflute64.chatgpt.site/api/geo';

// Only the existing public geo endpoint uses native HTTP. The PWA keeps browser fetch.
export function createGeoFetch(nativeGet) { return createFetch(nativeGet, ENDPOINT); }
export function createDiningFetch(nativeGet) { return createFetch(nativeGet, 'https://overpass.private.coffee/api/interpreter'); }
function createFetch(nativeGet, endpoint) {
  return async (input, { signal } = {}) => {
    const url = new URL(String(input));
    if (url.origin + url.pathname !== endpoint || url.username || url.password)
      throw new TypeError('Consulta de lugares no permitida.');
    if (signal?.aborted) throw new DOMException('Consulta cancelada', 'AbortError');
    let abort;
    const aborted = new Promise((_, reject) => {
      abort = () => reject(new DOMException('Consulta cancelada', 'AbortError'));
      signal?.addEventListener('abort', abort, { once: true });
    });
    try {
      const response = await Promise.race([
        nativeGet({ url: url.href, connectTimeout: 20000, readTimeout: 20000, responseType: 'json', disableRedirects: true, headers: endpoint === ENDPOINT ? {} : {'User-Agent':'ViajaFacil/0.20 (https://github.com/juangarce34-blip/Viajaf-cil-)'} }),
        aborted
      ]);
      return {
        status: response.status,
        ok: response.status >= 200 && response.status < 300,
        json: async () => typeof response.data === 'string' ? JSON.parse(response.data) : response.data
      };
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw new TypeError('No se pudo conectar al servicio de lugares.');
    } finally { signal?.removeEventListener('abort', abort); }
  };
}

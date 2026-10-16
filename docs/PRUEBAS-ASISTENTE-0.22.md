# Evidencia de la primera integración del asistente

- Rama exclusiva: `codex/auditoria-android-2026-10-15`.
- Implementación: `52c8d76f51081fbebe7e164b1d4183552fdfc20f`.
- Corrección de rutas de caché PWA: `9f30d7452d48f525f2318a7392761ced7c1bcae4`.
- 26 pruebas unitarias locales correctas; comprobación adicional del fallback de navegación sin red en el ámbito de la PWA correcta.
- GitHub Actions 38978342657: éxito. 14 grupos de navegador, sin errores JavaScript. Avance por viaje, recarga, copias v1, destino inicial vacío y propuestas automáticas incluidos.
- GitHub Actions 38978342553: emulador Android correcto, arranque sin conexión/persistencia y exportación grande cancelable.
- Capturas reales de navegador a 320, 390 y 560 px, revisadas sin desbordamiento. Las fotos externas se bloquean en las pruebas para independizar la regresión de su disponibilidad.
- La corrección de caché modifica solo `sw.js`; Android no registra ese service worker. Se ejecuta igualmente una nueva compilación completa (38978884943) para entregar el último commit.

No se ha modificado `main` ni publicado la app. Esta versión es la primera integración del recorrido: las funciones pendientes están enumeradas en ASISTENTE-0.22.md.

## Entrega final verificada

- Ejecución 38978884943: éxito, último código `9f30d7452d48f525f2318a7392761ced7c1bcae4`.
- APK release y AAB 0.22.0 (código 6) firmados con los cinco secretos y el mismo certificado persistente de 0.21.
- SHA256 APK: `d8ef0cc012da9d6ddc28d8ec63a96d0872718bfdcb5a7f48cb744105a217711e`.
- SHA256 AAB: `fdc0d0772efceaa04f38328efdb18bea73ca572f717d6b512c9a08778cfe73ed`.
- Certificado SHA256: `1119e73a9d7343c1879a612c918fed5a349d47dc8d41fdb491704d83aa27c55f`.
- Descarga independiente: hashes correctos, certificado APK leído con keytool; integridad y certificado del AAB comprobados en 434 entradas con VerifyBundleSignature.java.
- Auditoría de dependencias de ejecución: cero vulnerabilidades conocidas.
- Proveedor gastronómico externo: HTTP 500, limitación documentada, no resuelta por esta entrega.
- `main` conserva `b4c713c4d52c829e6d9fef5029eef03e8e8e3896`.

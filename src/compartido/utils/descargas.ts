// src/compartido/utils/descargas.ts
//
// Shared kernel: descarga un Blob como archivo en el navegador.
export const descargarBlob = (blob: Blob, nombreArchivo: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = nombreArchivo;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

/*
 * Cuánto se espera antes de soltar la URL del blob.
 *
 * Un minuto parece una barbaridad para algo que ocurre «al instante». El clic
 * no copia el archivo: sólo se lo encarga al navegador, que lo lee después y
 * por su cuenta, y hasta que termina la URL tiene que seguir viva. Soltarla
 * enseguida cancela la descarga a media carrera, sin error y sin archivo, y en
 * Safari —el de iPhone en particular— pasa de sobra. Es el mismo margen ancho
 * que llevan años usando las bibliotecas que se dedican a esto.
 *
 * Lo que cuesta esperar es tener el blob en memoria un rato más. Lo que cuesta
 * no esperar es que la descarga no ocurra y nadie sepa por qué.
 */
const ANTES_DE_SOLTAR = 60_000

/**
 * Bajar un archivo al dispositivo. Parece una línea y no lo es:
 *
 *  · Firefox exige que el enlace esté dentro del documento para atender el
 *    clic; si se queda suelto en memoria, no pasa nada.
 *  · La URL se suelta tarde, por lo de arriba.
 *  · En los navegadores viejos de iOS no existe el atributo `download`; ahí lo
 *    honrado es abrir el archivo en una pestaña para que se guarde a mano.
 */
export function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const soltar = () => URL.revokeObjectURL(url)
  const a = document.createElement('a')

  if (!('download' in a)) {
    window.open(url, '_blank', 'noopener')
    setTimeout(soltar, ANTES_DE_SOLTAR)
    return nombre
  }

  a.href = url
  a.download = nombre
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.append(a)
  a.click()

  // El enlace ya no pinta nada en cuanto se ha pulsado; la URL sí.
  setTimeout(() => a.remove(), 1000)
  setTimeout(soltar, ANTES_DE_SOLTAR)

  return nombre
}

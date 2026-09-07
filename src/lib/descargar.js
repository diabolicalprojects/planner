/**
 * Bajar un archivo al dispositivo. Parece una línea y no lo es:
 *
 *  · Firefox exige que el enlace esté dentro del documento para atender el
 *    clic; si se queda suelto en memoria, no pasa nada.
 *  · Safari —y el de iPhone en particular— empieza a leer el blob DESPUÉS del
 *    clic. Si se libera la URL en la línea siguiente, la descarga se cancela
 *    a media carrera y el usuario no ve nada. Por eso se suelta más tarde.
 *  · En los navegadores viejos de iOS no existe el atributo `download`; ahí lo
 *    honrado es abrir el archivo en una pestaña para que se guarde a mano.
 */
export function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  if (!('download' in a)) {
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
    return nombre
  }

  a.href = url
  a.download = nombre
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.append(a)
  a.click()

  setTimeout(() => {
    a.remove()
    URL.revokeObjectURL(url)
  }, 1000)

  return nombre
}

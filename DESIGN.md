---
name: Planificador DIABOLICAL
description: Panel monocromo suave para la cartera de proyectos de una agencia, en pesos mexicanos.
colors:
  fondo: "#eef0f4"
  tarjeta: "#ffffff"
  hundido: "#f3f5f8"
  hundido-fuerte: "#e9edf3"
  negro: "#14161a"
  negro-suave: "#24272e"
  tinta: "#14161a"
  tinta-media: "#5c636e"
  tinta-suave: "#6f7783"
  sobre-negro: "#ffffff"
  sobre-negro-suave: "#a8aeb9"
  linea: "#e3e8ef"
  linea-fuerte: "#d3dae4"
typography:
  pagina:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  seccion:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  tarjeta:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  cifra:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.006em"
  rotulo:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.06em"
rounded:
  xs: "8px"
  s: "12px"
  m: "18px"
  l: "26px"
  pildora: "999px"
spacing:
  e1: "4px"
  e2: "8px"
  e3: "12px"
  e4: "16px"
  e5: "24px"
  e6: "32px"
components:
  boton:
    backgroundColor: "{colors.hundido}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pildora}"
    padding: "0 18px"
    height: "40px"
  boton-principal:
    backgroundColor: "{colors.negro}"
    textColor: "{colors.sobre-negro}"
    rounded: "{rounded.pildora}"
    padding: "0 18px"
    height: "40px"
  boton-principal-hover:
    backgroundColor: "{colors.negro-suave}"
  campo:
    backgroundColor: "{colors.tarjeta}"
    textColor: "{colors.tinta}"
    typography: "{typography.body}"
    rounded: "{rounded.s}"
    padding: "9px 14px"
    height: "42px"
  chip:
    backgroundColor: "{colors.hundido}"
    textColor: "{colors.tinta-media}"
    typography: "{typography.rotulo}"
    rounded: "{rounded.pildora}"
    padding: "3px 10px"
  chip-negro:
    backgroundColor: "{colors.negro}"
    textColor: "{colors.sobre-negro}"
  tarjeta:
    backgroundColor: "{colors.tarjeta}"
    rounded: "{rounded.l}"
    padding: "16px"
  lateral:
    backgroundColor: "{colors.negro}"
    textColor: "{colors.sobre-negro-suave}"
    rounded: "{rounded.l}"
    padding: "24px 16px"
    width: "232px"
---

# Design System: Planificador DIABOLICAL

## Overview

Panel monocromo suave. La dirección la fijó el usuario con tres referencias de la misma
familia: fondo gris claro, tarjetas blancas muy redondeadas con sombra baja, barra lateral
negra redondeada y botones píldora negros.

No hay color. El acento es el propio negro de la marca, que ya es monocroma, así que la
identidad y el sistema coinciden sin esfuerzo. Lo que en otros paneles hace el color —
distinguir estados — aquí lo hacen la posición en el tablero, un punto y una etiqueta escrita.

Todo el dinero está en pesos mexicanos y se formatea con `es-MX`.

## Colors

### Primary

`negro: #14161a`. Barra lateral, botones principales, tarjetas de énfasis, barras de avance y
distintivos de urgencia. Es el único acento y se usa por jerarquía, nunca por decoración.

### Neutral

`fondo: #eef0f4` es el suelo de la página. `tarjeta: #ffffff` es toda superficie de contenido.
`hundido: #f3f5f8` y `hundido-fuerte: #e9edf3` son los rellenos secundarios: botones suaves,
distintivos, bloques dentro de una tarjeta, pistas de las barras de avance.

### Named Rules

- **Tres niveles de tinta y ninguno por debajo de 4,5:1.** `tinta #14161a` (15,9:1) para
  contenido, `tinta-media #5c636e` (6,3:1) para rótulos, `tinta-suave #6f7783` (4,8:1) para
  apoyo. Sobre negro: `sobre-negro-suave #a8aeb9` da 6,4:1.
- **El estado no se dice con color.** Se dice con la columna, con un punto de forma distinta
  por estado y con la palabra escrita. Un daltónico lee este tablero igual que cualquiera.
- **Nada de opacidad para apagar texto.** Se baja al siguiente nivel de tinta, que está medido.

## Typography

Una sola familia, **Manrope**, variable de 500 a 800, autoalojada. Geométrica y humanista a la
vez: aguanta bien los pesos altos de los titulares y no pierde legibilidad a 12px.

### Hierarchy

| Uso | Peso | Tamaño |
| --- | --- | --- |
| Cifra de indicador | 800 | 34px |
| Título de página | 800 | 30px |
| Título de sección | 800 | 22px |
| Título de tarjeta | 700 | 17px |
| Texto base | 500 | 15px |
| Nombre de proyecto | 700 | 15px |
| Botón, apoyo, fila de lista | 600-700 | 13px |
| Rótulo en versalitas, distintivo | 700 | 12px |

### Named Rules

- **Los titulares llevan tracking negativo** (−0.02 a −0.04em). A pesos 800 el espaciado por
  defecto abre demasiado y el titular pierde bloque.
- **Todas las cifras van con `tabular-nums`**, declarado en `body` para que ninguna tabla ni
  columna de importes baile al cambiar un número.
- **Nada de versalitas encima de un titular.** Los rótulos en mayúscula etiquetan campos y
  columnas del panel lateral, nunca hacen de antetítulo.
- **En pantalla táctil los campos suben al escalón de 17px.** No es una licencia: por debajo de
  16px iOS amplía la página al enfocar un campo y la deja torcida. El escalón de la propia
  escala cumple el mínimo y encima se lee mejor con el teléfono en la mano.

## Layout

Rejilla de dos niveles: barra lateral de 232px y zona principal; dentro de la principal, lienzo
flexible y raíl de 296px. Separación de 16px y relleno de 16px en el marco.

- **≥1400px:** tablero de cuatro columnas junto al raíl.
- **≤1400px:** el tablero baja a dos columnas; el editor de cotizaciones deja de partirse en
  formulario y hoja.
- **≤1180px:** el raíl deja de estar al lado y pasa debajo, en dos columnas; el detalle del
  proyecto pasa a una sola columna.
- **≤900px:** la barra lateral desaparece y manda la barra inferior; el buscador se lleva su
  propia línea, las cabeceras de columna del tablero se pegan arriba y el editor de
  cotizaciones enseña una cosa cada vez, Datos o Documento.
- **≤640px:** el tablero pasa a una columna, los pares de campos se apilan, las etiquetas de
  filtro se van a un carril que se desliza y las pastillas de estado bajan de renglón antes
  que esconderse.

El raíl es `sticky`; la barra lateral también, a altura completa de ventana.

### El teléfono no es el escritorio encogido

Dos decisiones de fondo, no de tamaño:

- **La navegación baja.** La barra lateral negra es una pieza de escritorio. Apilada arriba se
  comía un tercio de la pantalla y se iba con el desplazamiento: para cambiar de vista había
  que subir del todo primero. Abajo y fija cae donde llega el pulgar y no se mueve nunca.
- **La hoja A4 y su formulario dejan de convivir.** En un teléfono eso son cuatro mil píxeles
  de formulario y luego un documento ilegible al fondo, con el botón de descarga enterrado
  debajo. Un conmutador enseña uno u otro; el botón viaja con el documento, que es donde se
  mira antes de mandarlo.

La aplicación llega hasta el borde (`viewport-fit=cover`) y los bordes seguros los reparte el
CSS con `env()`: la barra inferior nunca se mete debajo de la barra de gestos.

## Elevation & Depth

Tres alturas, todas muy bajas. La profundidad la da el contraste entre el fondo gris y el
blanco de las tarjetas, no la sombra.

### Shadow Vocabulary

| Nombre | Valor | Uso |
| --- | --- | --- |
| `--sombra-baja` | `0 1px 2px rgba(20,22,26,.04), 0 1px 3px rgba(20,22,26,.03)` | Tarjeta de proyecto, buscador, distintivo de filtro |
| `--sombra` | `0 1px 2px rgba(20,22,26,.04), 0 10px 26px -8px rgba(20,22,26,.1)` | Tarjetas de contenido, hover de una tarjeta de proyecto |
| `--sombra-alta` | `0 2px 4px rgba(20,22,26,.06), 0 18px 40px -12px rgba(20,22,26,.18)` | La tarjeta que estás arrastrando |

### Named Rules

- **Toda sombra tiene desplazamiento y desenfoque**, y va teñida del gris del fondo, nunca de
  negro puro.
- **La sombra sube con el gesto**, no con el estado: una tarjeta pasa de baja a media al pasar
  por encima y a alta mientras se arrastra.

## Shapes

Escala de esquinas creciente con el tamaño del contenedor: 8px en lo diminuto, 12px en campos
y botones cuadrados, 18px en tarjetas de proyecto y bloques, 26px en tarjetas de contenido y en
la barra lateral. Los botones y los distintivos son píldoras completas.

Un solo trazo: 1px `--linea` para separar, 1.5px en la casilla, 2px sólo para el foco y para la
columna que está recibiendo un arrastre.

## Components

### Buttons

Píldora. Tres variantes: **principal** (negro), **suave** (relleno gris) y **contorno** (trazo
de 1px). Todos bajan a `scale(0.97)` al pulsar, que es el único movimiento con el que la
interfaz responde al dedo. El icono va a la izquierda del rótulo, a 15-16px.

### Chips

Píldora gris con texto de 12px en peso 700. Con punto para estado, en negro para lo urgente y
con contorno para lo pendiente. Es el mismo objeto en el tablero, en la lista y en el detalle.

### Cards / Containers

Tarjeta blanca de radio 26 con sombra baja. Dentro, los bloques secundarios son `--hundido` a
radio 18 y sin sombra: la profundidad no se anida.

La **tarjeta de proyecto** es el objeto central: nombre, cliente, barra de avance con su
porcentaje, distintivos sólo si hay algo que avisar, y un pie separado por una línea con el
importe a la izquierda y la fecha de entrega a la derecha.

### Navigation

Barra lateral negra permanente. Sustituye a una barra de menús: lo que antes había que
desplegar para encontrar, ahora se ve siempre. El activo se invierte a blanco sobre negro. Cada
vista lleva su cuenta en un distintivo a la derecha.

**Barra inferior** (≤900px). El mismo objeto negro de esquinas redondeadas, en horizontal,
flotando sobre el contenido con tope de 460px para que en una tableta no quede estirado.
Cuatro pestañas: Tablero, Proyectos, Cotizaciones y Más. La inversión que marca lo activo se
aplica a escala de icono —pastilla blanca detrás del glifo, rótulo en blanco—, porque una
pastilla con rótulo dentro no cabe cuatro veces en 360px. Sin cuentas: la cifra vive en la
página, no en la pestaña.

**Más** es una página, no un desplegable: exportar, importar, atajos y acerca de, en filas
altas con icono, rótulo y una línea de apoyo. En el escritorio esas entradas ya están siempre
a la vista en la lateral.

### Forms

Rótulo en versalitas encima, campo debajo, pista debajo del campo. Nunca marcador de posición
como etiqueta. El campo enfocado toma el borde negro y un halo de 3px al 8%.

El importe lleva el signo `$` fuera del campo, para que lo que se teclea sea sólo la cifra.

Las áreas de texto crecen con lo que se escribe. Con alto fijo, una nota de cinco líneas se
lee por una mirilla de tres, y en un teléfono eso hace el campo inservible.

### Data display

La barra de avance es la única visualización del producto y siempre acompaña a su cifra:
nunca se muestra un porcentaje sin las tareas que lo producen, ni un total sin la desviación
que lo explica.

## Do's and Don'ts

**Sí**

- Decir el estado con posición, forma y palabra, no con color.
- Acompañar toda cifra de la desviación que la explica.
- Dar alternativa de teclado a todo gesto de arrastre y anunciar el cambio en una región viva.
- Formatear todo el dinero con `es-MX` y decir «MXN» donde haya duda.
- Mantener la sombra baja y dejar que el contraste de fondo haga la profundidad.

**No**

- Dejar un objetivo táctil por debajo de 44px. La forma puede quedarse en 38 —una tira de
  filtros de 44 es una franja gorda encima del contenido—, pero entonces el área crece por
  debajo, invisible, y sólo a lo alto: a lo ancho pisaría al vecino.
- Esconder tras un deslizamiento una opción que hay que ver para elegir. Cuatro estados
  excluyentes bajan de renglón; las etiquetas, que son abiertas y secundarias, sí se deslizan.
- Bloquear el desplazamiento táctil para permitir un arrastre. En pantalla táctil el arrastre
  del tablero se desactiva y el estado se cambia desde el proyecto.
- Introducir un color, ni siquiera para los errores: la marca es monocroma.
- Anidar tarjetas con sombra dentro de tarjetas con sombra.
- Usar opacidad para apagar texto en vez del siguiente nivel de tinta.
- Poner una versalita encima de un titular.
- Escribir un porcentaje suelto sin la magnitud de la que sale.

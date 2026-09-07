# Planificador · DIABOLICAL

Planificador de proyectos de la agencia. Corre en local, sin cuentas ni servidor.

## Arrancarlo

```bash
npm install
npm run dev
```

Abre `http://localhost:5180`. La primera vez verás proyectos de ejemplo; el aviso de arriba
los borra de un clic cuando metas los tuyos.

## Cómo funciona

- **El tablero** tiene cuatro columnas: Idea · En curso · Pausado · Entregado. Se arrastra
  la tarjeta de una columna a otra para cambiar el estado.
- **Proyectos** es la misma cartera en tabla, ordenable por cualquier columna, para cuando
  lo que quieres es comparar cifras.
- **Cada proyecto** tiene nombre, cliente, fechas, presupuesto, cobro, tareas, notas, enlace
  y etiquetas. Los campos están vivos: lo que escribes ya está guardado.
- **Hay dos tipos de proyecto.** *De cliente* es lo que alguien te cotizó y te va a pagar.
  *Producto propio* es lo que lanza la agencia por su cuenta: no tiene cliente, no se cobra,
  su fecha es la de **lanzamiento** y su importe es **inversión**. El segmentado de arriba
  filtra entre los dos, y con «Producto propio» puesto la última columna se llama *Lanzado*.
- **La caja sólo cuenta dinero de clientes.** Lo que gastas en producto propio va en su propia
  tarjeta, porque sumarlo mentiría sobre lo que tienes por cobrar.
- **El resumen** de la derecha suma la cartera. Ninguna cifra va sola: cada total lleva la
  desviación que la explica.
- **Todo el dinero está en pesos mexicanos**, con formato `es-MX`.

## Atajos

| Tecla | Qué hace |
| --- | --- |
| `Ctrl + N` | Nueva ficha |
| `Ctrl + 1` | Ir al tablero |
| `Ctrl + 2` | Ir a la lista de proyectos |
| `Ctrl + K` | Ir al buscador |
| `Esc` | Volver al tablero |
| `Intro` | Abrir el proyecto enfocado |
| `Alt + ← →` | Mover el proyecto de columna |

## Dónde viven los datos

En el `localStorage` de este navegador, bajo la clave `diabolical.planificador.v1`. No sale
nada a ninguna red.

Haz copias con **Fichero › Exportar JSON**: baja un archivo `diabolical-proyectos-AAAA-MM-DD.json`
con toda la pila. **Importar JSON** la devuelve, aquí o en otro ordenador. Si vacías los datos
del navegador sin haber exportado, la pila se va con ellos.

## Producción

```bash
npm run build
npm run preview
```

## Cómo está hecho

Vite + React 19 en JavaScript. Sin backend, sin router y sin librería de estado ni de estilos:
un `localStorage`, un hook y CSS propio. Las únicas dependencias son la tipografía Manrope y
los iconos Phosphor, servidos desde el propio proyecto para que funcione sin conexión.

La interfaz es un panel monocromo suave: fondo gris claro, tarjetas blancas de esquinas muy
redondeadas con sombra muy baja, barra lateral negra y botones píldora negros. No hay ningún
color: el acento es el propio negro de la marca, y el estado se dice con la posición en el
tablero, un punto y una etiqueta, nunca con un color que haya que aprender.

El sistema completo está en [DESIGN.md](DESIGN.md).

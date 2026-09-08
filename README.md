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
- **Las tareas van en orden de prioridad.** Se arrastran por el asa de la izquierda o se mueven
  con `Alt` y las flechas. El orden que ves es el que se guarda: la base lo conserva en la
  columna `orden` de la tabla `tareas`.
- **Las tareas llevan responsable.** Un disco con las iniciales en cada tarea, y los discos
  apilados en la tarjeta del tablero para ver de un vistazo quién anda en qué. Es texto libre
  con autocompletado de la gente que ya aparece: aquí no hay entidad «equipo».
- **Cotizaciones.** Documentos con folio, alcance por componentes con sus entregables,
  inversión en pesos (con IVA opcional), notas destacadas y condiciones. Se editan con la hoja
  A4 al lado, actualizándose mientras escribes. Cada una se emite **con la marca DIABOLICAL**
  (banda negra con el logotipo) o **como particular** (sólo el nombre de quien firma, sin
  rastro de la agencia). *Nueva versión* duplica la cotización subiendo el folio a V2, V3…
- **El archivo sale con el nombre del cliente delante**, no con el folio:
  `Agencia de Medios Hidroforum · Lanzamiento de políticz.mx · COT-2026-0907-V1.pdf`. Ordenados
  por folio, una carpeta de descargas son veinte archivos que empiezan por «COT-2026-» y hay que
  abrirlos uno a uno para saber cuál es cuál. El folio se queda al final, que es lo único que
  separa la V1 de la V2 del mismo trabajo.
- **El PDF se descarga, no se imprime.** Se arma en el propio navegador: es vectorial, el texto
  se puede seleccionar y Manrope viaja dentro del archivo. Sin diálogo de imprimir y sin
  servidor. La librería que lo hace pesa más que toda la aplicación, así que se carga sólo al
  pulsar el botón: quien entra a mirar no la paga.
- **Sirve desde el teléfono.** Navegación fija abajo, al alcance del pulgar; formularios en
  una columna; y el editor de cotizaciones partido en *Datos* y *Documento*, para no bajar
  cuatro mil píxeles de formulario antes de ver la hoja. No es el escritorio encogido.
- **Los cobros se apuntan uno a uno.** Un proyecto no se cobra de golpe: entra el anticipo y
  luego el resto. Cada cobro lleva importe y fecha, y la caja de la cartera suma de ahí. Antes
  era una casilla de sí o no, y con eso un proyecto con la mitad ya en la cuenta salía como
  pendiente entero.
- **De cotización aprobada a proyecto, con un botón.** Se lleva el cliente, el importe y cada
  componente del alcance como tarea. Antes había que volver a teclear a mano lo que ya estaba
  escrito al lado.
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
| `Alt + ↑ ↓` | Subir o bajar la tarea enfocada |

## Dónde viven los datos

La app funciona de dos maneras y decide sola cuál, preguntando por `/api/salud` al arrancar:

- **Con servidor** (el despliegue): habla con `/api` y los datos viven en Postgres.
- **Sin servidor** (`npm run dev` a secas): guarda en el `localStorage` de este navegador,
  bajo la clave `diabolical.planificador.v1`, y no sale nada a ninguna red.

En el despliegue hay una puerta: una contraseña compartida que se comprueba en el servidor.
Lo que queda después es una cookie firmada, `HttpOnly`, que dura catorce días y que ni este
código ni ningún script de la página pueden leer. Ocho intentos fallidos desde la misma
dirección cierran la puerta cinco minutos.

Haz copias con **Fichero › Exportar JSON**: baja un archivo `diabolical-proyectos-AAAA-MM-DD.json`
con toda la pila. **Importar JSON** la devuelve, aquí o en otro ordenador. Si vacías los datos
del navegador sin haber exportado, la pila se va con ellos.

## Producción

```bash
npm run build
npm start
```

`npm start` levanta el servidor de `servidor/indice.js`, que sirve el build y la API. Necesita
`DATABASE_URL`; copia `.env.example` y rellénalo.

### Despliegue

Se despliega en Dokploy desde este repositorio con el `Dockerfile` de dos etapas.

| Variable | Para qué |
| --- | --- |
| `DATABASE_URL` | Conexión a Postgres. En Dokploy el host es el `appName` del servicio de base de datos. |
| `CLAVE_HASH` | **Obligatoria.** El hash de la contraseña de acceso. Sin ella la API no sirve nada. |
| `SECRETO_SESION` | Con qué se firman las sesiones. **Vale tanto como la contraseña**: quien la tenga puede fabricarse un vale de entrada válido. Sin ella se inventa una al arrancar y cada despliegue echa a todo el mundo. |
| `PORT` | Puerto dentro del contenedor. Por defecto 3000. |
| `SEMBRAR` | A `1` siembra proyectos, **sólo si la base está completamente vacía**. Nunca pisa datos. |
| `SEMILLA_JSON` | Opcional. Un JSON exportado desde la app, para sembrar datos propios sin escribirlos en el repositorio. |
| `PERMITIR_SIN_CLAVE` | A `1` deja la API abierta sin contraseña. **Sólo para una máquina que no mire a Internet.** |

El esquema se aplica solo al arrancar (`CREATE TABLE IF NOT EXISTS`), así que un despliegue
nuevo no necesita ningún paso a mano. Para sembrar aparte: `npm run semilla` (y `--forzar` si
de verdad quieres pisar lo que haya).

### La contraseña

```bash
npm run clave
```

Pide la contraseña dos veces y escupe las dos líneas que hay que pegar en las variables de
entorno de Dokploy. En PowerShell o cmd no se ve lo que tecleas; en Git Bash sí, porque esa
terminal no deja ocultarlo —el script lo avisa antes en vez de dejarte creer que está oculto—.
Si te importa, ejecútalo en PowerShell: `node servidor/clave.js`. La contraseña no sale de tu máquina: no viaja por los
argumentos —que quedan en el historial del intérprete y en la lista de procesos— ni se guarda
en ningún archivo. Lo que se copia es el hash, que no sirve para entrar.

Si el acceso no te deja entrar y no sabes de qué lado está el problema:

```bash
npm run clave -- --probar
```

Tecleas la contraseña, pegas el `CLAVE_HASH` que hay en el servidor y te dice si abren la misma
puerta. Todo en tu máquina, sin red. Si coinciden, sospecha del navegador —rellenado automático
de una contraseña vieja guardada, sobre todo—; si no coinciden, la que estás tecleando no es la
que se firmó.

Sin `CLAVE_HASH`, el servidor arranca pero **la API contesta 503 a todo**. Es a propósito:
antes de esto la API estaba abierta y cualquiera que supiera la dirección podía leerse o
borrarse la cartera entera. Fallar con un error claro es mejor que servir sin candado.

El acceso sólo existe cuando hay servidor. En `npm run dev`, sin backend, no hay a quién
preguntar ni nada que proteger: los datos están en el navegador de quien mira la pantalla.

## Cómo está hecho

Vite + React 19 en JavaScript. Sin backend, sin router y sin librería de estado ni de estilos:
un `localStorage`, un hook y CSS propio. Las únicas dependencias son la tipografía Manrope y
los iconos Phosphor, servidos desde el propio proyecto para que funcione sin conexión.

La interfaz es un panel monocromo suave: fondo gris claro, tarjetas blancas de esquinas muy
redondeadas con sombra muy baja, barra lateral negra y botones píldora negros. No hay ningún
color: el acento es el propio negro de la marca, y el estado se dice con la posición en el
tablero, un punto y una etiqueta, nunca con un color que haya que aprender.

El sistema completo está en [DESIGN.md](DESIGN.md).

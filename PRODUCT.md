# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + JavaScript (sin TypeScript), decidido por el usuario. Sin backend: la app corre en local con `npm run dev`. Persistencia en `localStorage` con exportación/importación de un archivo `.json` de respaldo (elegido por el usuario frente a un servidor Node que escriba en disco).

## Users

Un usuario único: el propio operador de DIABOLICAL IA SERVICES, gestionando la cartera de proyectos de su agencia (webs, landings, automatizaciones IA, branding) para clientes. Trabaja en su máquina, sin equipo ni cuentas ni login. El trabajo real es responder rápido a "¿qué tengo en marcha, qué se entrega pronto y qué está cobrado?".

## Product Purpose

Planificador local de proyectos de agencia. Permite dar de alta un proyecto, moverlo por sus estados hasta la entrega, trocearlo en tareas y saber qué queda por cobrar. Éxito = abrir la app y entender la situación completa de la cartera en un vistazo, sin abrir hojas de cálculo ni herramientas de equipo.

## Positioning

Herramienta personal, no colaborativa: cero cuentas, cero nube, cero sincronización. Los datos son del usuario y viven en su navegador, con un `.json` exportable como copia y como formato de intercambio. Es un planificador con la identidad visual de la propia agencia, no una herramienta genérica adaptada.

## Operating Context

Uso de escritorio, sesiones cortas y frecuentes (revisar por la mañana, actualizar estado tras una llamada de cliente, marcar tareas al cerrar el día). Vista principal: tablero por estado tipo Kanban con las columnas Idea · En curso · Pausado · Entregado, donde la tarjeta se arrastra de columna para cambiar de estado.

## Capabilities and Constraints

- CRUD completo de proyectos: crear, leer, editar, eliminar.
- Dos tipos de proyecto. **De cliente**: alguien lo cotizó, tiene presupuesto y se cobra.
  **Interno**: producto propio de la agencia que no cotiza nadie y hay que sacar al mercado;
  su fecha clave es el lanzamiento y su importe es inversión, no ingreso.
- La caja (presupuestado, cobrado, pendiente) cuenta SÓLO proyectos de cliente. La inversión
  en producto propio se suma aparte: mezclarlas mentiría sobre lo que hay por cobrar.
- Campos por proyecto: nombre, cliente, estado, fecha de inicio, fecha de entrega; presupuesto e indicador de cobrado/pendiente; lista de tareas con check y progreso calculado; notas libres, enlace (web/repo) y etiquetas.
- Cada tarea puede tener una persona responsable (texto libre con autocompletado; no existe
  una entidad «equipo» en el producto).
- Filtrado y búsqueda por cliente, etiqueta, responsable y texto.
- Totales agregados de cartera (presupuestado, cobrado, pendiente) visibles sin entrar a ningún proyecto.
- Exportar e importar toda la base como archivo `.json`.
- Persistencia doble según dónde corra: Postgres cuando hay servidor (el despliegue en
  planner.diabolicalservices.tech), `localStorage` cuando no lo hay (`npm run dev`).
- Restricciones: sin autenticación y sin multi-usuario. Es la herramienta de una persona.
- Terminología en español (el usuario escribe y trabaja en español).
- Toda cifra de dinero está en pesos mexicanos (MXN), con formato `es-MX`.

## Brand Commitments

Dirección visual fijada por el usuario: panel monocromo suave, en la familia de las tres
referencias que aportó (fondo gris claro, tarjetas blancas muy redondeadas con sombra baja,
barra lateral negra redondeada, botones píldora negros, una sola tipografía geométrica). El
usuario tomó esta dirección explícitamente frente al mundo de un bit construido antes; es una
preferencia permanente, no un experimento.

DIABOLICAL · IA SERVICES. Identidad estrictamente monocroma (negro y blanco): los seis SVG/PNG de marca entregados no contienen ningún otro color. Mascota: criatura de un solo ojo con cuernos, en negativo dentro de un cuadrado de esquinas muy redondeadas. Wordmark geométrico de palo seco, ancho y macizo, con la línea inferior "IA SERVICES" en mayúsculas y tracking muy abierto. Activos disponibles en la raíz del proyecto:
- `ICONO-DIABOLICAL-{BLANCO,NEGRO}.svg` (marca sola, 97×90)
- `LOGO-DIABOLICAL-CUADRADO-{BLANCO,NEGRO}.svg`
- `LOGO-DIABOLICAL-HORIZONTAL-{BLANCO,NEGRO}.svg` (352×90) + versiones `@2x.png`

## Evidence on Hand

Sólo los archivos de marca listados arriba. No hay clientes, cifras, testimonios, capturas ni datos reales aportados: cualquier proyecto que aparezca en la app es dato de ejemplo del propio usuario y debe poder borrarse. No inventar clientes reales ni métricas de la agencia.

## Product Principles

1. Un vistazo basta. El estado de la cartera se lee sin clicar; el detalle se pide, no se impone.
2. Cero fricción de arranque: `npm install && npm run dev` y ya hay algo usable, sin configurar nada.
3. Los datos son del usuario: siempre exportables, nunca atrapados.
4. La marca vive en la precisión (tipografía, geometría, monocromo), no en adornos añadidos.
5. Español en toda la interfaz.

## Accessibility & Inclusion

Sin requisito específico declarado por el usuario. Se asume el suelo razonable: la app debe ser operable con teclado (el arrastre del Kanban necesita una alternativa accesible) y el contraste del monocromo no debe caer por debajo de lo legible.

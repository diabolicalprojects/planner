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

Escritorio y teléfono, sesiones cortas y frecuentes (revisar por la mañana, actualizar estado tras una llamada de cliente, marcar tareas al cerrar el día). El usuario pidió expresamente poder **cotizar y planificar desde el celular**: fuera de la oficina, de pie y con una mano, justo después de una reunión.

Vista principal: tablero por estado tipo Kanban con las columnas Idea · En curso · Pausado · Entregado, donde la tarjeta se arrastra de columna para cambiar de estado. En pantalla táctil el arrastre se desactiva —exige bloquear el desplazamiento del dedo, y ese cambio no compensa— y el estado se cambia desde el propio proyecto, a dos toques.

## Capabilities and Constraints

- CRUD completo de proyectos: crear, leer, editar, eliminar.
- Dos tipos de proyecto. **De cliente**: alguien lo cotizó, tiene presupuesto y se cobra.
  **Interno**: producto propio de la agencia que no cotiza nadie y hay que sacar al mercado;
  su fecha clave es el lanzamiento y su importe es inversión, no ingreso.
- La caja (presupuestado, cobrado, pendiente) cuenta SÓLO proyectos de cliente. La inversión
  en producto propio se suma aparte: mezclarlas mentiría sobre lo que hay por cobrar.
- **El cobro es una lista, no un sí/no.** Un proyecto se cobra por partes —«50% de anticipo y
  50% contra entrega» lo dicen las propias cotizaciones—, así que cada cobro se apunta con su
  importe y su fecha. Lo cobrado se suma de ahí y no se guarda aparte. El modelo viejo, que era
  binario, se convierte solo: un `cobrado: true` pasa a ser un cobro por el importe completo.
- Campos por proyecto: nombre, cliente, estado, fecha de inicio, fecha de entrega; presupuesto e indicador de cobrado/pendiente; lista de tareas con check y progreso calculado; notas libres, enlace (web/repo) y etiquetas.
- Módulo de cotizaciones: documento con folio versionado, alcance por componentes con sus
  entregables, inversión en pesos con IVA opcional, notas destacadas y condiciones. Se emite
  con la marca de la agencia o como particular.
- El PDF se **descarga directamente**, sin pasar por el diálogo de imprimir: se arma en el
  propio navegador, es vectorial, el texto se puede seleccionar y la tipografía viaja dentro
  del archivo. La librería que lo hace pesa más que la aplicación entera, así que se carga sólo
  al pulsar el botón. Cuántas hojas ocupa se lee del PDF ya hecho, no de la vista previa: la
  previa es HTML y no corta por donde corta el PDF.
- Las tareas de un proyecto se ordenan a mano: el orden de la lista es el orden de prioridad.
- Cada tarea puede tener una persona responsable (texto libre con autocompletado; no existe
  una entidad «equipo» en el producto).
- Una cotización aprobada **se convierte en proyecto** con un botón: se lleva el cliente, el
  importe total y cada componente del alcance como tarea, en el mismo orden. Queda enlazada, así
  que no se puede convertir dos veces y contar el dinero por duplicado.
- Filtrado y búsqueda por cliente, etiqueta, responsable y texto.
- Totales agregados de cartera (presupuestado, cobrado, pendiente) visibles sin entrar a ningún proyecto.
- Exportar e importar toda la base como archivo `.json`.
- Persistencia doble según dónde corra: Postgres cuando hay servidor (el despliegue en
  planner.diabolicalservices.tech), `localStorage` cuando no lo hay (`npm run dev`).
- La interfaz sirve igual en teléfono: navegación en barra inferior fija, formularios en una
  columna, objetivos táctiles de 44px y el editor de cotizaciones partido en Datos y Documento.
- Acceso con **una contraseña compartida**, comprobada en el servidor, con sesión en cookie
  firmada de catorce días. Existe sólo cuando hay servidor: en local no hay nada que proteger.
  No hay cuentas ni roles: quien tiene la contraseña entra, y todos ven y tocan lo mismo.
- Restricciones: sin cuentas individuales. Es la herramienta de una casa pequeña, no de un
  equipo con permisos.
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

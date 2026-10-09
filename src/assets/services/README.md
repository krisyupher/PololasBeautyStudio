# Fotos del sitio

Todas las fotos se toman automáticamente al compilar y Astro las optimiza. Las actuales se
recortaron del catálogo impreso, así que son pequeñas: **puedes reemplazar cualquiera por una
versión original de mayor resolución con el mismo nombre de archivo** y el sitio la usará sin
más cambios. Formatos: jpg, jpeg, png, webp o avif.

## Tratamientos: `src/assets/services/`

Una foto por tratamiento, nombrada con el `id` del tratamiento en `src/data/services.json`
(por ejemplo `toxina-botulinica.jpg`, `masaje-relajante.webp`). Aparece en la fila del
tratamiento (inicio y catálogo) y en su página. Sin foto, se muestra el ícono de línea.
Proporción recomendada 3:2, mínimo 600 px de ancho.

## Categorías: `src/assets/categories/`

La foto grande de cada sección del inicio, nombrada con el `id` de la categoría en
`src/data/categories.json` (`estetica-facial.jpg`, `bienestar.jpg`, `estetica-corporal.jpg`).
También acompaña la página de cada tratamiento de esa categoría. Vertical, mínimo 900 px de ancho.

## Círculos destacados: `src/assets/highlights/`

Las portadas de los destacados de Instagram que aparecen como círculos en el inicio:
`toxina.jpg`, `labios.jpg`, `rino.jpg` y `bio.jpg`. Cuadradas, mínimo 480 px.

## Foto de cierre: `src/assets/gracias.jpg`

La foto de la sección "Gracias" (contacto) al final del inicio. Vertical, mínimo 1000 px de ancho.

Usa solo fotos propias o con autorización escrita de la persona que aparece.

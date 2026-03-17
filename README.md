# Senderos Tannat Landing Page

Landing page estatica lista para subirse a GitHub y desplegarse en Vercel sin modificar el HTML original.

## Estructura

- `code.html`: pagina principal original
- `screen.png`: captura de referencia
- `vercel.json`: hace que Vercel sirva `/` desde `code.html`

## Subir a GitHub

1. Crea un repositorio nuevo en GitHub.
2. Sube el contenido de esta carpeta.
3. Usa un nombre de repo sin espacios si quieres una URL mas limpia.

## Deploy en Vercel

1. Importa el repositorio desde Vercel.
2. Vercel detectara un sitio estatico.
3. La raiz `/` abrira `code.html` automaticamente por la configuracion de `vercel.json`.

## Nota

No se cambio el contenido de `code.html`.

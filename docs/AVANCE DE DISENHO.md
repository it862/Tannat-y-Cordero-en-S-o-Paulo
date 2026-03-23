# AVANCE DE DISEÑO Y DESARROLLO

Este documento registra los cambios recientes implementados en la landing page del evento "Tannat y Cordero en São Paulo".

## 1. Estrategia de Precios Dinámicos (Pré-Venda)
Se implementó un sistema de precios diferenciados basado en fechas para incentivar la compra temprana.
- **`config.js`:**
  - `FULL_PRICE`: Se define el precio final completo (R$ 165).
  - `PRESALE_DISCOUNT`: Se define el porcentaje de descuento (40%).
  - `PRESALE_DEADLINE`: Fecha y hora límite en la que finaliza la preventa.
- **`app.js`:**
  - Lógica para calcular `presalePrice` dinámicamente.
  - El precio base (`FULL_PRICE`) se muestra tachado cuando el usuario goza de la preventa (`presalePrice`).
  - Se agregó un "Badge" o etiqueta visual en el frontend que indica que la oferta es de preventa.

## 2. Timer / Contador de Cuenta Regresiva
- **`app.js`:** Se implementó una función (`startCountdown`) que cuenta hacia atrás hasta la fecha límite de preventa (`PRESALE_DEADLINE`).
- **Comportamiento Visual:** El timer muestra en tiempo real cuántos días, horas, minutos y segundos faltan para que cambie el precio.
- **Finalización Automática:** Cuando el reloj llega a cero, la página se recarga automáticamente. La lógica de frontend detecta que el plazo finalizó, escondiendo el listado de tiempo, el badge de descuento, el precio tachado y actualizando el valor principal al precio normal de manera automática.

## 3. Automatización de Despliegue (Deploy)
- **`deploy.bat`:** Script automatizado (`.bat`) para facilitar el versionado y deploy del código fuente. Con solo doble clic, el script:
  1. Verifica el estado y los cambios con Git.
  2. Ejecuta `git add -A`.
  3. Ejecuta un `commit` adjuntando fecha y hora (ej: `auto-deploy: 2026-03-23 11:21`).
  4. Realiza `git push origin main` hacia GitHub.
  5. Contiene control de errores.

## 4. Pruebas de Pagos con n8n y Pagar.me
- **Test Hardcodeado (Valor 5 BRL):** Se implementó una traba temporal en `app.js` en la función de envío de datos del formulario a n8n.
  - En vez de enviar el multiplicador dinámico del precio (`window._CURRENT_UNIT_PRICE * currentQty`), se configuró el sistema para que le pase la variable `amount: 500`.
  - Recordar que Pagar.me espera siempre pagos en **centavos**, por lo tanto al definir `500 centavos`, la plataforma procesa exitosamente un pago simulado por el valor final de **5 BRL**.
  - **ATENCIÓN:** Esto no afecta a la visual de la página en el navegador (el usuario sigue viendo su carrito por ~R$ 99). A la hora de publicar en Producción se debe revertir la línea correspondiente en `app.js`.

---
*Documento autogenerado para registrar los últimos avances de la implementación de Senderos.*

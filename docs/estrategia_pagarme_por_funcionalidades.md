# Estrategia de integracion Pagar.me por funcionalidades

Fecha: 2026-03-21

## Objetivo

Aplicar Pagar.me a esta landing sin romper la logica actual del proyecto:

- el usuario completa el formulario
- la landing envia un `POST`
- el backend devuelve una `redirect_url`
- el usuario termina el pago en un entorno seguro
- el sistema confirma por webhook y dispara la entrega del QR

Esa arquitectura ya existe en la pagina actual, porque `index.html` envia el formulario a un webhook de `n8n` y espera una `redirect_url`.

## Lo que ya tiene este repo

La landing ya resuelve varias piezas clave:

- captura `nombre`, `email`, `telefono`, `pais` y `cantidad`
- calcula el total en frontend
- envia `amount`, `currency`, `event`, `quantity` y datos del comprador
- redirige al usuario cuando recibe `redirect_url`
- comunica una promesa funcional clara: pago seguro + QR por WhatsApp

Por lo tanto, Pagar.me no debe entrar como una capa paralela. Debe reemplazar el proveedor de pago manteniendo el mismo contrato funcional.

## Estrategia recomendada

Para este proyecto, la integracion mas limpia no es un checkout totalmente custom con tarjeta dentro de la landing. Lo recomendable es:

1. Mantener la landing como capturadora de reserva.
2. Mantener `n8n` o una function backend como orquestador.
3. Hacer que ese backend cree el pago en Pagar.me.
4. Devolver a la landing una `redirect_url` o enlace de checkout.
5. Confirmar el pago de forma asincrona con webhook.
6. Solo despues del webhook emitir QR, ticket y mensaje por WhatsApp.

## Por que esta estrategia encaja mejor

### 1. Respeta la arquitectura existente

El frontend ya esta diseñado para:

- mandar un payload unico
- bloquear el boton
- esperar una respuesta JSON
- leer `redirect_url`
- redirigir

Entonces el cambio real ocurre en backend, no en la experiencia base.

### 2. Evita exponer logica sensible en frontend

Segun la documentacion oficial de Pagar.me:

- la `secret_key` debe vivir solo en backend
- la `public_key` se usa para operaciones limitadas como tokenizacion

Para esta landing, donde hoy no existe infraestructura de tarjeta inline, meter tokenizacion completa en el navegador agrega complejidad sin necesidad.

### 3. Preserva la promesa comercial del flujo

La pagina vende cupos para un evento puntual. El flujo correcto no es "lead primero, pago despues manual", sino:

- reserva
- pago
- confirmacion
- ticket

Pagar.me encaja bien si el backend trata cada envio del formulario como intencion de compra y crea un `order`.

## Funcionalidades y como mapearlas a Pagar.me

## 1. Captura de reserva

### Estado actual

La landing ya captura:

- nombre completo
- email
- telefono
- pais
- cantidad
- monto total

### Aplicacion con Pagar.me

Ese payload debe transformarse en un `order` de Pagar.me con:

- `items`
- `customer`
- `payments`
- `metadata`

### Recomendacion

Guardar tambien un identificador interno propio, por ejemplo:

- `senderos_order_id`
- `event_code`
- `booking_reference`

Ese identificador debe viajar en `metadata` para reconciliar pagos y reservas.

## 2. Precio y cantidad

### Estado actual

La landing calcula:

- precio unitario fijo
- cantidad
- total

### Aplicacion con Pagar.me

El backend debe reconstruir el monto, no confiar ciegamente en el total enviado desde el navegador.

### Regla recomendada

El servidor debe recalcular:

- `unit_price`
- `quantity`
- `amount`

con base en configuracion interna del evento.

### Motivo

Esto evita manipular el precio desde DevTools o requests alteradas.

## 3. Medio de pago

### Opcion recomendada para esta landing

Usar checkout alojado o un flujo de pago externo generado por backend.

### Motivo

Es la opcion mas alineada con este repo porque:

- no exige capturar tarjeta dentro del HTML
- reduce complejidad PCI
- mantiene la redireccion ya prevista por el frontend

### Opcion de segunda fase

Si mas adelante quieres subir conversion, puede evaluarse:

- Pix directo
- tarjeta con tokenizacion
- boleto

pero eso ya implica mayor detalle de producto y operacion.

## 4. Confirmacion de pago

### Estado actual deseado

La pagina promete:

- pago seguro
- confirmacion inmediata
- QR automatico por WhatsApp

### Aplicacion con Pagar.me

Eso no debe depender solo de la respuesta del `POST` inicial.

La confirmacion real debe ocurrir por webhook.

### Regla de negocio

Solo cuando Pagar.me confirme el estado exitoso del cobro, el sistema debe:

- marcar la reserva como pagada
- generar ticket o QR
- enviar WhatsApp
- mostrar `success.html`

## 5. Webhooks y automatizacion

### Rol de n8n

`n8n` sigue siendo util. No sobra.

Debe usarse para:

- crear el pedido en Pagar.me
- guardar la operacion en base de datos o planilla
- recibir el webhook de Pagar.me
- emitir QR
- mandar WhatsApp
- mandar email

### Flujo recomendado

1. `index.html` envia reserva a `n8n`.
2. `n8n` valida y recalcula monto.
3. `n8n` crea `order` en Pagar.me.
4. `n8n` responde a la landing con `redirect_url`.
5. El usuario paga.
6. Pagar.me dispara webhook.
7. `n8n` valida estado.
8. `n8n` emite QR y notificaciones.

## 6. Idempotencia y cupos

### Riesgo real

En eventos, el usuario puede:

- hacer doble click
- reenviar el formulario
- abrir dos pestañas
- volver atras y repetir el proceso

### Aplicacion con Pagar.me

La creacion del pedido debe usar `Idempotency-key`.

### Regla recomendada

Generar una clave por intento logico de compra y persistirla.

Ademas, el sistema de cupos debe reservar stock de forma temporal o confirmar stock solo despues de pago exitoso.

## 7. Multimoneda y pais

### Observacion funcional

La landing hoy muestra:

- precio en `BRL`
- selector de pais
- narrativa centrada en Sao Paulo

### Recomendacion

Para esta primera integracion con Pagar.me, conviene simplificar:

- cobrar en `BRL`
- operar evento Brasil
- usar `country` como dato de comprador, no como disparador de monedas distintas

### Motivo

Pagar.me esta mucho mas alineado a operacion brasilena. Si quieres multi-pais real con moneda local por pais, eso ya es otra capa de negocio.

## 8. Estados funcionales que deberia soportar el sistema

Estados internos recomendados:

- `draft`
- `pending_payment`
- `paid`
- `payment_failed`
- `canceled`
- `refunded`
- `ticket_sent`

Estos estados deben vivir fuera del HTML, en backend o en la automatizacion.

## 9. Estrategia tecnica minima viable

La implementacion mas pragmatica para este repo es:

- mantener `index.html` casi igual
- cambiar el webhook de `n8n` para que cree el pago en Pagar.me
- responder con una URL de pago
- procesar webhook de confirmacion
- disparar entrega automatica del QR

Eso permite integrar Pagar.me sin rehacer la landing.

## 10. Evolucion por fases

### Fase 1

- reserva
- creacion de `order`
- checkout externo
- webhook
- QR por WhatsApp

### Fase 2

- panel de conciliacion
- control de cupos en tiempo real
- reenvio manual de ticket
- reintentos automáticos de notificacion

### Fase 3

- Pix nativo
- tarjeta tokenizada
- wallet de clientes
- campañas y recompra

## Decision final recomendada

La mejor estrategia para este repo es usar Pagar.me como motor de pagos backend, no como logica embebida dentro del frontend.

En otras palabras:

- la landing sigue siendo la puerta de entrada comercial
- `n8n` o una function backend sigue siendo el cerebro orquestador
- Pagar.me pasa a ser el proveedor que crea y confirma el pago
- el QR y la operacion post-pago siguen en automatizacion

Eso mantiene simple el frontend, reduce riesgo y encaja con la arquitectura ya presente en este proyecto.

## Fuentes oficiales consultadas

- https://docs.pagar.me/docs/chaves-de-acesso
- https://docs.pagar.me/docs/o-que-%C3%A9
- https://docs.pagar.me/reference/criar-pedido-2
- https://docs.pagar.me/reference/vis%C3%A3o-geral-sobre-pagamento
- https://docs.pagar.me/reference/eventos-de-webhook-1
- https://docs.pagar.me/reference/erros-1

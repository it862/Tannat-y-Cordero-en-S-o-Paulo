/**
 * =============================================
 *  CONFIGURACIÓN CENTRAL – São Paulo Festival
 * =============================================
 *
 *  Todos los parámetros del evento, precios,
 *  credenciales públicas y endpoints viven acá.
 *  El resto del JS (app.js) solo lee window.CONFIG.
 */

window.CONFIG = {

  // ── Evento ─────────────────────────────────
  EVENT_ID:   'tannat_cordero_sp',
  EVENT_NAME: 'Tannat y Cordero en São Paulo',

  // ── Precios ────────────────────────────────
  UNIT_PRICE: 5,          // Precio de prueba en frontend (R$)
  CURRENCY: 'BRL',        // Moneda
  MAX_QTY:    10,         // máximo de entradas por compra

  // ── n8n backend ────────────────────────────
  N8N_WEBHOOK_URL: 'https://n8n.axion380.com.br/webhook/evento-reserva',

  // ── Pagar.me (credenciales públicas) ───────
  PAGARME_ACCOUNT_ID: 'acc_bwqjx06carfnM5PJ',
  PAGARME_PUBLIC_KEY: 'pk_1aegVYTxbI813nBW',

  // ── Contador de cupos dinámico ─────────────
  SPOTS_ANCHOR_DATE:         '2026-03-17T00:00:00',   // fecha de referencia
  SPOTS_INITIAL:             47,                        // cupos al inicio
  SPOTS_MIN:                 19,                        // mínimo visible
  SPOTS_DECREASE_PER_CYCLE:  5,                         // cupos que bajan por ciclo
  SPOTS_CYCLE_DAYS:          3,                         // días por ciclo
};

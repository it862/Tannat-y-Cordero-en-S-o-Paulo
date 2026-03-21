// ═══════════════════════════════════════════════
//  n8n Code Node: "Set Config + Build Payload"
//  ─────────────────────────────────────────────
//  Pegar este código en el nodo Code de n8n.
//  Si importaste el JSON del workflow, ya viene incluido.
//
//  Este archivo existe solo como referencia editable.
// ═══════════════════════════════════════════════


// ─── CONFIGURACIÓN ─────────────────────────────
// Modificar solo esta sección

const PAGARME_SECRET_KEY = 'sk_test_XXXXXXXXXX';   // ← PONER TU SECRET KEY
const PAGARME_API_URL    = 'https://api.pagar.me/core/v5/orders';

const UNIT_PRICE_CENTAVOS = 500;  // R$5.00 en centavos (mínimo prueba)
const EVENT_NAME   = 'Tannat y Cordero en São Paulo';
const SUCCESS_URL  = 'https://TU-DOMINIO.vercel.app/success';
const MAX_QTY      = 10;


// ─── LÓGICA ────────────────────────────────────
// No tocar salvo cambio de estructura

const input = $input.first().json.body;

// Validación básica
if (!input.email || !input.first_name || !input.quantity) {
  throw new Error('Faltan campos obligatorios');
}

const qty = Math.min(Math.max(parseInt(input.quantity, 10) || 1, 1), MAX_QTY);
const totalCentavos = UNIT_PRICE_CENTAVOS * qty;

// ID interno para reconciliación
const orderId = 'TANNAT-' + (input.country || 'BR') + '-' + Date.now();

// Body para Pagar.me API v5 — Checkout alojado
const orderPayload = {
  code: orderId,
  items: [
    {
      amount:      UNIT_PRICE_CENTAVOS,
      description: EVENT_NAME,
      quantity:    qty,
    }
  ],
  customer: {
    name:  (input.first_name + ' ' + (input.last_name || '')).trim(),
    email: input.email,
    document: input.document ? input.document.replace(/\D/g, '') : undefined,
    type:     input.document ? 'individual' : undefined,
    phones: {
      mobile_phone: {
        country_code: '55',
        area_code:    (input.phone || '').substring(0, 2),
        number:       (input.phone || '').substring(2).replace(/\D/g, ''),
      }
    }
  },
  payments: [
    {
      payment_method: 'checkout',
      amount: totalCentavos,
      checkout: {
        customer_editable:            false,
        skip_checkout_success_page:   true,
        accepted_payment_methods:     ['credit_card', 'pix'],
        success_url:                  SUCCESS_URL,
        pix: {
          expires_in: 900,    // 15 minutos
        },
        credit_card: {
          capture:              true,
          statement_descriptor: 'SENDEROS SP',
          installments: [
            { number: 1, total: totalCentavos },
          ]
        }
      }
    }
  ],
  metadata: {
    source:   'landing_tannat',
    order_id: orderId,
    country:  input.country || 'BR',
    phone:    input.phone || '',
  },
};

// Preparar auth (Basic Auth: sk_xxx:<vacío>)
const authB64 = Buffer.from(PAGARME_SECRET_KEY + ':').toString('base64');

return [{
  json: {
    api_url:      PAGARME_API_URL,
    auth_header:  'Basic ' + authB64,
    order_body:   orderPayload,
    order_id:     orderId,
  }
}];

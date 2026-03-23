# Plan de Variación de Precio – Pré-Venda con Descuento
**Fecha de creación**: 21/03/2026 – 22:37h BRT  
**Evento**: Festival Tannat e Cordeiro – São Paulo 2026  
**Modelo**: Precio Fijo + Descuento por Fecha de Pré-Venda

---

## Los Números

| Concepto               | Valor         |
|------------------------|---------------|
| **Precio real (normal)** | R$165        |
| **Descuento Pré-Venda** | 40%           |
| **Precio Pré-Venda**    | **R$99**      |
| **Fecha límite**        | 15 de Abril 2026 (23:59h BRT) |
| **Después del 15/04**   | Vuelve a R$165 automáticamente |

---

## Línea de Tiempo

```
HOY ─────────────── 15 ABR ──────────────── DÍA DEL EVENTO
│                      │                          │
│   PRÉ-VENDA R$99     │     PRECIO NORMAL R$165  │
│   ~~R$165~~ → R$99   │     (sin descuento)      │
│   Badge: "40% OFF"   │                          │
│   Countdown al 15/04 │                          │
└──────────────────────┴──────────────────────────┘
```

---

## Dónde Vive Cada Pieza

| Capa           | Responsabilidad |
|----------------|-----------------|
| **`config.js`** | Define `FULL_PRICE: 165`, `PRESALE_DISCOUNT: 0.40`, `PRESALE_DEADLINE: '2026-04-15T23:59:59-03:00'` |
| **`app.js`**    | Al cargar la página, compara `Date.now()` vs `PRESALE_DEADLINE`. Si estamos antes → muestra R$99 con precio tachado ~~R$165~~ y un countdown. Si estamos después → muestra R$165 normal. |
| **`n8n` (backend)** | **Validación crítica**: Cuando recibe el pedido, n8n también evalúa la fecha. Si la fecha actual < 15/04 → cobra R$99. Si es posterior → cobra R$165. Esto evita que alguien manipule el precio desde la consola del navegador. |

---

## Lo que Vería el Cliente en la Landing

### Antes del 15 de abril (Pré-Venda activa):
> 🏷️ **PRÉ-VENDA** · Termina en **12d 05h 23m**
>
> ~~R$165~~ → **R$99** /pessoa
>
> *"Economize 40% comprando antecipadamente"*

### Después del 15 de abril (precio normal):
> **R$165** /pessoa
>
> *(sin badge, sin tachado, limpio)*

---

## Ventajas del Modelo

1. **Cero mantenimiento**: No hay que entrar a cambiar precios manualmente. La fecha controla todo automáticamente.
2. **Doble validación (anti-fraude)**: El frontend muestra el precio correcto, pero n8n **vuelve a calcular** el precio real antes de cobrar. Si alguien edita el HTML para pagar R$99 después del 15/04, n8n lo rechaza o cobra R$165.
3. **FOMO natural**: El countdown visual genera urgencia real sin trucos artificiales.
4. **Un solo turno, un solo precio base**: Nada de complejidad de lotes o múltiples SKUs.

---

## Implementación Técnica (Resumen)

### En `config.js`:
```javascript
FULL_PRICE: 165,           // Precio normal en reales
PRESALE_DISCOUNT: 0.40,    // 40% de descuento
PRESALE_DEADLINE: '2026-04-15T23:59:59-03:00',  // Fecha límite BRT
```

### En `app.js`:
```javascript
var now = new Date();
var deadline = new Date(C.PRESALE_DEADLINE);
var isPresale = now < deadline;
var currentPrice = isPresale
  ? Math.round(C.FULL_PRICE * (1 - C.PRESALE_DISCOUNT))
  : C.FULL_PRICE;
```

### En `n8n` (nodo Code):
```javascript
const FULL_PRICE = 16500;       // en centavos
const PRESALE_DISCOUNT = 0.40;
const PRESALE_DEADLINE = new Date('2026-04-15T23:59:59-03:00');

const isPresale = new Date() < PRESALE_DEADLINE;
const unitPrice = isPresale
  ? Math.round(FULL_PRICE * (1 - PRESALE_DISCOUNT))
  : FULL_PRICE;
```

---

## Notas
- El precio de pré-venda (R$99) se calcula dinámicamente: `165 × (1 - 0.40) = 99`.
- Si en el futuro se quiere cambiar el descuento (ej. 30%), solo se modifica `PRESALE_DISCOUNT` en `config.js` y en el nodo Code de n8n.
- La fecha deadline usa timezone `-03:00` (BRT) para evitar confusiones horarias.
Buena pregunta. Tu sitio tiene una **paleta oscura premium** (burgundy `#5c102f`, dorado `#c5a059`, fondo `#1a0d12`), así que cualquier elemento de "oferta" tiene que sentirse **exclusivo**, no "Black Friday de tienda barata". Acá van las mejores prácticas:

---

### ❌ Lo que NO hacer (rompe el contraste premium)

- Banners amarillo/rojo chillón tipo e-commerce
- Texto parpadeante o `animate-pulse` en el precio
- Stickers tipo "40% OFF!!!" con bordes dentados
- Pop-ups o barras flotantes invasivas

---

### ✅ Lo que SÍ hacer (mantiene la elegancia)

**1. Badge sutil de Pré-Venda (dorado sobre oscuro)**
Un pequeño badge pill con tu dorado existente (`accent-gold`), sin gritar:
```
┌──────────────────────────────┐
│  🏷️  PRÉ-VENDA · 40% OFF   │  ← pill dorado, tipografía pequeña tracking-widest
└──────────────────────────────┘
```
- Fondo: `bg-accent-gold/20` (dorado al 20% de transparencia)
- Borde: `border border-accent-gold/40`
- Texto: `text-accent-gold`, uppercase, tracking-widest, text-xs

**2. Precio tachado elegante (no rojo)**
Usá colores de tu propia paleta, nunca rojo:
```
  R$165  →  R$99/pessoa
  ^^^^       ^^^^
  slate-500  text-white font-black text-5xl
  line-through
  text-lg
```
- El precio viejo (`R$165`) va en `text-slate-500 line-through text-lg` → gris tenue, chico, tachado
- El precio nuevo (`R$99`) va en `text-white text-5xl font-black` → blanco, grande, protagonista
- **Sin rojo, sin verde**, solo el contraste de tamaño y opacidad ya comunica el descuento

**3. Countdown minimalista (no un reloj gigante)**
Debajo del precio, una línea fina y elegante:
```
  Pré-venda encerra em  12d 05h 23m
  ─────────────────     ───────────
  text-slate-400         text-accent-gold font-mono
  text-sm                text-sm
```
- Sin cajas, sin fondo, solo texto plano
- Los números en `font-mono` para que no salten visualmente al cambiar
- Color dorado solo en los números para dar contraste mínimo

**4. Barra de progreso ultra-sutil (opcional)**
Si querés mostrar urgencia sin ser agresivo, una barra finita debajo del countdown:
```
  ████████████░░░░░░░░  73% vendido
```
- Alto: solo `h-1` (4px)
- Color: gradient de `primary` a `accent-gold`
- Fondo: `bg-white/5` (casi invisible)

**5. Ubicación dentro del layout**
El badge y el countdown deberían ir **dentro de la columna derecha (donde está el form)**, entre el título "Reserva tu lugar" y el selector de cantidad. Así:

```
┌─────────────────────────┐
│   Reserva tu lugar      │
│                         │
│  ┌───────────────────┐  │
│  │ 🏷️ PRÉ-VENDA     │  │  ← Badge pill
│  └───────────────────┘  │
│                         │
│  R̶$̶1̶6̶5̶  →  R$99       │  ← Precio tachado + nuevo
│                         │
│  Encerra em 12d 05h 23m │  ← Countdown sutil
│                         │
│  [−]  1  [+]            │  ← Cantidad
│  Total: R$99            │
│                         │
│  [  PAGAR E CONFIRMAR ] │
└─────────────────────────┘
```

---

### Resumen de la regla de oro

> **Si parece "oferta de supermercado", no va. Si parece "acceso anticipado exclusivo", va.**

El truco es que el descuento se presente como un **privilegio temporal** ("você tem acesso antecipado"), no como una liquidación desesperada. Eso mantiene el tono premium del sitio.

---

¿Querés que agregue estas especificaciones estéticas al documento de plan de variación de precio que ya creamos en `docs/`, o directamente paso a implementarlo en código?

Sí. Mirando el plan, el nodo **"Validar + Build Payload"** ya tiene la lógica de precio — solo hay que agregar la validación de pré-venda ahí mismo.

**El cambio es una sola sección en el nodo existente.** Reemplaza estas líneas actuales:

```js
const unitPrice     = Math.round((body.amount / body.quantity) * 100);
const totalCentavos = unitPrice * qty;
```

Por esto:

```js
// ══════════════════════════════════════════════
// VALIDAÇÃO DE PREÇO — Pré-Venda vs Precio Normal
// ══════════════════════════════════════════════
const FULL_PRICE_CENTAVOS     = 16500; // R$165,00
const PRESALE_DISCOUNT        = 0.40;
const PRESALE_DEADLINE        = new Date('2026-04-15T23:59:59-03:00');
const PRESALE_PRICE_CENTAVOS  = Math.round(FULL_PRICE_CENTAVOS * (1 - PRESALE_DISCOUNT)); // R$99,00

const isPresale  = new Date() < PRESALE_DEADLINE;
const unitPrice  = isPresale ? PRESALE_PRICE_CENTAVOS : FULL_PRICE_CENTAVOS;
const totalCentavos = unitPrice * qty;

// Log para auditoría
console.log('[Precio] isPresale:', isPresale, '| unitPrice:', unitPrice, '| total:', totalCentavos);
// ══════════════════════════════════════════════
```

**Por qué solo este cambio y nada más:**

El backend ignora completamente el `amount` que viene del frontend — recalcula siempre desde la configuración interna. Si alguien intenta pagar R$99 después del 15/04 manipulando el formulario, n8n cobra R$165 igual. Si intenta pagar R$165 durante la pré-venda, n8n cobra R$99.

No necesitas nodo nuevo — el control de precio ya vive en `Validar + Build Payload` y este cambio lo hace automático y seguro.
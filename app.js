/**
 * =============================================
 *  APP.JS – São Paulo Festival
 * =============================================
 *
 *  Lógica de la landing page:
 *    1. Contador de cupos dinámico
 *    2. Pré-venda: cálculo de precio + countdown
 *    3. Selector de cantidad (+/−)
 *    4. Envío del formulario de reserva → n8n
 *
 *  Toda la configuración se lee de window.CONFIG
 *  definido en config.js (debe cargarse antes).
 */

(function () {
  'use strict';

  var C = window.CONFIG;

  // ─── 1. Contador de cupos dinámico ───────────────────

  function updateSpots() {
    var el = document.getElementById('spots-left');
    if (!el) return;

    var anchor = new Date(C.SPOTS_ANCHOR_DATE).getTime();
    var now    = Date.now();
    var daysPassed = Math.floor((now - anchor) / (1000 * 60 * 60 * 24));
    var decreases  = Math.floor(daysPassed / C.SPOTS_CYCLE_DAYS);
    var spots = C.SPOTS_INITIAL - (decreases * C.SPOTS_DECREASE_PER_CYCLE);

    if (spots < C.SPOTS_MIN) spots = C.SPOTS_MIN;

    el.textContent = spots;
  }

  updateSpots();

  // ─── 2. Pré-venda: precio dinámico + countdown ──────

  var deadline = new Date(C.PRESALE_DEADLINE);
  var isPresale = new Date() < deadline;
  var presalePrice = Math.round(C.FULL_PRICE * (1 - C.PRESALE_DISCOUNT));
  var currentUnitPrice = isPresale ? presalePrice : C.FULL_PRICE;

  // Exponer para que initPayment lo use
  window._CURRENT_UNIT_PRICE = currentUnitPrice;

  function applyPresaleUI() {
    var badgeEl     = document.getElementById('presale-badge');
    var oldPriceEl  = document.getElementById('old-price');
    var mainPriceEl = document.getElementById('main-price');
    var countdownEl = document.getElementById('presale-countdown');
    var heroPrice   = document.getElementById('hero-price');

    if (isPresale) {
      // Mostrar badge y precio tachado
      if (badgeEl)     badgeEl.classList.remove('hidden');
      if (oldPriceEl)  { oldPriceEl.classList.remove('hidden'); oldPriceEl.textContent = 'R$' + C.FULL_PRICE; }
      if (mainPriceEl) mainPriceEl.textContent = presalePrice;
      if (heroPrice)   heroPrice.textContent = 'R$' + presalePrice;
      if (countdownEl) countdownEl.classList.remove('hidden');

      // Iniciar countdown
      startCountdown();
    } else {
      // Precio normal sin badge
      if (badgeEl)     badgeEl.classList.add('hidden');
      if (oldPriceEl)  oldPriceEl.classList.add('hidden');
      if (mainPriceEl) mainPriceEl.textContent = C.FULL_PRICE;
      if (heroPrice)   heroPrice.textContent = 'R$' + C.FULL_PRICE;
      if (countdownEl) countdownEl.classList.add('hidden');
    }
  }

  function startCountdown() {
    var timerEl = document.getElementById('countdown-timer');
    if (!timerEl) return;

    function tick() {
      var now  = new Date();
      var diff = deadline - now;

      if (diff <= 0) {
        // Pré-venda terminó, recargar para mostrar precio normal
        location.reload();
        return;
      }

      var days  = Math.floor(diff / (1000 * 60 * 60 * 24));
      var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      var secs  = Math.floor((diff % (1000 * 60)) / 1000);

      timerEl.textContent =
        (days > 0 ? days + 'd ' : '') +
        String(hours).padStart(2, '0') + 'h ' +
        String(mins).padStart(2, '0') + 'm ' +
        String(secs).padStart(2, '0') + 's';
    }

    tick();
    setInterval(tick, 1000);
  }

  applyPresaleUI();

  // ─── 3. Selector de cantidad (+/−) ──────────────────

  var qty = 1;

  function updateTotal() {
    document.getElementById('qty-n').textContent      = qty;
    document.getElementById('f-quantity').value        = qty;
    document.getElementById('total-amount').textContent =
      (currentUnitPrice * qty).toLocaleString('pt-BR');
  }

  // Inicializar precio en carga
  updateTotal();

  document.getElementById('q-minus').addEventListener('click', function () {
    if (qty > 1) { qty--; updateTotal(); }
  });

  document.getElementById('q-plus').addEventListener('click', function () {
    if (qty < C.MAX_QTY) { qty++; updateTotal(); }
  });

  // ─── 4. Envío de reserva → n8n ──────────────────────

  window.initPayment = function (e) {
    if (e) e.preventDefault();

    // Referencias de UI del formulario
    var payBtn  = document.getElementById('pay-btn');
    var btnTxt  = document.getElementById('btn-txt');
    var spinner = document.getElementById('spinner');
    var msgContainer = document.getElementById('msg-container');
    var msgText = document.getElementById('msg-text');

    // Función para mostrar mensajes
    function showMessage(msg, isError) {
      msgContainer.classList.remove('hidden', 'bg-red-500/20', 'text-red-400', 'bg-accent-gold/20', 'text-accent-gold');
      msgContainer.classList.add(isError ? 'bg-red-500/20' : 'bg-accent-gold/20');
      msgContainer.classList.add(isError ? 'text-red-400' : 'text-accent-gold');
      msgText.textContent = msg;
    }

    // Estado: cargando
    payBtn.disabled = true;
    payBtn.classList.add('opacity-70');
    btnTxt.style.display = 'none';
    spinner.classList.remove('hidden');
    msgContainer.classList.add('hidden');

    showMessage(I18N.get('msg_preparing'), false);
    msgContainer.classList.remove('hidden');

    // Datos del formulario
    var fullName = document.getElementById('f-name').value.trim();
    var parts    = fullName.split(' ');
    var firstName = parts[0];
    var lastName  = parts.slice(1).join(' ') || '.';
    var currentQty = parseInt(document.getElementById('f-quantity').value, 10) || 1;

    var payload = {
      event:      C.EVENT_ID,
      first_name: firstName,
      last_name:  lastName,
      email:      document.getElementById('f-email').value.trim(),
      phone:      document.getElementById('f-phone').value.trim(),
      country:    document.getElementById('f-country').value,
      document:   document.getElementById('f-cpf').value.trim(),
      quantity:   currentQty,
      amount:     500,  // ⚠️ TEST: hardcoded R$5 (500 centavos) – REVERTIR a: window._CURRENT_UNIT_PRICE * currentQty
      currency:   C.CURRENCY,
    };

    fetch(C.N8N_WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        }).catch(function () {
          throw new Error(I18N.get('msg_unexpected'));
        });
      })
      .then(function (result) {
        if (!result.ok || result.data.status === 'error') {
          var errorMsg = result.data.message || 'Error del servidor (' + result.status + ').';
          throw new Error(errorMsg);
        }
        if (!result.data.redirect_url) {
          throw new Error(I18N.get('msg_no_url'));
        }
        showMessage(I18N.get('msg_redirecting'), false);
        window.location.href = result.data.redirect_url;
      })
      .catch(function (err) {
        payBtn.disabled = false;
        payBtn.classList.remove('opacity-70');
        btnTxt.style.display = 'inline';
        spinner.classList.add('hidden');

        showMessage(err.message || I18N.get('msg_error'), true);
      });
  };

})();

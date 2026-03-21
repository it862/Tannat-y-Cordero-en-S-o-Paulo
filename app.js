/**
 * =============================================
 *  APP.JS – São Paulo Festival
 * =============================================
 *
 *  Lógica de la landing page:
 *    1. Contador de cupos dinámico
 *    2. Selector de cantidad (+/−)
 *    3. Envío del formulario de reserva → n8n
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

  // ─── 2. Selector de cantidad (+/−) ──────────────────

  var qty = 1;

  function updateTotal() {
    document.getElementById('qty-n').textContent      = qty;
    document.getElementById('f-quantity').value        = qty;
    document.getElementById('total-amount').textContent =
      (C.UNIT_PRICE * qty).toLocaleString('pt-BR');
  }

  // Inicializar precio en carga
  updateTotal();

  document.getElementById('q-minus').addEventListener('click', function () {
    if (qty > 1) { qty--; updateTotal(); }
  });

  document.getElementById('q-plus').addEventListener('click', function () {
    if (qty < C.MAX_QTY) { qty++; updateTotal(); }
  });

  // ─── 3. Lógica del Modal y CPF ────────────────────────

  var modal = document.getElementById('payment-modal');
  var modalContent = document.getElementById('payment-modal-content');
  var countrySelect = document.getElementById('f-country');
  var cpfContainer = document.getElementById('cpf-container');
  var cpfInput = document.getElementById('f-cpf');

  function openModal() {
    document.getElementById('modal-total-amount').textContent = (C.UNIT_PRICE * qty).toLocaleString('pt-BR');
    modal.classList.remove('hidden');
    // Pequeño delay para la animación de opacidad
    setTimeout(function() {
      modal.classList.remove('opacity-0');
      modalContent.classList.remove('scale-95');
    }, 10);
  }

  function closeModal() {
    modal.classList.add('opacity-0');
    modalContent.classList.add('scale-95');
    setTimeout(function() {
      modal.classList.add('hidden');
    }, 300);
  }

  document.getElementById('open-modal-btn').addEventListener('click', openModal);
  document.getElementById('close-modal-btn').addEventListener('click', closeModal);
  
  // Cerrar al clickear fuera del modal
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });

  // Mostrar/ocultar CPF basado en el país
  countrySelect.addEventListener('change', function() {
    if (this.value === 'BR') {
      cpfContainer.classList.remove('hidden');
      cpfInput.required = true;
    } else {
      cpfContainer.classList.add('hidden');
      cpfInput.required = false;
      cpfInput.value = '';
    }
  });

  // ─── 4. Envío de reserva → n8n ──────────────────────

  window.initPayment = function (e) {
    if (e) e.preventDefault();

    // Referencias de UI del modal
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

    showMessage('Preparando tu reserva... un momento 🍷', false);
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
      document:   document.getElementById('f-cpf').value.trim(), // Nuevo campo
      quantity:   currentQty,
      amount:     C.UNIT_PRICE * currentQty,
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
          throw new Error('Respuesta inesperada del servidor. Intenta nuevamente.');
        });
      })
      .then(function (result) {
        if (!result.ok || result.data.status === 'error') {
          // Capturar mensaje de error específico si viene de Pagar.me via n8n
          var errorMsg = result.data.message || 'Error del servidor (' + result.status + ').';
          throw new Error(errorMsg);
        }
        if (!result.data.redirect_url) {
          throw new Error('No se recibió la URL de pago.');
        }
        showMessage('¡Listo! Redirigiendo al pago seguro...', false);
        window.location.href = result.data.redirect_url;
      })
      .catch(function (err) {
        payBtn.disabled = false;
        payBtn.classList.remove('opacity-70');
        btnTxt.style.display = 'inline';
        spinner.classList.add('hidden');

        showMessage(err.message || 'Error al procesar. Por favor intenta nuevamente.', true);
      });
  };

})();

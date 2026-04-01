/**
 * =============================================
 *  PHONE-BR.JS – Normalización y máscara
 *  de teléfono brasileño
 * =============================================
 *
 *  Exporta al global:
 *    window.PhoneBR.normalize(raw)  → { ok, phone, error }
 *    window.PhoneBR.init()          → wiring de máscara + hint
 */

(function () {
  'use strict';

  // ── DDDs válidos por estado ────────────────────────────
  var VALID_DDDS = [
    // SP
    11,12,13,14,15,16,17,18,19,
    // RJ
    21,22,24,
    // ES
    27,28,
    // MG
    31,32,33,34,35,37,38,
    // PR
    41,42,43,44,45,46,
    // SC
    47,48,49,
    // RS
    51,53,54,55,
    // DF
    61,
    // GO
    62,64,
    // TO
    63,
    // MT
    65,66,
    // MS
    67,
    // AC
    68,
    // RO
    69,
    // BA
    71,73,74,75,77,
    // SE
    79,
    // PE
    81,87,
    // AL
    82,
    // PB
    83,
    // RN
    84,
    // CE
    85,88,
    // PI
    86,89,
    // PA
    91,93,94,
    // AM
    92,97,
    // RR
    95,
    // AP
    96,
    // MA
    98,99
  ];

  var DDD_SET = {};
  for (var i = 0; i < VALID_DDDS.length; i++) {
    DDD_SET[VALID_DDDS[i]] = true;
  }

  // ── normalize ──────────────────────────────────────────
  // Recibe string crudo, devuelve { ok, phone, error }
  // phone = "+55XXXXXXXXXXX" cuando ok=true
  function normalize(raw) {
    if (!raw) return { ok: false, phone: '', error: 'Número inválido — verifique o DDD e os dígitos' };

    // Paso 1: solo dígitos
    var digits = raw.replace(/\D/g, '');

    // Bloqueo 0800/0300
    if (/^0[83]00/.test(digits)) {
      return { ok: false, phone: '', error: 'Número 0800/0300 não é aceito' };
    }

    // Paso 2: quitar prefijo 55 si length 12-13
    if (digits.length >= 12 && digits.length <= 13 && digits.substring(0, 2) === '55') {
      digits = digits.substring(2);
    }

    // Paso 3: quitar 0 inicial
    if (digits.charAt(0) === '0') {
      digits = digits.substring(1);
    }

    // Paso 4: verificar length
    if (digits.length !== 10 && digits.length !== 11) {
      return { ok: false, phone: '', error: 'Número inválido — verifique o DDD e os dígitos' };
    }

    // Paso 5: extraer DDD
    var ddd = parseInt(digits.substring(0, 2), 10);

    // Paso 6: verificar DDD
    if (!DDD_SET[ddd]) {
      return { ok: false, phone: '', error: 'DDD inválido para Brasil' };
    }

    // Paso 7: celular debe empezar con 9 tras DDD
    if (digits.length === 11 && digits.charAt(2) !== '9') {
      return { ok: false, phone: '', error: 'Celular brasileiro deve começar com 9 após o DDD' };
    }

    // Paso 8: construir final
    return { ok: true, phone: '+55' + digits, error: '' };
  }

  // ── formatMask ─────────────────────────────────────────
  // Recibe string de solo dígitos (ya limitado) y devuelve
  // la máscara visual.
  function formatMask(digits) {
    var len = digits.length;

    if (len === 0) return '';
    if (len <= 2) return digits;                                            // "1" / "11"

    var ddd = digits.substring(0, 2);
    var rest = digits.substring(2);
    var isCel = rest.charAt(0) === '9';

    if (isCel) {
      // Celular: (XX) 9 XXXX-XXXX
      if (rest.length <= 1) return '(' + ddd + ') ' + rest;                // (11) 9
      if (rest.length <= 5) return '(' + ddd + ') ' + rest.charAt(0) + ' ' + rest.substring(1);
      // rest.length 6-9
      return '(' + ddd + ') ' + rest.charAt(0) + ' ' + rest.substring(1, 5) + '-' + rest.substring(5);
    } else {
      // Fixo: (XX) XXXX-XXXX
      if (rest.length <= 4) return '(' + ddd + ') ' + rest;
      return '(' + ddd + ') ' + rest.substring(0, 4) + '-' + rest.substring(4);
    }
  }

  // ── init ───────────────────────────────────────────────
  // Wiring completo: máscara en tiempo real, hints, onBlur
  function init() {
    var input = document.getElementById('f-phone');
    if (!input) return;

    // Crear el hint element debajo del input
    var hintEl = document.getElementById('phone-hint');
    if (!hintEl) {
      hintEl = document.createElement('p');
      hintEl.id = 'phone-hint';
      hintEl.className = 'text-[11px] mt-1 transition-colors duration-200';
      hintEl.style.minHeight = '16px';
      input.parentNode.appendChild(hintEl);
    }

    // Crear check icon al lado del campo
    var checkEl = document.getElementById('phone-check');
    if (!checkEl) {
      checkEl = document.createElement('span');
      checkEl.id = 'phone-check';
      checkEl.className = 'absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-lg opacity-0 transition-opacity duration-200';
      checkEl.textContent = '✓';
      // Hacer el parent relative
      input.parentNode.style.position = 'relative';
      input.parentNode.appendChild(checkEl);
    }

    // Crear error element (inline, debajo del hint)
    var errorEl = document.getElementById('phone-error');
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.id = 'phone-error';
      errorEl.className = 'text-[11px] text-red-400 mt-0.5 transition-all duration-200';
      errorEl.style.minHeight = '0px';
      input.parentNode.appendChild(errorEl);
    }

    function extractDigits(val) {
      return val.replace(/\D/g, '');
    }

    function stripCountryCode(d) {
      // Si empieza con 55 y tiene 12+ dígitos → quitar "55"
      // (12 = fixo con 55, 13 = celular con 55, 14+ = basura extra que se recortará)
      if (d.length >= 12 && d.substring(0, 2) === '55') {
        return d.substring(2);
      }
      return d;
    }

    function maxDigits(d) {
      if (d.length >= 3 && d.charAt(2) === '9') return 11; // celular
      if (d.length >= 3) return 10; // fixo
      return 11; // aún no sabemos, permitir hasta 11
    }

    function updateHint(d) {
      checkEl.style.opacity = '0';
      errorEl.textContent = '';

      if (d.length === 0) {
        hintEl.textContent = 'Digite seu celular com DDD  ex: (11) 9 1234-5678';
        hintEl.className = 'text-[11px] mt-1 transition-colors duration-200 text-slate-500';
        return;
      }
      if (d.length <= 2) {
        hintEl.textContent = 'DDD — código da sua cidade';
        hintEl.className = 'text-[11px] mt-1 transition-colors duration-200 text-slate-500';
        return;
      }
      if (d.length === 3) {
        var third = d.charAt(2);
        if (third === '9') {
          hintEl.textContent = 'Celular detectado ✓';
          hintEl.className = 'text-[11px] mt-1 transition-colors duration-200 text-green-400/70';
        } else if ('2345'.indexOf(third) !== -1) {
          hintEl.textContent = 'Fixo detectado ✓';
          hintEl.className = 'text-[11px] mt-1 transition-colors duration-200 text-green-400/70';
        } else {
          hintEl.textContent = '⚠ Após o DDD, celular começa com 9';
          hintEl.className = 'text-[11px] mt-1 transition-colors duration-200 text-amber-400/70';
        }
        return;
      }
      // 4-9 dígitos: neutral
      var complete = maxDigits(d);
      if (d.length >= complete) {
        hintEl.textContent = '';
        checkEl.style.opacity = '1';
        return;
      }
      hintEl.textContent = '';
    }

    function applyMask() {
      var raw = extractDigits(input.value);
      raw = stripCountryCode(raw);

      // Bloquear 0 inicial
      if (raw.length > 0 && raw.charAt(0) === '0') {
        raw = raw.substring(1);
      }

      var max = maxDigits(raw);
      if (raw.length > max) raw = raw.substring(0, max);

      var formatted = formatMask(raw);
      input.value = formatted;

      updateHint(raw);

      // Guardar dígitos limpios como data-attribute para lectura fácil
      input.setAttribute('data-digits', raw);
    }

    // ── KeyDown: bloquear letras y 0 como primer dígito ──
    input.addEventListener('keydown', function (e) {
      // Permitir teclas de control
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Home','End'];
      if (allowed.indexOf(e.key) !== -1) return;

      // Solo dígitos
      if (e.key.length === 1 && (e.key < '0' || e.key > '9')) {
        e.preventDefault();
        return;
      }

      // Bloquear 0 como primer dígito
      var currentDigits = extractDigits(input.value);
      currentDigits = stripCountryCode(currentDigits);
      if (currentDigits.length === 0 && e.key === '0') {
        e.preventDefault();
        return;
      }

      // Bloquear si ya alcanzó el máximo
      var max = maxDigits(currentDigits);
      if (currentDigits.length >= max && e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        return;
      }
    });

    // ── Input: aplicar máscara ──
    input.addEventListener('input', function () {
      applyMask();
    });

    // ── Paste: limpiar y formatear ──
    input.addEventListener('paste', function (e) {
      e.preventDefault();
      var pasted = (e.clipboardData || window.clipboardData).getData('text') || '';
      var digits = extractDigits(pasted);
      digits = stripCountryCode(digits);
      if (digits.length > 0 && digits.charAt(0) === '0') digits = digits.substring(1);
      var max = maxDigits(digits);
      if (digits.length > max) digits = digits.substring(0, max);
      input.value = formatMask(digits);
      input.setAttribute('data-digits', digits);
      updateHint(digits);
    });

    // ── Blur: validación suave ──
    input.addEventListener('blur', function () {
      var digits = extractDigits(input.value);
      digits = stripCountryCode(digits);
      if (digits.length === 0) {
        // Reset visual
        input.style.borderColor = '';
        errorEl.textContent = '';
        checkEl.style.opacity = '0';
        return;
      }
      var result = normalize(digits);
      if (!result.ok) {
        input.style.borderColor = 'rgba(248,113,113,0.6)';
        errorEl.textContent = result.error;
        checkEl.style.opacity = '0';
      } else {
        input.style.borderColor = 'rgba(74,222,128,0.4)';
        errorEl.textContent = '';
        checkEl.style.opacity = '1';
        hintEl.textContent = '';
      }
    });

    // ── Focus: reset border ──
    input.addEventListener('focus', function () {
      input.style.borderColor = '';
      errorEl.textContent = '';
    });

    // Initial hint
    updateHint('');
  }

  // ── Exponer API global ─────────────────────────────────
  window.PhoneBR = {
    normalize: normalize,
    init: init
  };

})();

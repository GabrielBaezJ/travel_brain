// public/assets/js/currency.js
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM base (online) ----
    const form = document.getElementById('currencyForm');
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    const amountInput = document.getElementById('amount');

    const resultSection = document.getElementById('conversionResult');
    const resultValue = document.getElementById('convertedAmount');
    const resultRate = document.getElementById('conversionRate');
    const resultBaseAmount = document.getElementById('conversionBaseAmount');
    const resultUpdated = document.getElementById('conversionUpdatedAt');

    const ratesTableBody = document.getElementById('currencyRates');
    const ratesUpdatedAt = document.getElementById('ratesUpdatedAt');
    const baseCurrencyLabel = document.getElementById('baseCurrencyLabel');
    const onlineStatus = document.getElementById('onlineStatus');

    // ---- Contenedores modo ----
    const onlineConverterSection = document.getElementById('onlineConverter');
    const onlineRatesCard = document.getElementById('onlineRatesCard');
    const currencyContainer = document.querySelector('.currency-container');

    const offlineSection = document.getElementById('offlineConverter');
    const offlineRatesCard = document.getElementById('offlineRatesCard');

    // ÚNICO botón de modo + “slots” (online/offline)
    const modeToggleButton =
      document.getElementById('converterModeToggle') ||
      document.querySelector('[data-mode-toggle]');
    const modeToggleContainer = document.getElementById('converterMode');
    const onlineModeSlot = document.querySelector('[data-mode-slot="online"]');
    const offlineModeSlot = document.querySelector('[data-mode-slot="offline"]');

    // Secciones solo online (ocultarlas en modo offline)
    const onlineOnlySections = Array.from(document.querySelectorAll('[data-online-only]'));

    // ---- Tarjetas opcionales ----
    const fluctuationCard = document.getElementById('fluctuationCard');
    const fluctuationStatus = document.getElementById('fluctuationStatus');
    const fluctuationRangeLabel = document.getElementById('fluctuationRange');
    const fluctuationTableBody = document.getElementById('fluctuationTable');
    const fluctuationTableWrapper = fluctuationCard?.querySelector('.table-responsive');

    const timeseriesCard = document.getElementById('timeseriesCard');
    const timeseriesStatus = document.getElementById('timeseriesStatus');
    const timeseriesGrid = timeseriesCard?.querySelector('.timeseries-grid');
    const timeseriesTableBody = document.getElementById('timeseriesTable');
    const timeseriesDeltaValue = document.getElementById('timeseriesDelta');
    const timeseriesPercentValue = document.getElementById('timeseriesPercent');

    // ---- Tarjeta Live (opcional: preséntala en el HTML si la quieres) ----
    const liveRateCard = document.getElementById('liveRateCard');
    const liveRateStatus = document.getElementById('liveRateStatus');
    const liveRateValue = document.getElementById('liveRateValue');
    const liveRateDelta = document.getElementById('liveRateDelta');
    const liveRateUpdatedAt = document.getElementById('liveRateUpdatedAt');
    const liveRateBody = liveRateCard?.querySelector('.live-rate-body');

    // ---- Tarjetas de insights (Momentum / Outlook) ----
    const momentumCard = document.getElementById('momentumCard');
    const momentumStatus = document.getElementById('momentumStatus');
    const momentumList = document.getElementById('momentumList');

    const outlookCard = document.getElementById('outlookCard');
    const outlookStatus = document.getElementById('outlookStatus');
    const outlookList = document.getElementById('outlookList');

    // ---- DOM offline ----
    const offlineForm = document.getElementById('offlineCurrencyForm');
    const offlineFromSelect = document.getElementById('offlineFromCurrency');
    const offlineToSelect = document.getElementById('offlineToCurrency');
    const offlineAmountInput = document.getElementById('offlineAmount');
    const offlineResultSection = document.getElementById('offlineConversionResult');
    const offlineResultValue = document.getElementById('offlineConvertedAmount');
    const offlineResultRate = document.getElementById('offlineConversionRate');
    const offlineResultBaseAmount = document.getElementById('offlineConversionBaseAmount');
    const offlineResultUpdated = document.getElementById('offlineConversionUpdatedAt');
    const offlineRatesUpdatedAt = document.getElementById('offlineRatesUpdatedAt');
    const offlineRatesTableBody = document.getElementById('offlineRates');

    if (!form || !fromSelect || !toSelect) return;

    // ---- Persistencia (keys) ----
    const STORAGE = {
      MODE: 'currencyMode', // 'online' | 'offline'
      FROM: 'currencyFrom',
      TO: 'currencyTo',
      OFF_FROM: 'currencyOffFrom',
      OFF_TO: 'currencyOffTo',
    };

    // ---- Datos offline de respaldo ----
    const OFFLINE_DATA = {
      updatedAt: '2024-01-15T00:00:00Z',
      base: { code: 'USD', name: 'Dólar estadounidense', symbol: '$' },
      currencies: [
        { code: 'USD', name: 'Dólar estadounidense', symbol: '$', rate: 1.0 },
        { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 },
        { code: 'GBP', name: 'Libra esterlina', symbol: '£', rate: 0.79 },
        { code: 'JPY', name: 'Yen japonés', symbol: '¥', rate: 146.5 },
        { code: 'CAD', name: 'Dólar canadiense', symbol: 'C$', rate: 1.34 },
        { code: 'AUD', name: 'Dólar australiano', symbol: 'A$', rate: 1.52 },
        { code: 'BRL', name: 'Real brasileño', symbol: 'R$', rate: 4.95 },
        { code: 'CLP', name: 'Peso chileno', symbol: '$', rate: 890.0 },
        { code: 'COP', name: 'Peso colombiano', symbol: '$', rate: 3925.0 },
        { code: 'MXN', name: 'Peso mexicano', symbol: '$', rate: 17.1 },
        { code: 'ARS', name: 'Peso argentino', symbol: '$', rate: 830.0 },
        { code: 'PEN', name: 'Sol peruano', symbol: 'S/', rate: 3.7 }
      ]
    };

    // ---- Estado ----
    let currencyMap = new Map();
    let ratesData = null;
    const offlineRatesMap = new Map();
    let isOfflineMode = false;
    let onlineResultWasHidden = resultSection ? resultSection.hidden : true;
    let offlineResultWasHidden = offlineResultSection ? offlineResultSection.hidden : true;
    let forcedOfflineByError = false;

    // ---- Constantes módulos opcionales ----
    const FLUCTUATION_SYMBOLS = ['EUR', 'GBP', 'MXN', 'COP', 'CLP', 'JPY'];
    const TIMESERIES_TARGET = 'EUR';

    // Live rate (opcional)
    const LIVE_RATE_BASE = 'USD';
    const LIVE_RATE_TARGET = 'EUR';
    const LIVE_RATE_INTERVAL_MS = 60_000;

    // Fallbacks
    const FLUCTUATION_FALLBACK = {
      start_date: '2024-05-01',
      end_date: '2024-05-08',
      base: 'USD',
      rates: {
        EUR: { change: 0.0124, change_pct: 1.36 },
        GBP: { change: 0.0087, change_pct: 1.12 },
        MXN: { change: -0.2141, change_pct: -1.23 },
        COP: { change: -34.51, change_pct: -0.87 },
        CLP: { change: -16.32, change_pct: -0.42 },
        JPY: { change: 1.8700, change_pct: 1.29 },
      },
    };

    const LIVE_RATE_FALLBACK = {
      rate: 0.9276,
      previousRate: 0.9258,
      updatedAt: '2024-05-08T12:00:00Z'
    };

    const TIMESERIES_FALLBACK = {
      start: '2024-05-01',
      end: '2024-05-08',
      base: 'USD',
      target: TIMESERIES_TARGET,
      rates: {
        '2024-05-01': { [TIMESERIES_TARGET]: 0.9210 },
        '2024-05-02': { [TIMESERIES_TARGET]: 0.9235 },
        '2024-05-03': { [TIMESERIES_TARGET]: 0.9258 },
        '2024-05-06': { [TIMESERIES_TARGET]: 0.9281 },
        '2024-05-07': { [TIMESERIES_TARGET]: 0.9264 },
        '2024-05-08': { [TIMESERIES_TARGET]: 0.9276 },
      },
    };

    let usedFluctuationFallback = false;
    let usedTimeseriesFallback = false;
    let usedLiveRateFallback = false;
    let liveRateIntervalId = null;
    let previousLiveRate = null;
    let latestFluctuationSnapshot = null;
    let latestTimeseriesSnapshot = null;
    let latestLiveRateSnapshot = null;

    // ---- Utilidades ----
    function formatDateISO(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    function formatDateDisplay(date) {
      return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    function updateStatus(element, message, type = 'info') {
      if (!element) return;
      if (!message) {
        element.textContent = '';
        element.hidden = true;
        element.className = 'alert';
        return;
      }
      element.className = type === 'error' ? 'alert alert-error' : 'alert';
      element.textContent = message;
      element.hidden = false;
    }

    function resolveCurrencyRate(code) {
      const normalized = String(code || '').toUpperCase();
      if (!normalized) return null;
      if (currencyMap.has(normalized)) {
        const rate = Number(currencyMap.get(normalized)?.rate);
        return Number.isFinite(rate) ? rate : null;
      }
      const offlineCurrency = getOfflineCurrencyInfo(normalized);
      const offlineRate = Number(offlineCurrency?.rate);
      return Number.isFinite(offlineRate) ? offlineRate : null;
    }

    function determineTrendFromPercent(percent) {
      const value = Number(percent);
      if (!Number.isFinite(value)) return 'flat';
      if (value > 0.25) return 'up';
      if (value < -0.25) return 'down';
      return 'flat';
    }

    function describeForecast(trend, intensity) {
      const magnitude = Math.abs(Number(intensity) || 0);
      if (trend === 'up') {
        if (magnitude > 1.2) return 'Impulso alcista fuerte: se espera que continúe subiendo.';
        return 'Sesgo alcista: se proyecta continuidad al alza.';
      }
      if (trend === 'down') {
        if (magnitude > 1.2) return 'Presión bajista marcada: podría seguir cayendo.';
        return 'Sesgo bajista: se anticipa ligera corrección.';
      }
      return 'Escenario estable: sin movimientos bruscos previstos.';
    }

    function updateMomentumCard() {
      if (!momentumList) return;

      const snapshot = latestFluctuationSnapshot;
      if (!snapshot || !Array.isArray(snapshot.entries) || snapshot.entries.length === 0) {
        momentumList.hidden = true;
        updateStatus(momentumStatus, 'Esperando datos recientes...', 'info');
        return;
      }

      momentumList.innerHTML = '';
      let renderedItems = 0;

      snapshot.entries.forEach((entry) => {
        const { code, change, percent } = entry;
        if (!code || !Number.isFinite(percent) || !Number.isFinite(change)) return;

        const trend = determineTrendFromPercent(percent);
        const rate = resolveCurrencyRate(code);

        const listItem = document.createElement('li');
        listItem.className = 'momentum-item';

        const pair = document.createElement('div');
        pair.className = 'momentum-pair';
        const rateLabel = Number.isFinite(rate) ? rate.toFixed(4) : '--';
        pair.innerHTML = `<span>${LIVE_RATE_BASE} → ${code}</span><span class="momentum-rate">${rateLabel}</span>`;

        const trendLabel = document.createElement('span');
        trendLabel.className = 'insight-trend';
        trendLabel.dataset.trend = trend;
        trendLabel.textContent = trend === 'up' ? 'Subirá' : trend === 'down' ? 'Bajará' : 'Estable';

        const detail = document.createElement('p');
        detail.className = 'insight-detail';
        const formattedChange = `${change >= 0 ? '+' : ''}${change.toFixed(4)}`;
        const formattedPercent = `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
        detail.textContent = `${formattedChange} (${formattedPercent}) en los últimos 7 días.`;

        listItem.appendChild(pair);
        listItem.appendChild(trendLabel);
        listItem.appendChild(detail);
        momentumList.appendChild(listItem);
        renderedItems += 1;
      });

      if (renderedItems === 0) {
        momentumList.hidden = true;
        updateStatus(momentumStatus, 'Sin variaciones destacadas en este momento.', 'info');
        return;
      }

      momentumList.hidden = false;
      const fallbackMessage = snapshot.isFallback
        ? 'Mostrando movimientos estimados con datos de referencia.'
        : '';
      updateStatus(momentumStatus, fallbackMessage, 'info');
    }

    function updateOutlookCard() {
      if (!outlookList) return;

      const predictions = [];
      const seenLabels = new Set();
      function pushPrediction(prediction) {
        if (!prediction?.label) return;
        if (seenLabels.has(prediction.label)) return;
        predictions.push(prediction);
        seenLabels.add(prediction.label);
      }

      if (latestLiveRateSnapshot) {
        const { rate, previousRate, percent, isFallback } = latestLiveRateSnapshot;
        const trend = determineTrendFromPercent(percent);
        const formattedPercent = Number.isFinite(percent)
          ? `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`
          : '0.00%';
        let formattedDelta = '';
        if (Number.isFinite(rate) && Number.isFinite(previousRate)) {
          const delta = rate - previousRate;
          formattedDelta = `${delta >= 0 ? '+' : ''}${delta.toFixed(4)}`;
        }
        const detailParts = [`Variación reciente ${formattedPercent}`];
        if (formattedDelta) detailParts.push(`Δ ${formattedDelta}`);

        pushPrediction({
          label: `${LIVE_RATE_BASE} → ${LIVE_RATE_TARGET}`,
          trend,
          percent,
          detail: `${detailParts.join(' · ')}. ${describeForecast(trend, percent)}.`,
          isFallback
        });
      } else if (latestTimeseriesSnapshot && Number.isFinite(latestTimeseriesSnapshot.percent)) {
        const trend = determineTrendFromPercent(latestTimeseriesSnapshot.percent);
        const formattedPercent = `${latestTimeseriesSnapshot.percent >= 0 ? '+' : ''}${latestTimeseriesSnapshot.percent.toFixed(2)}%`;
        let formattedDelta = '';
        if (Number.isFinite(latestTimeseriesSnapshot.delta)) {
          formattedDelta = `${latestTimeseriesSnapshot.delta >= 0 ? '+' : ''}${latestTimeseriesSnapshot.delta.toFixed(4)}`;
        }
        const detailParts = [`Semana ${formattedPercent}`];
        if (formattedDelta) detailParts.push(`Δ ${formattedDelta}`);

        pushPrediction({
          label: `${LIVE_RATE_BASE} → ${TIMESERIES_TARGET}`,
          trend,
          percent: latestTimeseriesSnapshot.percent,
          detail: `${detailParts.join(' · ')}. ${describeForecast(trend, latestTimeseriesSnapshot.percent)}.`,
          isFallback: latestTimeseriesSnapshot.isFallback
        });
      }

      if (latestFluctuationSnapshot?.entries?.length) {
        const ordered = latestFluctuationSnapshot.entries
          .filter(e => Number.isFinite(e.percent))
          .sort((a, b) => b.percent - a.percent);

        if (ordered.length) {
          const topGain = ordered[0];
          if (topGain) {
            const gainTrend = determineTrendFromPercent(topGain.percent);
            pushPrediction({
              label: `${LIVE_RATE_BASE} → ${topGain.code}`,
              trend: gainTrend,
              percent: topGain.percent,
              detail: `Últimos 7 días: ${topGain.percent >= 0 ? '+' : ''}${topGain.percent.toFixed(2)}%. ${describeForecast(gainTrend, topGain.percent)}`,
              isFallback: latestFluctuationSnapshot.isFallback
            });
          }
          const topDrop = ordered.slice().reverse().find(e => e.percent < 0);
          if (topDrop) {
            const dropTrend = determineTrendFromPercent(topDrop.percent);
            pushPrediction({
              label: `${LIVE_RATE_BASE} → ${topDrop.code}`,
              trend: dropTrend,
              percent: topDrop.percent,
              detail: `Últimos 7 días: ${topDrop.percent >= 0 ? '+' : ''}${topDrop.percent.toFixed(2)}%. ${describeForecast(dropTrend, topDrop.percent)}`,
              isFallback: latestFluctuationSnapshot.isFallback
            });
          }
        }
      }

      if (!predictions.length) {
        outlookList.hidden = true;
        updateStatus(outlookStatus, 'Esperando datos para proyectar cambios.', 'info');
        return;
      }

      outlookList.innerHTML = '';
      predictions.slice(0, 4).forEach((prediction) => {
        const item = document.createElement('li');
        item.className = 'outlook-item';

        const pair = document.createElement('div');
        pair.className = 'momentum-pair';
        const rightLabel = Number.isFinite(prediction.percent)
          ? `${prediction.percent >= 0 ? '+' : ''}${prediction.percent.toFixed(2)}%`
          : '--';
        pair.innerHTML = `<span>${prediction.label}</span><span class="momentum-rate">${rightLabel}</span>`;

        const trendLabel = document.createElement('span');
        trendLabel.className = 'insight-trend';
        trendLabel.dataset.trend = prediction.trend;
        trendLabel.textContent = prediction.trend === 'up' ? 'Subirá' : prediction.trend === 'down' ? 'Bajará' : 'Estable';

        const detail = document.createElement('p');
        detail.className = 'insight-detail';
        detail.textContent = prediction.detail;

        item.appendChild(pair);
        item.appendChild(trendLabel);
        item.appendChild(detail);
        outlookList.appendChild(item);
      });

      outlookList.hidden = false;
      const usingFallback = predictions.some((p) => p.isFallback);
      updateStatus(outlookStatus, usingFallback ? 'Pronóstico basado en datos de referencia locales.' : '', 'info');
    }

    // ---- Modo Online/Offline ----
    function saveMode() {
      try { localStorage.setItem(STORAGE.MODE, isOfflineMode ? 'offline' : 'online'); } catch {}
    }
    function loadSavedMode() {
      try {
        const m = localStorage.getItem(STORAGE.MODE);
        if (m === 'offline') return true;
        if (m === 'online') return false;
      } catch {}
      return false; // por defecto online
    }
    function saveSelects() {
      try {
        if (fromSelect?.value) localStorage.setItem(STORAGE.FROM, fromSelect.value);
        if (toSelect?.value) localStorage.setItem(STORAGE.TO, toSelect.value);
        if (offlineFromSelect?.value) localStorage.setItem(STORAGE.OFF_FROM, offlineFromSelect.value);
        if (offlineToSelect?.value) localStorage.setItem(STORAGE.OFF_TO, offlineToSelect.value);
      } catch {}
    }
    function restoreOnlineSelects() {
      try {
        const sFrom = localStorage.getItem(STORAGE.FROM);
        const sTo = localStorage.getItem(STORAGE.TO);
        if (sFrom && currencyMap.has(sFrom)) fromSelect.value = sFrom;
        if (sTo && currencyMap.has(sTo)) toSelect.value = sTo;
      } catch {}
    }
    function restoreOfflineSelects() {
      try {
        const sFrom = localStorage.getItem(STORAGE.OFF_FROM);
        const sTo = localStorage.getItem(STORAGE.OFF_TO);
        if (sFrom && offlineRatesMap.has(sFrom)) offlineFromSelect.value = sFrom;
        if (sTo && offlineRatesMap.has(sTo)) offlineToSelect.value = sTo;
      } catch {}
    }
    function syncModeToggleSlot() {
      if (!modeToggleContainer) return;
      const targetSlot = isOfflineMode ? offlineModeSlot : onlineModeSlot;
      if (!targetSlot || targetSlot.contains(modeToggleContainer)) return;
      try { targetSlot.appendChild(modeToggleContainer); } catch {}
    }

    function setConverterMode(offline) {
      const shouldGoOffline = Boolean(offline);
      isOfflineMode = shouldGoOffline;

      if (currencyContainer) {
        currencyContainer.setAttribute('data-mode', isOfflineMode ? 'offline' : 'online');
      }

      syncModeToggleSlot();

      // Online
      if (onlineConverterSection) onlineConverterSection.hidden = isOfflineMode;
      if (onlineRatesCard) onlineRatesCard.hidden = isOfflineMode;

      // Offline
      if (offlineSection) offlineSection.hidden = !isOfflineMode;
      if (offlineRatesCard) offlineRatesCard.hidden = !isOfflineMode;

      // Resultados
      if (resultSection) {
        if (isOfflineMode) {
          onlineResultWasHidden = resultSection.hidden;
          resultSection.hidden = true;
        } else {
          resultSection.hidden = onlineResultWasHidden;
        }
      }
      if (offlineResultSection) {
        if (isOfflineMode) {
          offlineResultSection.hidden = offlineResultWasHidden;
        } else {
          offlineResultWasHidden = offlineResultSection.hidden;
          offlineResultSection.hidden = true;
        }
      }

      // Botón modo
      if (modeToggleButton) {
        modeToggleButton.setAttribute('aria-pressed', String(isOfflineMode));
        modeToggleButton.classList.toggle('is-offline', isOfflineMode);
        modeToggleButton.textContent = isOfflineMode ? 'OF' : 'ON';
        modeToggleButton.setAttribute(
          'aria-label',
          isOfflineMode ? 'Cambiar a modo en línea' : 'Cambiar a modo offline'
        );
      }

      // Tarjetas opcionales
      if (fluctuationCard) fluctuationCard.hidden = isOfflineMode;
      if (timeseriesCard) timeseriesCard.hidden = isOfflineMode;
      if (momentumCard) momentumCard.hidden = isOfflineMode;
      if (outlookCard) outlookCard.hidden = isOfflineMode;

      // Live card (si existe)
      if (liveRateCard) {
        liveRateCard.hidden = isOfflineMode;
        if (isOfflineMode) {
          stopLiveRateUpdates();
          if (liveRateBody) liveRateBody.hidden = true;
          updateStatus(liveRateStatus, 'Disponible únicamente en modo en línea.', 'info');
        } else {
          updateStatus(liveRateStatus, '', 'info');
          startLiveRateUpdates();
        }
      }

      // Secciones marcadas como solo online
      onlineOnlySections.forEach((section) => {
        if (section instanceof HTMLElement) section.hidden = isOfflineMode;
      });

      saveMode();
    }

    // ---- Cargar tasas online ----
    async function loadRates() {
      try {
        const api = globalThis.CurrencyAPI;
        let data;

        if (api && typeof api.listRates === 'function') {
          data = await api.listRates();
        } else {
          const response = await fetch('/api/currency/rates/EUR');
          if (!response.ok) throw new Error('No se pudo obtener la lista de tasas');
          data = await response.json();
        }

        if (!data || data.ok === false || !Array.isArray(data.currencies)) {
          throw new Error(data?.msg || 'Respuesta inesperada de la API de monedas');
        }

        showOnlineStatus('');
        setOnlineFormDisabled(false);

        ratesData = data;
        currencyMap = new Map();
        fromSelect.innerHTML = '<option value="" disabled selected>Selecciona moneda</option>';
        toSelect.innerHTML = '<option value="" disabled selected>Selecciona moneda</option>';
        ratesTableBody.innerHTML = '';

        data.currencies.forEach((currency) => {
          const normalized = {
            code: String(currency.code).toUpperCase(),
            name: currency.name || currency.code,
            symbol: currency.symbol || '',
            rate: Number(currency.rate)
          };
          currencyMap.set(normalized.code, normalized);
          fromSelect.appendChild(createOption(normalized));
          toSelect.appendChild(createOption(normalized));

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${normalized.code}</td>
            <td>${normalized.name}</td>
            <td>${normalized.symbol || '-'}</td>
            <td>${normalized.rate.toLocaleString('es-EC', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
          `;
          ratesTableBody.appendChild(row);
        });

        // Etiqueta base
        if (baseCurrencyLabel) {
          const base = data.base;
          const baseCode = typeof base === 'string' ? base : base?.code;
          const baseName = typeof base === 'string' ? base : base?.name;
          const baseSymbol = typeof base === 'object' ? base?.symbol : undefined;
          let label = baseCode || 'USD';
          if (baseName && baseName !== baseCode) label = `${baseCode} — ${baseName}`;
          if (baseSymbol) label += ` (${baseSymbol})`;
          baseCurrencyLabel.textContent = label;
        }

        // Fecha de actualización
        if (ratesUpdatedAt) {
          if (data.updatedAt) {
            const updated = new Date(data.updatedAt);
            ratesUpdatedAt.textContent = isNaN(updated.getTime())
              ? data.updatedAt
              : updated.toLocaleString('es-EC');
          } else {
            ratesUpdatedAt.textContent = 'No disponible';
          }
        }

        // Defaults de la API
        const defaults = data.defaults || {};
        const preferredFrom = String(defaults.from || '').toUpperCase();
        const preferredTo = String(defaults.to || '').toUpperCase();

        if (preferredFrom && currencyMap.has(preferredFrom)) {
          fromSelect.value = preferredFrom;
        } else {
          const baseCode = typeof data.base === 'string' ? data.base : data.base?.code;
          if (baseCode && currencyMap.has(baseCode)) {
            fromSelect.value = baseCode;
          } else {
            const first = currencyMap.keys().next().value;
            if (first) fromSelect.value = first;
          }
        }

        if (preferredTo && currencyMap.has(preferredTo)) {
          toSelect.value = preferredTo;
        } else {
          const fallback = Array.from(currencyMap.keys()).find((code) => code !== fromSelect.value);
          if (fallback) toSelect.value = fallback;
        }

        // Restaura lo guardado del usuario
        restoreOnlineSelects();

        // Si veníamos forzados a offline por error y ya hay datos, volvemos a online
        if (forcedOfflineByError) {
          forcedOfflineByError = false;
          setConverterMode(false);
        }

        updateMomentumCard();
        updateOutlookCard();
      } catch (error) {
        console.error('Error cargando tasas', error);
        ratesData = null;
        currencyMap = new Map();
        fromSelect.innerHTML = '<option value="" disabled selected>Sin datos en línea</option>';
        toSelect.innerHTML = '<option value="" disabled selected>Sin datos en línea</option>';
        ratesTableBody.innerHTML = '';
        if (ratesUpdatedAt) ratesUpdatedAt.textContent = 'No disponible';
        showOnlineStatus(error.message || 'La API de conversión no está disponible en este momento.');
        setOnlineFormDisabled(true);
        forcedOfflineByError = true;
        setConverterMode(true);

        updateMomentumCard();
        updateOutlookCard();
      }
    }

    function setOnlineFormDisabled(disabled) {
      const elements = form.querySelectorAll('input, select, button');
      elements.forEach((el) => { el.disabled = disabled; });
    }
    function showOnlineStatus(message) {
      if (!onlineStatus) return;
      if (message) {
        onlineStatus.textContent = message;
        onlineStatus.hidden = false;
      } else {
        onlineStatus.textContent = '';
        onlineStatus.hidden = true;
      }
    }

    // ---- Convertir (online) ----
    async function convertCurrency(event) {
      event.preventDefault();

      const from = fromSelect.value;
      const to = toSelect.value;
      const amount = parseFloat(amountInput.value);

      if (!from || !to || Number.isNaN(amount)) {
        alert('Selecciona monedas válidas e ingresa un monto.');
        return;
      }

      try {
        const api = globalThis.CurrencyAPI;
        let data;

        if (api && typeof api.convert === 'function') {
          data = await api.convert({ from, to, amount });
        } else {
          const response = await fetch('/api/currency/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to, amount })
          });
          data = await response.json();
          if (!response.ok) {
            throw new Error(data?.msg || 'No se pudo completar la conversión');
          }
        }

        if (!data || data.ok === false) {
          throw new Error(data?.msg || 'No se pudo completar la conversión');
        }

        const conversion = data.conversion;
        const fromCurrency = currencyMap.get(conversion?.from?.code) || conversion?.from;
        const toCurrency = currencyMap.get(conversion?.to?.code) || conversion?.to;

        const toSymbol = toCurrency?.symbol || conversion?.to?.symbol || '';
        const formattedAmount = Number(conversion?.to?.amount || 0).toLocaleString('es-EC', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        resultValue.textContent = `${toSymbol ? `${toSymbol} ` : ''}${formattedAmount} ${conversion?.to?.code || to}`;

        const rate =
          conversion?.rate || conversion?.to?.amount / (conversion?.from?.amount || amount);
        const fromLabel = fromCurrency
          ? `${fromCurrency.code}${fromCurrency.symbol ? ` (${fromCurrency.symbol})` : ''}`
          : from;
        const toLabel = toCurrency
          ? `${toCurrency.code}${toCurrency.symbol ? ` (${toCurrency.symbol})` : ''}`
          : to;

        resultRate.textContent = `1 ${fromLabel} = ${rate.toFixed(4)} ${toLabel}`;

        if (resultBaseAmount) {
          const baseInfo = conversion?.base || ratesData?.base || {};
          const baseCode = typeof baseInfo === 'string' ? baseInfo : baseInfo?.code;
          const baseSymbol = typeof baseInfo === 'object' ? baseInfo?.symbol || '' : '';
          if (conversion?.amountInBase != null && baseCode) {
            const formattedBase = Number(conversion.amountInBase).toLocaleString('es-EC', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            const label = baseSymbol ? `${baseCode} (${baseSymbol})` : baseCode;
            resultBaseAmount.textContent = `Equivalente en ${label}: ${baseSymbol ? `${baseSymbol} ` : ''}${formattedBase}`;
          } else {
            resultBaseAmount.textContent = '';
          }
        }

        if (conversion?.updatedAt && resultUpdated) {
          const updated = new Date(conversion.updatedAt);
          resultUpdated.textContent = isNaN(updated.getTime())
            ? `Actualizado: ${conversion.updatedAt}`
            : `Actualizado: ${updated.toLocaleString('es-EC')}`;
        } else if (resultUpdated) {
          resultUpdated.textContent = '';
        }

        resultSection.hidden = false;
        onlineResultWasHidden = false;
        resultSection.classList.add('highlight');
        setTimeout(() => resultSection.classList.remove('highlight'), 600);
        saveSelects();
      } catch (error) {
        alert(error.message || 'No se pudo convertir la moneda.');
      }
    }

    // ---- Poblar Offline ----
    function createOption(currency) {
      const code = String(currency.code).toUpperCase();
      const name = currency.name || code;
      const symbol = currency.symbol ? String(currency.symbol) : '';
      const option = document.createElement('option');
      option.value = code;
      option.textContent = symbol ? `${code} — ${name} (${symbol})` : `${code} — ${name}`;
      return option;
    }
    function getOfflineCurrencyInfo(code) {
      const normalizedCode = String(code || '').toUpperCase();
      return OFFLINE_DATA.currencies.find(c => String(c.code).toUpperCase() === normalizedCode);
    }
    function populateOfflineData() {
      if (!offlineSection || !offlineForm || !offlineFromSelect || !offlineToSelect || !offlineRatesTableBody) return;

      offlineFromSelect.innerHTML = '<option value="" disabled selected>Selecciona moneda</option>';
      offlineToSelect.innerHTML = '<option value="" disabled selected>Selecciona moneda</option>';
      offlineRatesTableBody.innerHTML = '';
      offlineRatesMap.clear();

      OFFLINE_DATA.currencies.forEach((currency) => {
        const normalized = {
          code: String(currency.code).toUpperCase(),
          name: currency.name || currency.code,
          symbol: currency.symbol || '',
          rate: Number(currency.rate)
        };

        offlineRatesMap.set(normalized.code, normalized);
        offlineFromSelect.appendChild(createOption(normalized));
        offlineToSelect.appendChild(createOption(normalized));

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${normalized.code}</td>
          <td>${normalized.name}</td>
          <td>${normalized.symbol || '-'}</td>
          <td>${normalized.rate.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        `;
        offlineRatesTableBody.appendChild(row);
      });

      if (OFFLINE_DATA.base && offlineRatesMap.has(String(OFFLINE_DATA.base.code).toUpperCase())) {
        offlineFromSelect.value = String(OFFLINE_DATA.base.code).toUpperCase();
      }

      const defaultTarget = Array.from(offlineRatesMap.keys()).find(
        (code) => code !== offlineFromSelect.value
      );
      if (defaultTarget) {
        offlineToSelect.value = defaultTarget;
      }

      if (offlineRatesUpdatedAt) {
        const updated = new Date(OFFLINE_DATA.updatedAt);
        offlineRatesUpdatedAt.textContent = isNaN(updated.getTime())
          ? OFFLINE_DATA.updatedAt
          : updated.toLocaleString('es-EC');
      }

      // Restaura últimas selecciones offline si existen
      restoreOfflineSelects();
    }

    // ---- Convertir Offline ----
    function handleOfflineConversion(event) {
      event.preventDefault();

      if (!offlineFromSelect || !offlineToSelect || !offlineAmountInput || !offlineResultValue || !offlineResultRate) {
        return;
      }

      const from = offlineFromSelect.value;
      const to = offlineToSelect.value;
      const amount = parseFloat(offlineAmountInput.value);

      if (!from || !to || Number.isNaN(amount)) {
        alert('Selecciona monedas válidas e ingresa un monto.');
        return;
      }

      const fromCurrency = offlineRatesMap.get(from);
      const toCurrency = offlineRatesMap.get(to);

      if (!fromCurrency || !toCurrency) {
        alert('No se pudieron encontrar tasas offline para las monedas seleccionadas.');
        return;
      }

      const fromRate = fromCurrency.rate;
      const toRate = toCurrency.rate;

      const amountInBase = fromRate > 0 ? amount / fromRate : 0;
      const convertedAmount = amountInBase * toRate;
      const rate = amount > 0 ? convertedAmount / amount : (from === to ? 1 : toRate / fromRate);

      const fromSymbol = fromCurrency.symbol || '';
      const toSymbol = toCurrency.symbol || '';
      const baseInfo = getOfflineCurrencyInfo(OFFLINE_DATA.base?.code || 'USD') || OFFLINE_DATA.base || {};
      const baseSymbol = baseInfo.symbol || '';
      const baseCode = baseInfo.code || 'USD';

      const formattedToAmount = convertedAmount.toLocaleString('es-EC', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      });
      offlineResultValue.textContent = `${toSymbol ? `${toSymbol} ` : ''}${formattedToAmount} ${to}`;
      offlineResultRate.textContent = `1 ${from}${fromSymbol ? ` (${fromSymbol})` : ''} = ${rate.toFixed(4)} ${to}${toSymbol ? ` (${toSymbol})` : ''}`;

      if (offlineResultBaseAmount) {
        const formattedBase = amountInBase.toLocaleString('es-EC', {
          minimumFractionDigits: 2, maximumFractionDigits: 2
        });
        offlineResultBaseAmount.textContent = `Equivalente en ${baseCode}${baseSymbol ? ` (${baseSymbol})` : ''}: ${baseSymbol ? `${baseSymbol} ` : ''}${formattedBase}`;
      }

      if (offlineResultUpdated) {
        const updated = new Date(OFFLINE_DATA.updatedAt);
        offlineResultUpdated.textContent = isNaN(updated.getTime())
          ? `Actualizado: ${OFFLINE_DATA.updatedAt}`
          : `Actualizado: ${updated.toLocaleString('es-EC')}`;
      }

      if (offlineResultSection) {
        offlineResultSection.hidden = false;
        offlineResultWasHidden = false;
        offlineResultSection.classList.add('highlight');
        setTimeout(() => offlineResultSection.classList.remove('highlight'), 600);
      }

      saveSelects();
    }

    // ---- Fluctuación semanal (con fallback) ----
    function applyFluctuationRange(start, end) {
      if (!fluctuationRangeLabel) return;
      const startDate = start ? new Date(start) : null;
      const endDate = end ? new Date(end) : null;
      const formattedStart = startDate && !isNaN(startDate.getTime())
        ? formatDateDisplay(startDate)
        : (start || '');
      const formattedEnd = endDate && !isNaN(endDate.getTime())
        ? formatDateDisplay(endDate)
        : (end || '');
      if (!formattedStart && !formattedEnd) {
        fluctuationRangeLabel.textContent = 'Últimos 7 días';
        return;
      }
      if (!formattedEnd) {
        fluctuationRangeLabel.textContent = formattedStart;
        return;
      }
      fluctuationRangeLabel.textContent = `${formattedStart} — ${formattedEnd}`;
    }
    function renderFluctuationData(payload, { isFallback = false } = {}) {
      if (!fluctuationTableBody) {
        latestFluctuationSnapshot = null;
        updateMomentumCard();
        updateOutlookCard();
        updateStatus(fluctuationStatus, 'Sin datos recientes para mostrar.', 'info');
        return;
      }

      const rates = payload?.rates;
      if (!rates || typeof rates !== 'object') {
        latestFluctuationSnapshot = null;
        updateMomentumCard();
        updateOutlookCard();
        updateStatus(fluctuationStatus, 'Sin datos recientes para mostrar.', 'info');
        return;
      }

      const entries = Object.entries(rates);
      if (!entries.length) {
        latestFluctuationSnapshot = null;
        updateMomentumCard();
        updateOutlookCard();
        updateStatus(fluctuationStatus, 'Sin datos recientes para mostrar.', 'info');
        return;
      }

      const startDate = payload.start_date || payload.startDate || payload.start;
      const endDate = payload.end_date || payload.endDate || payload.end;
      applyFluctuationRange(startDate, endDate);

      fluctuationTableBody.innerHTML = '';

      const normalizedEntries = [];

      entries.forEach(([code, info]) => {
        const change = Number(info?.change ?? 0);
        const percent = Number(info?.change_pct ?? info?.changePercent ?? 0);
        normalizedEntries.push({ code, change, percent });
        const row = document.createElement('tr');
        const formattedChange = `${change >= 0 ? '+' : ''}${change.toFixed(4)}`;
        const formattedPercent = `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
        row.innerHTML = `
          <td>${code}</td>
          <td>${formattedChange}</td>
          <td>${formattedPercent}</td>
        `;
        fluctuationTableBody.appendChild(row);
      });

      if (fluctuationTableWrapper) fluctuationTableWrapper.hidden = false;

      const fallbackMessage = isFallback
        ? 'Mostrando variaciones con datos de referencia locales.'
        : '';
      updateStatus(fluctuationStatus, fallbackMessage, 'info');

      latestFluctuationSnapshot = {
        entries: normalizedEntries,
        isFallback
      };

      updateMomentumCard();
      updateOutlookCard();
    }
    async function loadFluctuationData() {
      if (!fluctuationCard || !fluctuationTableBody) return;

      if (fluctuationTableWrapper) fluctuationTableWrapper.hidden = true;
      updateStatus(fluctuationStatus, 'Cargando variaciones recientes...', 'info');

      const end = new Date();
      const start = new Date(end);
      start.setDate(end.getDate() - 7);

      const startStr = formatDateISO(start);
      const endStr = formatDateISO(end);

      applyFluctuationRange(startStr, endStr);

      const url = `https://api.exchangerate.host/fluctuation?start_date=${startStr}&end_date=${endStr}&base=USD&symbols=${FLUCTUATION_SYMBOLS.join(',')}`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('No se pudo obtener la variación semanal.');
        const data = await response.json();
        if (data?.success === false || !data?.rates) {
          throw new Error('Respuesta inesperada de exchangerate.host');
        }
        renderFluctuationData(data);
      } catch (error) {
        console.error('Error cargando fluctuaciones', error);
        if (!usedFluctuationFallback) {
          usedFluctuationFallback = true;
          renderFluctuationData(FLUCTUATION_FALLBACK, { isFallback: true });
          return;
        }
        latestFluctuationSnapshot = null;
        updateMomentumCard();
        updateOutlookCard();
        updateStatus(
          fluctuationStatus,
          error.message || 'No se pudo calcular la variación semanal de monedas.',
          'error'
        );
      }
    }

    // ---- Serie histórica (con fallback) ----
    function renderTimeseriesData(payload, { isFallback = false } = {}) {
      if (!timeseriesCard || !timeseriesTableBody || !timeseriesDeltaValue || !timeseriesPercentValue) {
        return;
      }

      const rates = payload?.rates;
      if (!rates || typeof rates !== 'object') {
        latestTimeseriesSnapshot = null;
        updateOutlookCard();
        updateStatus(timeseriesStatus, 'Sin datos históricos para mostrar.', 'info');
        return;
      }

      const dates = Object.keys(rates).sort();
      if (!dates.length) {
        latestTimeseriesSnapshot = null;
        updateOutlookCard();
        updateStatus(timeseriesStatus, 'Sin datos históricos para mostrar.', 'info');
        return;
      }

      timeseriesTableBody.innerHTML = '';

      dates.forEach((dateKey) => {
        const rateValue = rates[dateKey]?.[TIMESERIES_TARGET];
        if (typeof rateValue !== 'number') return;

        const row = document.createElement('tr');
        const day = new Date(dateKey);
        row.innerHTML = `
          <td>${isNaN(day.getTime()) ? dateKey : formatDateDisplay(day)}</td>
          <td>${rateValue.toFixed(4)}</td>
        `;
        timeseriesTableBody.appendChild(row);
      });

      const firstRate = rates[dates[0]]?.[TIMESERIES_TARGET];
      const lastRate = rates[dates[dates.length - 1]]?.[TIMESERIES_TARGET];

      if (typeof firstRate === 'number' && typeof lastRate === 'number') {
        const delta = lastRate - firstRate;
        const percentChange = firstRate !== 0 ? (delta / firstRate) * 100 : 0;
        const formattedDelta = `${delta >= 0 ? '+' : ''}${delta.toFixed(4)}`;
        const formattedPercent = `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`;
        timeseriesDeltaValue.textContent = formattedDelta;
        timeseriesPercentValue.textContent = formattedPercent;
        latestTimeseriesSnapshot = {
          delta,
          percent: percentChange,
          firstRate,
          lastRate,
          isFallback
        };
      } else {
        timeseriesDeltaValue.textContent = 'No disponible';
        timeseriesPercentValue.textContent = 'No disponible';
        latestTimeseriesSnapshot = null;
      }

      if (timeseriesGrid) timeseriesGrid.hidden = false;

      const fallbackMessage = isFallback
        ? 'Mostrando serie histórica con datos de referencia locales.'
        : '';
      updateStatus(timeseriesStatus, fallbackMessage, 'info');

      updateOutlookCard();
    }
    async function loadTimeseriesData() {
      if (!timeseriesCard || !timeseriesTableBody || !timeseriesDeltaValue || !timeseriesPercentValue) return;

      if (timeseriesGrid) timeseriesGrid.hidden = true;
      updateStatus(timeseriesStatus, 'Cargando serie histórica...', 'info');

      const end = new Date();
      const start = new Date(end);
      start.setDate(end.getDate() - 7);

      const startStr = formatDateISO(start);
      const endStr = formatDateISO(end);

      // Frankfurter oficial (histórico)
      const url = `https://api.frankfurter.app/timeseries?start=${startStr}&end=${endStr}&from=${LIVE_RATE_BASE}&to=${TIMESERIES_TARGET}`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('No se pudo obtener la serie histórica.');
        const data = await response.json();
        if (!data?.rates || typeof data.rates !== 'object') {
          throw new Error('Respuesta inesperada de Frankfurter');
        }
        renderTimeseriesData(data);
      } catch (error) {
        console.error('Error cargando serie histórica', error);
        if (!usedTimeseriesFallback) {
          usedTimeseriesFallback = true;
          renderTimeseriesData(TIMESERIES_FALLBACK, { isFallback: true });
          return;
        }
        latestTimeseriesSnapshot = null;
        updateOutlookCard();
        updateStatus(
          timeseriesStatus,
          error.message || 'No se pudo mostrar la serie diaria de Frankfurter.',
          'error'
        );
      }
    }

    // ---- Live Rate (opcional) ----
    function renderLiveRateData(payload, { isFallback = false } = {}) {
      if (!liveRateCard || !liveRateBody || !liveRateValue || !liveRateDelta || !liveRateUpdatedAt) {
        return;
      }
      const rate = Number(payload?.rate);
      if (!Number.isFinite(rate)) {
        liveRateBody.hidden = true;
        updateStatus(liveRateStatus, 'No se pudo calcular la tasa en tiempo real.', 'error');
        latestLiveRateSnapshot = null;
        updateOutlookCard();
        return;
      }
      const providedPrevious = Number(payload?.previousRate);
      const referenceRate = Number.isFinite(providedPrevious) ? providedPrevious : previousLiveRate;

      liveRateValue.textContent = rate.toFixed(4);

      if (payload?.updatedAt) {
        const updated = new Date(payload.updatedAt);
        liveRateUpdatedAt.textContent = isNaN(updated.getTime())
          ? payload.updatedAt
          : updated.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
      } else {
        liveRateUpdatedAt.textContent = 'En espera';
      }

      let percentChange = null;
      let deltaChange = null;

      if (Number.isFinite(referenceRate) && referenceRate !== 0) {
        const delta = rate - referenceRate;
        const percent = (delta / referenceRate) * 100;
        const formattedDelta = `${delta >= 0 ? '+' : ''}${delta.toFixed(4)}`;
        const formattedPercent = `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
        liveRateDelta.textContent = `${formattedDelta} (${formattedPercent})`;
        liveRateDelta.dataset.trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
        percentChange = percent;
        deltaChange = delta;
      } else {
        liveRateDelta.textContent = 'Esperando referencia previa...';
        liveRateDelta.dataset.trend = 'flat';
      }

      previousLiveRate = rate;
      liveRateBody.hidden = false;
      usedLiveRateFallback = isFallback;
      updateStatus(liveRateStatus, isFallback ? 'Mostrando tasa estimada con datos de referencia.' : '', 'info');

      latestLiveRateSnapshot = {
        rate,
        previousRate: referenceRate,
        percent: percentChange,
        delta: deltaChange,
        isFallback
      };

      updateOutlookCard();
    }
    async function loadLiveRateData() {
      if (!liveRateCard || !liveRateValue) return;

      updateStatus(liveRateStatus, 'Actualizando tasa en vivo...', 'info');
      const url = `https://api.exchangerate.host/latest?base=${LIVE_RATE_BASE}&symbols=${LIVE_RATE_TARGET}`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('No se pudo obtener la tasa en vivo.');
        const data = await response.json();
        const rate = data?.rates?.[LIVE_RATE_TARGET];
        if (!Number.isFinite(rate)) throw new Error('Respuesta inesperada del monitor en vivo.');
        renderLiveRateData({
          rate,
          previousRate: previousLiveRate,
          updatedAt: data?.date || data?.time_last_update_utc || new Date().toISOString()
        });
      } catch (error) {
        console.error('Error actualizando tasa en vivo', error);
        usedLiveRateFallback = true;
        renderLiveRateData(LIVE_RATE_FALLBACK, { isFallback: true });
      }
    }
    function startLiveRateUpdates() {
      if (!liveRateCard || liveRateIntervalId) return;
      loadLiveRateData();
      liveRateIntervalId = setInterval(loadLiveRateData, LIVE_RATE_INTERVAL_MS);
    }
    function stopLiveRateUpdates() {
      if (liveRateIntervalId) {
        clearInterval(liveRateIntervalId);
        liveRateIntervalId = null;
      }
    }

    // ---- Listeners ----
    if (modeToggleButton) {
      modeToggleButton.addEventListener('click', () => {
        forcedOfflineByError = false;
        setConverterMode(!isOfflineMode);
      });
    }
    fromSelect?.addEventListener('change', saveSelects);
    toSelect?.addEventListener('change', saveSelects);
    offlineFromSelect?.addEventListener('change', saveSelects);
    offlineToSelect?.addEventListener('change', saveSelects);

    // ---- Estado inicial ----
    syncModeToggleSlot();
    const initialOffline = loadSavedMode();
    populateOfflineData();
    loadRates();
    loadFluctuationData();
    loadTimeseriesData();
    setConverterMode(initialOffline);

    // ---- Formularios ----
    form.addEventListener('submit', convertCurrency);
    if (offlineForm) offlineForm.addEventListener('submit', handleOfflineConversion);
  });
})();

/**
 * ============================================================================
 *  GLOBAL BALANCED PAYWALL ENGINE — Purchasing Power Parity pricing
 * ============================================================================
 *  The Free Code Hub curriculum and sandbox are 100% free. Only the OFFICIAL
 *  CERTIFICATE is paid. To make sure no country is priced out, the standard
 *  tier ($49 USD) is scaled by a per-country PPP multiplier and clamped to a
 *  floor (~$10 USD equivalent), then routed into the local currency.
 *
 *  Country detection order (see routes/billing.js):
 *    1. explicit body field (countryCode / currency)
 *    2. geo headers: x-country-code, cf-ipcountry, x-geo-country (ISO 3166-1 alpha-2)
 *    3. ?country= query param
 *    4. fallback: global-average medium tier
 *
 *  Exchange rates below are MOCK reference rates for the demo — a production
 *  deployment refreshes them from a rates provider and keys Stripe prices per
 *  currency (Stripe Localized Elements / Payment Element with currency).
 * ============================================================================
 */

const BASE_PRICE_USD = 49; // Standard tier
const FLOOR_PRICE_USD = 10; // Emerging-economy floor (~$10–15 band)

/**
 * @typedef {Object} CountryPricing
 * @property {string} currency  ISO 4217 code (uppercase)
 * @property {string} symbol    Local currency symbol
 * @property {number} rate      Local currency units per 1 USD (mock reference rate)
 * @property {number} multiplier PPP scale vs. the $49 standard tier (0 < m <= 1)
 */

/** @type {Record<string, CountryPricing>} keyed by ISO 3166-1 alpha-2 */
const COUNTRY_PRICING = {
  // ---- Standard tier (developed economies) ----
  US: { currency: 'USD', symbol: '$', rate: 1.0, multiplier: 1.0 },
  CA: { currency: 'CAD', symbol: '$', rate: 1.36, multiplier: 1.0 },
  GB: { currency: 'GBP', symbol: '£', rate: 0.79, multiplier: 1.0 },
  AU: { currency: 'AUD', symbol: '$', rate: 1.52, multiplier: 1.0 },
  NZ: { currency: 'NZD', symbol: '$', rate: 1.64, multiplier: 1.0 },
  CH: { currency: 'CHF', symbol: 'CHF', rate: 0.88, multiplier: 1.0 },
  NO: { currency: 'NOK', symbol: 'kr', rate: 10.8, multiplier: 1.0 },
  SE: { currency: 'SEK', symbol: 'kr', rate: 10.5, multiplier: 1.0 },
  DK: { currency: 'DKK', symbol: 'kr', rate: 6.9, multiplier: 1.0 },
  IE: { currency: 'EUR', symbol: '€', rate: 0.92, multiplier: 1.0 },
  NL: { currency: 'EUR', symbol: '€', rate: 0.92, multiplier: 1.0 },
  DE: { currency: 'EUR', symbol: '€', rate: 0.92, multiplier: 1.0 },
  FR: { currency: 'EUR', symbol: '€', rate: 0.92, multiplier: 1.0 },
  AT: { currency: 'EUR', symbol: '€', rate: 0.92, multiplier: 1.0 },
  BE: { currency: 'EUR', symbol: '€', rate: 0.92, multiplier: 1.0 },
  FI: { currency: 'EUR', symbol: '€', rate: 0.92, multiplier: 1.0 },
  SG: { currency: 'SGD', symbol: 'S$', rate: 1.35, multiplier: 0.95 },
  JP: { currency: 'JPY', symbol: '¥', rate: 150, multiplier: 0.9 },
  KR: { currency: 'KRW', symbol: '₩', rate: 1350, multiplier: 0.85 },
  IL: { currency: 'ILS', symbol: '₪', rate: 3.7, multiplier: 0.85 },
  ES: { currency: 'EUR', symbol: '€', rate: 0.92, multiplier: 0.85 },
  IT: { currency: 'EUR', symbol: '€', rate: 0.92, multiplier: 0.85 },
  PT: { currency: 'EUR', symbol: '€', rate: 0.92, multiplier: 0.7 },
  GR: { currency: 'EUR', symbol: '€', rate: 0.92, multiplier: 0.7 },
  AE: { currency: 'AED', symbol: 'د.إ', rate: 3.67, multiplier: 0.7 },

  // ---- Medium tier ----
  PL: { currency: 'PLN', symbol: 'zł', rate: 4.0, multiplier: 0.55 },
  CZ: { currency: 'CZK', symbol: 'Kč', rate: 23.0, multiplier: 0.6 },
  HU: { currency: 'HUF', symbol: 'Ft', rate: 360, multiplier: 0.55 },
  RO: { currency: 'RON', symbol: 'lei', rate: 4.6, multiplier: 0.5 },
  SA: { currency: 'SAR', symbol: '﷼', rate: 3.75, multiplier: 0.55 },
  KZ: { currency: 'KZT', symbol: '₸', rate: 450, multiplier: 0.5 },

  // ---- Emerging tier (PPP-scaled down toward the floor) ----
  MX: { currency: 'MXN', symbol: '$', rate: 17.0, multiplier: 0.42 },
  BR: { currency: 'BRL', symbol: 'R$', rate: 5.0, multiplier: 0.38 },
  AR: { currency: 'ARS', symbol: '$', rate: 1000, multiplier: 0.35 },
  CL: { currency: 'CLP', symbol: '$', rate: 920, multiplier: 0.45 },
  CO: { currency: 'COP', symbol: '$', rate: 4000, multiplier: 0.36 },
  PE: { currency: 'PEN', symbol: 'S/', rate: 3.7, multiplier: 0.36 },
  ZA: { currency: 'ZAR', symbol: 'R', rate: 18.0, multiplier: 0.34 },
  TR: { currency: 'TRY', symbol: '₺', rate: 32.0, multiplier: 0.32 },
  UA: { currency: 'UAH', symbol: '₴', rate: 40.0, multiplier: 0.3 },
  GH: { currency: 'GHS', symbol: '₵', rate: 15.0, multiplier: 0.3 },
  ID: { currency: 'IDR', symbol: 'Rp', rate: 15500, multiplier: 0.3 },
  RU: { currency: 'RUB', symbol: '₽', rate: 92.0, multiplier: 0.45 },
  CN: { currency: 'CNY', symbol: '¥', rate: 7.2, multiplier: 0.45 },
  MY: { currency: 'MYR', symbol: 'RM', rate: 4.6, multiplier: 0.45 },
  TH: { currency: 'THB', symbol: '฿', rate: 35.0, multiplier: 0.42 },
  VN: { currency: 'VND', symbol: '₫', rate: 24500, multiplier: 0.28 },
  PH: { currency: 'PHP', symbol: '₱', rate: 56.0, multiplier: 0.27 },
  IN: { currency: 'INR', symbol: '₹', rate: 83.0, multiplier: 0.26 },
  KE: { currency: 'KES', symbol: 'KSh', rate: 130, multiplier: 0.26 },
  PK: { currency: 'PKR', symbol: '₨', rate: 278, multiplier: 0.24 },
  BD: { currency: 'BDT', symbol: '৳', rate: 110, multiplier: 0.24 },
  EG: { currency: 'EGP', symbol: 'E£', rate: 48.0, multiplier: 0.25 },
  LK: { currency: 'LKR', symbol: 'Rs', rate: 300, multiplier: 0.25 },
  NP: { currency: 'NPR', symbol: '₨', rate: 133, multiplier: 0.22 },
  NG: { currency: 'NGN', symbol: '₦', rate: 1500, multiplier: 0.22 },
  MM: { currency: 'MMK', symbol: 'K', rate: 2100, multiplier: 0.18 },
};

/** Fallback for unknown countries: a "medium-tier" global average. */
const DEFAULT_REGION = { currency: 'USD', symbol: '$', rate: 1.0, multiplier: 0.6 };

/**
 * Resolves a country code OR currency code to a pricing region.
 * @param {string|null|undefined} input - ISO alpha-2 country or ISO 4217 currency
 * @returns {{code: string} & CountryPricing}
 */
function resolveRegion(input) {
  if (!input || typeof input !== 'string') {
    return { code: 'US', ...COUNTRY_PRICING.US };
  }
  const raw = input.trim().toUpperCase();
  if (COUNTRY_PRICING[raw]) {
    return { code: raw, ...COUNTRY_PRICING[raw] };
  }
  // Accept a currency code (e.g. "INR") as a routing hint too.
  const byCurrency = Object.entries(COUNTRY_PRICING).find(([, v]) => v.currency === raw);
  if (byCurrency) {
    return { code: byCurrency[0], ...byCurrency[1] };
  }
  return { code: 'XX', ...DEFAULT_REGION };
}

/** Derives the human tier label from the PPP multiplier. */
function tierForMultiplier(multiplier) {
  if (multiplier >= 0.9) return 'standard';
  if (multiplier >= 0.5) return 'medium';
  return 'emerging';
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Computes the localized certificate price for a country/currency.
 * priceUSD = clamp(BASE * multiplier, FLOOR, BASE)
 * localAmount = priceUSD * rate
 *
 * @param {string} countryInput - ISO country or currency code
 * @returns {object} full pricing breakdown (see tests/ppp.test.js)
 */
function computeCertificatePrice(countryInput) {
  const region = resolveRegion(countryInput);
  const rawUSD = BASE_PRICE_USD * region.multiplier;
  const clampedUSD = Math.min(BASE_PRICE_USD, Math.max(FLOOR_PRICE_USD, rawUSD));
  const priceUSD = round2(clampedUSD);
  const localAmount = round2(priceUSD * region.rate);

  return {
    product: 'Free Code Hub — Official Developer Certificate',
    countryCode: region.code,
    currency: region.currency.toLowerCase(), // Stripe-style lowercase ISO 4217
    currencySymbol: region.symbol,
    exchangeRate: region.rate,
    pppMultiplier: region.multiplier,
    tier: tierForMultiplier(region.multiplier),
    basePriceUSD: BASE_PRICE_USD,
    floorPriceUSD: FLOOR_PRICE_USD,
    priceUSD,
    localAmount,
    // NOTE: assumes a 2-decimal currency; production Stripe integration should
    // use Stripe's currency-specific minor-unit exponents (e.g. JPY = 0).
    minorUnits: Math.round(localAmount * 100),
    discountPercent: Math.round((1 - priceUSD / BASE_PRICE_USD) * 100),
    formattedUSD: `$${priceUSD.toFixed(2)} USD`,
    formattedLocal: `${region.symbol}${localAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${region.currency}`,
  };
}

/**
 * Builds a MOCK crypto payment quote (simulated gateway — no real transaction).
 * USDT is pegged 1:1 to USD for the demo.
 * @param {object} quote - result of computeCertificatePrice()
 */
function buildCryptoQuote(quote) {
  const address = '0xF2C0DE000000000000000000000000000000C0DE';
  return {
    network: 'Ethereum (ERC-20)',
    cryptoCurrency: 'USDT',
    address,
    cryptoAmount: quote.priceUSD,
    usdEquivalent: quote.priceUSD,
    qrPayload: `ethereum:${address}?value=${quote.priceUSD}`,
    note: 'DEMO MODE: simulated crypto gateway. No real transaction occurs.',
  };
}

module.exports = {
  BASE_PRICE_USD,
  FLOOR_PRICE_USD,
  COUNTRY_PRICING,
  resolveRegion,
  computeCertificatePrice,
  buildCryptoQuote,
};

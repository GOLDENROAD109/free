const assert = require('assert');
const {
  computeCertificatePrice,
  buildCryptoQuote,
  BASE_PRICE_USD,
  FLOOR_PRICE_USD,
  COUNTRY_PRICING,
} = require('../utils/ppp');

// --- Standard tier: never above the $49 base ---
const us = computeCertificatePrice('US');
assert.strictEqual(us.priceUSD, BASE_PRICE_USD, 'US pays the standard tier');
assert.strictEqual(us.currency, 'usd');
assert.strictEqual(us.tier, 'standard');
assert.strictEqual(us.discountPercent, 0);

// --- PPP discount for an emerging economy ---
const india = computeCertificatePrice('IN');
assert.ok(india.priceUSD < BASE_PRICE_USD, 'India gets a PPP discount');
assert.ok(india.priceUSD >= FLOOR_PRICE_USD && india.priceUSD <= 15, `India price ${india.priceUSD} inside the $10-15 band`);
assert.strictEqual(india.currency, 'inr');
assert.strictEqual(india.tier, 'emerging');
assert.ok(india.localAmount > india.priceUSD, 'INR local amount exceeds the USD price');
assert.ok(india.discountPercent > 50, 'India discount is substantial');

// --- Floor clamp: an extremely cheap economy never goes below the floor ---
const myanmar = computeCertificatePrice('MM');
assert.strictEqual(myanmar.priceUSD, FLOOR_PRICE_USD, 'floor clamps the price at $10');

// --- Medium tier ---
const poland = computeCertificatePrice('PL');
assert.strictEqual(poland.tier, 'medium');
assert.ok(poland.priceUSD < BASE_PRICE_USD && poland.priceUSD > FLOOR_PRICE_USD);

// --- Currency-code routing (accepts ISO 4217 too) ---
const byCurrency = computeCertificatePrice('brl');
assert.strictEqual(byCurrency.countryCode, 'BR');
assert.strictEqual(byCurrency.currency, 'brl');

// --- Unknown country falls back to the global-average medium tier ---
const unknown = computeCertificatePrice('ZZ');
assert.strictEqual(unknown.countryCode, 'XX');
assert.strictEqual(unknown.tier, 'medium');
assert.ok(unknown.priceUSD >= FLOOR_PRICE_USD && unknown.priceUSD < BASE_PRICE_USD);

// --- Case/whitespace tolerance + null safety ---
assert.strictEqual(computeCertificatePrice('  in ').countryCode, 'IN');
assert.strictEqual(computeCertificatePrice(null).countryCode, 'US');
assert.strictEqual(computeCertificatePrice(undefined).priceUSD, BASE_PRICE_USD);

// --- Localized minor units + formatting ---
assert.strictEqual(india.minorUnits, Math.round(india.localAmount * 100));
assert.ok(india.formattedLocal.includes('INR'));
assert.ok(india.formattedUSD.startsWith('$'));

// --- Every table entry is internally consistent ---
for (const [code, region] of Object.entries(COUNTRY_PRICING)) {
  assert.ok(region.multiplier > 0 && region.multiplier <= 1, `${code} multiplier in (0,1]`);
  assert.ok(region.rate > 0, `${code} rate positive`);
  assert.ok(/^[A-Z]{3}$/.test(region.currency), `${code} currency is ISO 4217`);
}

// --- Mock crypto quote ---
const crypto = buildCryptoQuote(india);
assert.strictEqual(crypto.cryptoCurrency, 'USDT');
assert.strictEqual(crypto.cryptoAmount, india.priceUSD);
assert.ok(crypto.address.startsWith('0x'));
assert.ok(crypto.qrPayload.includes(crypto.address));

console.log('✅ ppp.test.js — all assertions passed');

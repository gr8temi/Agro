const CURRENCY_SYMBOLS = {
  NGN: '₦',
  USD: '$',
  KES: 'KSh',
  GHS: 'GH₵',
  ZAR: 'R',
  GBP: '£',
  EUR: '€',
};

export function formatCurrency(amount, currencyCode) {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode || '';
  const num = Number(amount) || 0;
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getCurrencySymbol(currencyCode) {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode || '';
}

export function convertCurrency(amount, fromCurrency, toCurrency, rates) {
  if (!amount || fromCurrency === toCurrency) return Number(amount) || 0;
  if (!rates || rates.length === 0) return null;

  const num = Number(amount) || 0;

  const direct = rates.find(
    (r) => r.base_currency === fromCurrency && r.target_currency === toCurrency,
  );
  if (direct) return num * parseFloat(direct.rate);

  const reverse = rates.find(
    (r) => r.base_currency === toCurrency && r.target_currency === fromCurrency,
  );
  if (reverse) return num / parseFloat(reverse.rate);

  const fromToUsd = rates.find(
    (r) => r.base_currency === 'USD' && r.target_currency === fromCurrency,
  );
  const toFromUsd = rates.find(
    (r) => r.base_currency === 'USD' && r.target_currency === toCurrency,
  );
  if (fromToUsd && toFromUsd) {
    const usdAmount = num / parseFloat(fromToUsd.rate);
    return usdAmount * parseFloat(toFromUsd.rate);
  }

  return null;
}

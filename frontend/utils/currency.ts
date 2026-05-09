export function getCurrencyDigits(value: string | number) {
  return String(value).replace(/\D/g, '');
}

export function formatRupiahInput(value: string | number) {
  const digits = getCurrencyDigits(value).replace(/^0+(?=\d)/, '');

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

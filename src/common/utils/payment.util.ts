export function roundPayableTotal(total: number) {
  const pesos = Math.floor(total);
  const cents = Math.round((total - pesos) * 100);
  if (cents < 50) return pesos;
  if (cents === 50) return pesos + 0.5;
  return pesos + 1;
}

export function shouldRoundPaymentMethod(paymentMethod: string) {
  return paymentMethod === 'CASH' || paymentMethod === 'CARD';
}

export const PAYMENT_TYPE_LABELS = {
  CARD: 'Tarjeta',
  BANK_ACCOUNT: 'Cuenta bancaria',
  CLABE: 'CLABE',
  OTHER: 'Otro',
}

export const STATUS_LABELS = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
}

export function maskedIdentifier(lastFour) {
  if (!lastFour) {
    return '••••'
  }

  return `•••• ${lastFour}`
}

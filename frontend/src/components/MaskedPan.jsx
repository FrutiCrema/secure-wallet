import { maskedIdentifier } from '../pages/paymentLabels'

export function MaskedPan({ lastFour, className = 'masked' }) {
  return <p className={className}>{maskedIdentifier(lastFour)}</p>
}

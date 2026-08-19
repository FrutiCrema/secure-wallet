import { getFormAlertMessage } from '../errors'

export function ErrorMessage({ id, error, fieldErrors }) {
  const message = getFormAlertMessage(error, fieldErrors)

  if (!message) {
    return null
  }

  return (
    <p id={id} className="form-alert" role="alert">
      {message}
    </p>
  )
}

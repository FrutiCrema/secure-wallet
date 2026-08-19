import { AuthVisual } from './AuthVisual'

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth-layout">
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <p className="auth-logo">Secure Wallet</p>
          <h1>{title}</h1>
          {subtitle ? <p className="lead">{subtitle}</p> : null}
          {children}
        </div>
      </section>
      <AuthVisual />
    </div>
  )
}

export function AuthVisual() {
  return (
    <aside className="auth-visual" aria-hidden="true">
      <div className="auth-visual-glow" />
      <div className="auth-visual-orb auth-visual-orb-one" />
      <div className="auth-visual-orb auth-visual-orb-two" />

      <div className="auth-visual-stage">
        <article className="auth-plastic auth-plastic-back">
          <span>CLABE</span>
          <strong>•••• 8821</strong>
        </article>

        <article className="auth-plastic auth-plastic-front">
          <div className="auth-plastic-top">
            <span>Secure Wallet</span>
            <span className="auth-chip" />
          </div>
          <p className="auth-plastic-pan">•••• 4291</p>
          <div className="auth-plastic-bottom">
            <span>MXN</span>
            <span>Activa</span>
          </div>
        </article>
      </div>

      <div className="auth-visual-copy">
        <strong>Secure Wallet</strong>
        <p>Tu dinero, organizado.</p>
      </div>
    </aside>
  )
}

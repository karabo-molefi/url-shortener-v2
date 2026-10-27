import { useState } from 'react'

const TOKEN = import.meta.env.VITE_TINYURL_TOKEN
const LEGACY_ENDPOINT = '/tinyurl'  ? '/tinyurl'
  : 'https://tinyurl.com/api-create.php'

const SHRINK_MS = 700

const HELP_STEPS = [
  { title: 'Click on the textbox', body: 'Have your long link ready.' },
  { title: 'Enter or paste your link', body: 'Include https:// or http://.' },
  { title: 'Shorten, then copy', body: 'Your link is ready to share.' },
]

function isValidUrl(value) {
  try {
    const u = new URL(value.trim())
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.')
  } catch {
    return false
  }
}

async function shortenUrl(url) {
  if (TOKEN) {
    const res = await fetch('https://api.tinyurl.com/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ url }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.data?.tiny_url) throw new Error('TinyURL request failed')
    return data.data.tiny_url
  }
  const res = await fetch(`${LEGACY_ENDPOINT}?url=${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error('TinyURL request failed')
  const text = (await res.text()).trim()
  if (!text.startsWith('http')) throw new Error('Unexpected TinyURL response')
  return text
}

const Icon = {
  Chevron: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  Arrow: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Copy: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" />
    </svg>
  ),
  Reset: () => (
    <svg className="reset-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  ),
  Alert: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="m8 12.5 2.7 2.7L16 9.8" />
    </svg>
  ),
}

export default function App() {
  const [helpOpen, setHelpOpen] = useState(false)
  const [value, setValue] = useState('')
  // idle -> shrinking -> done
  const [phase, setPhase] = useState('idle')
  const [status, setStatus] = useState(null) // { type: 'error' | 'success', message }

  const isDone = phase === 'done'
  const isShrinking = phase === 'shrinking'

  const handleChange = (e) => {
    setValue(e.target.value)
    setStatus(null)
    if (phase !== 'idle') setPhase('idle')
  }

  const handleShorten = async () => {
    if (isShrinking) return
    if (!isValidUrl(value)) {
      setStatus({ type: 'error', message: 'Enter a valid URL, starting with https:// or http://.' })
      return
    }
    setStatus(null)
    setPhase('shrinking')
    try {
      const [short] = await Promise.all([
        shortenUrl(value.trim()),
        new Promise((r) => setTimeout(r, SHRINK_MS)),
      ])
      setValue(short)
      setPhase('done')
    } catch {
      setPhase('idle')
      setStatus({ type: 'error', message: "Couldn't shorten that link. Please try again." })
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Fallback for browsers/contexts without the async clipboard API
      const el = document.getElementById('url-input')
      el.select()
      document.execCommand('copy')
    }
    setStatus({ type: 'success', message: 'Link copied. Ready to share.' })
  }

  // Back to the original state of the app (also triggered by the logo)
  const handleReset = () => {
    setValue('')
    setStatus(null)
    setPhase('idle')
    document.getElementById('url-input')?.focus()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    isDone ? handleCopy() : handleShorten()
  }

  const stateClass = status?.type === 'error' ? 'is-error' : status?.type === 'success' ? 'is-success' : ''

  return (
    <div className="page">
      <header className="nav">
        <a
          className="logo"
          href="/"
          onClick={(e) => {
            e.preventDefault()
            handleReset()
          }}
        >
          URL-Shortener
        </a>
        <button
          type="button"
          className={`help-link ${helpOpen ? 'open' : ''}`}
          aria-expanded={helpOpen}
          aria-controls="help-section"
          onClick={() => setHelpOpen((o) => !o)}
        >
          <span>help</span>
          <span className="chev"><Icon.Chevron /></span>
        </button>
      </header>

      <main className="main">
        <section className="hero">
          <h1>Long link, made short.</h1>
          <p>A little less URL. A lot easier to share.</p>
        </section>

        <div className="stage">
          {helpOpen && (
            <section id="help-section" className="help" aria-label="How to use">
              {HELP_STEPS.map((s, i) => (
                <article className="help-card" key={s.title} style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="step-num">{i + 1}</span>
                  <h2>{s.title}</h2>
                  <p>{s.body}</p>
                </article>
              ))}
            </section>
          )}

          <form className="card" onSubmit={handleSubmit} noValidate>
            <label htmlFor="url-input" className="label">Enter or paste the link to shorten</label>

            <div className="row">
              <div className="input-line">
                <div className="field-slot">
                  <input
                    id="url-input"
                    className={`field ${stateClass} ${isShrinking ? 'shrinking' : ''}`}
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck="false"
                    placeholder="https://"
                    value={value}
                    onChange={handleChange}
                    aria-invalid={status?.type === 'error'}
                    aria-describedby="url-message"
                  />
                </div>

                <div className={`reset-wrap ${isDone ? 'show' : ''}`}>
                  <button
                    type="button"
                    className="reset-btn"
                    onClick={handleReset}
                    aria-label="Start over"
                    tabIndex={isDone ? 0 : -1}
                  >
                    <Icon.Reset />
                  </button>
                </div>
              </div>

              {isDone ? (
                <button key="copy" type="button" className="btn btn-swap" onClick={handleCopy}>
                  <span>copy</span>
                  <Icon.Copy />
                </button>
              ) : (
                <button key="shorten" type="submit" className="btn btn-swap" disabled={isShrinking}>
                  <span>{isShrinking ? 'shortening' : 'shorten'}</span>
                  <Icon.Arrow />
                </button>
              )}
            </div>

            <p
              id="url-message"
              className={`message ${status ? status.type : ''}`}
              role={status?.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
            >
              {status?.type === 'error' && <Icon.Alert />}
              {status?.type === 'success' && <Icon.Check />}
              <span>
                {status
                  ? status.message
                  : isDone
                  ? 'Your short link is ready.'
                  : 'Use a complete URL, including https:// or http://.'}
              </span>
            </p>
          </form>
        </div>
      </main>

      <footer className="footer">Shorten. Copy. Share.</footer>
    </div>
  )
}

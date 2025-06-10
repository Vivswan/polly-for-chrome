import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { useMount } from './hooks/useMount'
import { Modal } from './components/Modal'
import { Button } from './components/buttons/Button'
import { AlertTriangle, GitHub } from 'react-feather'


// Event listeners -------------------------------------------------------------
window.addEventListener('load', function () {
  console.log('load', ...arguments)

  const root = document.createElement('div')
  const shadowRoot = root.attachShadow({ mode: 'open' })

  // Fetch the CSS file and replace rem values with px values, this is needed
  // so tailwind styles don't inherit the font size from the page.
  fetch(chrome.runtime.getURL('public/styles.css'))
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.text()
    })
    .then((text) => {
      const parsedText = text.replace(/(\d*\.?\d+)rem/g, (match, group) => {
        const pxValue = parseFloat(group) * 16
        return `${pxValue}px`
      })

      const styleEl = document.createElement('style')
      styleEl.textContent = parsedText
      shadowRoot.appendChild(styleEl)

      document.body.appendChild(root)
      createRoot(shadowRoot).render(<ContentScript />)
    })
    .catch((error) => {
      console.error('Failed to load CSS: ', error)
    })
})

// React component -------------------------------------------------------------
function ContentScript() {
  const [error, setError] = React.useState(null)
  const handlers = { setError }

  function handleMessages(request) {
    console.log('Handling message...', ...arguments)

    if (!request) return
    const { id, payload } = request

    if (!handlers[id]) throw new Error(`No handler for ${id}`)

    handlers[id](payload)
  }

  useMount(function () {
    chrome.runtime.onMessage.addListener(handleMessages)

    return () => chrome.runtime.onMessage.removeListener(handleMessages)
  })

  return (
    <div>
      {error && (
        <Modal
          Icon={AlertTriangle}
          title={error.title}
          content={error.message}
          onClose={() => setError(null)}
          buttons={[
            <Button
              className="max-w-fit"
              key="close"
              onClick={() => setError(null)}
            >
              Close
            </Button>,
            <Button
              className="max-w-fit"
              type="primary"
              key="support"
              Icon={GitHub}
              onClick={() =>
                window.open(
                  `https://github.com/vivswan/polly-for-chrome/issues/new?title=${error.title}&body=${error.message}`
                )
              }
            >
              Create an issue
            </Button>
          ]}
        />
      )}
    </div>
  )
}

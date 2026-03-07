// This page runs in a visible tab to request camera/mic permissions.
// Once granted, it notifies the extension and closes itself.

const statusEl = document.getElementById('status')!

async function requestPermissions() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    stream.getTracks().forEach((t) => t.stop())
    statusEl.textContent = 'Access granted! Closing...'
    statusEl.className = 'status granted'
    // Notify the extension
    chrome.runtime.sendMessage({ type: 'PERMISSIONS_GRANTED' })
    // Close this tab after a short delay
    setTimeout(() => window.close(), 500)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    statusEl.textContent = `Access denied: ${msg}. Please try again.`
    statusEl.className = 'status denied'
    chrome.runtime.sendMessage({ type: 'PERMISSIONS_DENIED', error: msg })
  }
}

requestPermissions()

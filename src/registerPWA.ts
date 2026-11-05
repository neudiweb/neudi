import { Workbox } from 'workbox-window'

export function registerPWA (): void {
  if (import.meta.env.DEV) return

  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/neudi/service-worker.js')

    wb.register().then((registration) => {
      if (registration) {
        console.log('Neudi: Service Worker registrado', registration.scope)
      }

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Neudi: nueva versión activada — recargando...')
        window.location.reload()
      })
    }).catch((error) => {
      console.log('Neudi: Service Worker no registrado', error)
    })
  }
}

/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'gm-crypto' {
  export const SM3: {
    digest(input: string | Uint8Array): string
  }
}
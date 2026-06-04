declare module 'sm-crypto' {
  export function sm3(input: string | Uint8Array, options?: { mode?: 'hmac'; key?: string | Uint8Array }): string
}
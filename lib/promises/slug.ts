import { customAlphabet } from "nanoid"

const slugAlphabet = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 8)

export function createPromiseSlug() {
  return slugAlphabet()
}

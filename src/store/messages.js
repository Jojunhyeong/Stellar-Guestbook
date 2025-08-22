import { create } from "zustand"
import { randomPositionWithSpacing } from "../utils/space"

const STORAGE_KEY = "r3f_guestbook_messages"

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const save = (arr) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)) } catch {/*exapmple*/}
}

export const useMessagesStore = create((set, get) => ({
  messages: load(),
  add: ({ name, text }) => {
    const msg = {
      id: crypto.randomUUID(),
      name,
      text,
      pos: randomPositionWithSpacing(get().messages, 8, 2.5), // ✅ 최소거리 2.5
      createdAt: Date.now(),
    }
    const next = [msg, ...get().messages]
    set({ messages: next })
    save(next)
  },
}))

export const seedIfEmpty = () => {
  const cur = load()
  if (cur.length > 0) return
  const seeds = [
    { name: "Nova", text: "첫 방문 기념!" },
    { name: "Orion", text: "별 헤는 밤" },
    { name: "Luna", text: "안녕하세요 ✨" },
    { name: "Atlas", text: "우주 방명록 멋지다" },
  ].map((s) => ({
    id: crypto.randomUUID(),
    ...s,
    pos: randomPositionWithSpacing(cur, 8, 2.5), // 시드도 같은 규칙 적용
    createdAt: Date.now() - Math.floor(Math.random() * 1e6),
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds))
}

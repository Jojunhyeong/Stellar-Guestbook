// src/App.jsx
import { useEffect, useState } from "react"
import Scene from "./components/Scene"
import { useMessagesStore, seedIfEmpty } from "./store/messages"

export default function App() {
  const messages = useMessagesStore(s => s.messages)
  const addMessage = useMessagesStore(s => s.add)

  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [open, setOpen] = useState(true)

  useEffect(() => { seedIfEmpty() }, [])

  const onSubmit = (e) => {
    e.preventDefault()
    const n = (name || "").trim() || "익명"
    const t = (text || "").trim()
    if (!t) return
    addMessage({ name: n, text: t })
    setText("")
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <Scene />

      {/* 토글 버튼 (우상단) */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: "fixed",
          right: 16, top: 16, zIndex: 60,
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.25)",
          color: "#fff", padding: "8px 12px",
          borderRadius: 999, backdropFilter: "blur(8px)", cursor: "pointer"
        }}
      >
        {open ? "패널 닫기" : "메시지 남기기"}
      </button>

      {/* 버튼 바로 아래에 붙는 패널 (우상단 정렬) */}
      {open && (
        <aside
          style={{
            position: "fixed",
            right: 16,            // 버튼과 같은 right
            top: 60,              // 버튼(16) + 높이(~36) + 여백(8) ≈ 60
            zIndex: 50,
            width: "min(92vw, 420px)",
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.20)",
            borderRadius: 16,
            padding: 16,
            color: "#fff",
            backdropFilter: "blur(16px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
          }}
        >
          {/* 작은 꼬리(▲)로 버튼과 연결된 느낌 */}
          <div
            style={{
              position: "absolute",
              top: -8, right: 24,
              width: 0, height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderBottom: "8px solid rgba(255,255,255,0.20)",
              filter: "drop-shadow(0 2px 2px rgba(0,0,0,.2))"
            }}
          />

          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>3D Guestbook</h1>
          <p style={{ margin: "6px 0 12px", opacity: 0.85, fontSize: 12 }}>
            달에서 우주 바라보며 메시지 남기기
          </p>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="이름 (선택)"
              style={{
                fontSize: 14,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.20)",
                color: "#fff", padding: "10px 12px",
                borderRadius: 12, outline: "none"
              }}
            />
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="메시지를 남겨보세요 (더블클릭으로 삭제)"
              rows={3}
              style={{
                fontSize: 14,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.20)",
                color: "#fff", padding: "10px 12px",
                borderRadius: 12, outline: "none", resize: "vertical"
              }}
            />
            <button
              style={{
                fontSize: 14, fontWeight: 600,
                background: "#4f46e5", color: "#fff",
                padding: "10px 12px", borderRadius: 12,
                border: "none", cursor: "pointer"
              }}
            >
              남기기
            </button>
          </form>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            현재 별: <b style={{ color: "#fff" }}>{messages.length}</b> · 드래그/휠 · 더블클릭 삭제
          </div>
        </aside>
      )}
    </div>
  )
}

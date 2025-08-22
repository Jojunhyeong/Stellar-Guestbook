// src/components/FloatingMessage.jsx
import { useRef } from "react"
import { Text, Billboard } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMessagesStore } from "../store/messages"

export default function FloatingMessage({ id, position = [0, 0, 0], name, text }) {
  const group = useRef()
  const remove = useMessagesStore((s) => s.remove)

  // 둥둥 떠다니는 효과만 (간단)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (group.current) {
      const amp = 0.15
      group.current.position.y = position[1] + Math.sin(t + position[0]) * amp
      group.current.position.x = position[0] + Math.cos(t * 0.6 + position[2]) * 0.05
      group.current.position.z = position[2] + Math.sin(t * 0.4 + position[1]) * 0.05
    }
  })

  return (
    <group ref={group} position={position}>
      <Billboard follow>
        {/* 메시지 본문 */}
        <Text
          fontSize={0.6}
          maxWidth={5}
          lineHeight={1.2}
          anchorX="center"
          anchorY="middle"
          color="#ffffff"
          onDoubleClick={(e) => { e.stopPropagation(); remove(id) }} // 더블클릭 삭제
        >
          {text}
        </Text>

        {/* 작성자 이름 (아래 작게) */}
        <Text
          fontSize={0.3}
          position={[0, -0.5, 0]}
          color="#ffcc66"
          anchorX="center"
          anchorY="top"
        >
          {name}
        </Text>
      </Billboard>
    </group>
  )
}

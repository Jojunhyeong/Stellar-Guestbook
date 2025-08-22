// src/components/Scene.jsx
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stars, Environment } from "@react-three/drei"
import { useMessagesStore } from "../store/messages"
import FloatingMessage from "./FloatingMessage"
import { useMemo, useRef, useEffect, useState } from "react"
import * as THREE from "three"

/** 안전 텍스처 로더: 있으면 로드, 없으면 null (크래시 방지) */
function useMoonTextures() {
  const [maps, setMaps] = useState({
    color: null, normal: null, rough: null, ao: null, disp: null,
  })

  useEffect(() => {
    const base = (import.meta.env.BASE_URL || "/") + "textures/moon"
    const loader = new THREE.TextureLoader()

    const loadOne = (p) =>
      new Promise((resolve) => {
        loader.load(p, (tex) => resolve(tex), undefined, () => resolve(null))
      })

    const loadFirstExisting = async (cands) => {
      for (const p of cands) {
        const t = await loadOne(p)
        if (t) return t
      }
      return null
    }

    ;(async () => {
      const color = await loadFirstExisting([
        `${base}/albedo.jpg`,
        `${base}/albedo.jpeg`,
        `${base}/moon_2k.jpg`,
        `${base}/moon.jpg`,
        `${base}/color.jpg`,
      ])
      const normal = await loadFirstExisting([
        `${base}/normal.jpg`,
        `${base}/normal.png`,
        `${base}/moon_normal.jpg`,
        `${base}/2k_moon_normal.jpg`,
      ])
      const rough = await loadFirstExisting([
        `${base}/roughness.jpg`,
        `${base}/roughness.png`,
      ])
      const ao = await loadFirstExisting([`${base}/ao.jpg`, `${base}/ao.png`])
      const disp = await loadFirstExisting([
        `${base}/displacement.png`,
        `${base}/displacement.jpg`,
        `${base}/moon_bump.jpg`,
        `${base}/2k_moon_bump.jpg`,
      ])

      // 공통 세팅 (알베도 sRGB + 타일링)
      const repeat = 6
      ;[color, normal, rough, ao, disp].forEach((t) => {
        if (!t) return
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(repeat, repeat)
        t.anisotropy = 8
      })
      if (color) color.colorSpace = THREE.SRGBColorSpace

      setMaps({ color, normal, rough, ao, disp })
      console.log("[moon textures loaded]", {
        color: !!color, normal: !!normal, rough: !!rough, ao: !!ao, disp: !!disp
      })
    })()
  }, [])

  return maps
}

/** 절차적 크레이터 + (선택) 텍스처 하이브리드 달 표면 */
function LunarSurface({
  width = 260, height = 260, segments = 256,
  y = -2, seed = 1337, craterCount = 120,
}) {
  const materialRef = useRef()
  const { color, normal, rough, ao, disp } = useMoonTextures()

  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(width, height, segments, segments)
    geom.rotateX(-Math.PI / 2)

    // 시드 난수
    let s = seed
    const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)

    // 크레이터들
    const craters = Array.from({ length: craterCount }).map(() => {
      const cx = (rand() - 0.5) * (width * 0.9)
      const cz = (rand() - 0.5) * (height * 0.9)
      const r = 0.5 + rand() * 3.0
      const depth = 0.12 + rand() * 0.55
      const rim = 0.12 + rand() * 0.28
      return { cx, cz, r, depth, rim }
    })

    const pos = geom.getAttribute("position")
    const v3 = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i)
      const x = v3.x, z = v3.z

      // 기본 기복
      let dY =
        0.07 * Math.sin(x * 0.05) * Math.cos(z * 0.05) +
        0.05 * Math.sin((x + z) * 0.08)

      // 크레이터 합성
      for (const c of craters) {
        const dx = x - c.cx, dz = z - c.cz
        const dist = Math.hypot(dx, dz)
        if (dist < c.r * 1.6) {
          const sigma = c.r * 0.55
          dY += -c.depth * Math.exp(-(dist * dist) / (2 * sigma * sigma))
          const rimInner = c.r * (1.0 - c.rim)
          const rimOuter = c.r * (1.0 + c.rim)
          if (dist > rimInner && dist < rimOuter) {
            const t = (dist - rimInner) / (rimOuter - rimInner)
            dY += (Math.sin(t * Math.PI) ** 2) * (c.depth * 0.33)
          }
        }
      }
      pos.setY(i, y + dY)
    }

    // aoMap용 uv2
    const uv = geom.getAttribute("uv")
    geom.setAttribute("uv2", new THREE.BufferAttribute(uv.array.slice(), 2))
    geom.computeVertexNormals()
    return geom
  }, [width, height, segments, y, seed, craterCount])

  // 텍스처가 준비되면 머티리얼에 반영
  useEffect(() => {
    if (!materialRef.current) return
    const m = materialRef.current
    m.map = color || null
    m.normalMap = normal || null
    m.roughnessMap = rough || null
    m.aoMap = ao || null
    m.displacementMap = disp || null
    if (normal) m.normalScale = new THREE.Vector2(0.7, 0.7)
    if (disp) m.displacementScale = 0.06
    m.roughness = 0.95
    m.metalness = 0.03
    m.needsUpdate = true
  }, [color, normal, rough, ao, disp])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        ref={materialRef}
        color="#9d9d9d"   // 텍스처 없으면 기본 달 회색
        roughness={0.95}
        metalness={0.03}
      />
    </mesh>
  )
}

export default function Scene() {
  const messages = useMessagesStore((s) => s.messages)

  // 🔼 텍스트를 더 하늘로: 렌더링 시 Y 보정
  const SKY_MULT = 1.8  // 기존보다 강하게 올림 (1.4~2.0 권장)
  const SKY_BASE = 1.4  // 기본 오프셋 (기존 0.8 → 1.4)

  return (
    <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 5, 22], fov: 55 }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%", display: "block", background: "#000" }}
        shadows
      >
        
        {/* 지평선 안개 + 조명 */}
        <fog attach="fog" args={["#000000", 28, 120]} />
        <ambientLight intensity={0.23} />
        <directionalLight
          position={[20, 20, 10]}
          intensity={2.0}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <hemisphereLight args={["#b8b8b8", "#1a1a1a", 0.35]} />

        {/* 상공의 별 + 환경광 */}
        <Stars radius={150} depth={120} count={7000} factor={4} fade />
        <Environment preset="sunset" />

        {/* 달 표면 */}
        <LunarSurface y={-2} width={260} height={260} segments={256} seed={1337} craterCount={120} />

        {/* 떠다니는 메시지들 (지면 위로 보정) */}
{messages.map((m) => {
  const y = Math.abs(m.pos[1]) * SKY_MULT + SKY_BASE
  return (
    <FloatingMessage
      key={m.id}
      id={m.id}
      position={[m.pos[0], y, m.pos[2]]}
      name={m.name}
      text={m.text}
    />
  )
})}


        {/* 카메라 컨트롤 */}
        <OrbitControls
  enablePan={false}
  target={[0, 0, 0]}
  minPolarAngle={0}                 // ⬅️ 위로 끝까지 올려도 됨 (기존 0.12 → 0)
  maxPolarAngle={Math.PI - 0.001}   // ⬅️ 아래도 거의 제한 없음
  minDistance={7}
  maxDistance={42}
/>

      </Canvas>
    </div>
  )
}

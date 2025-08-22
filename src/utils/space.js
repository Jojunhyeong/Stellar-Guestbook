// 기존 랜덤 함수
export function randomPositionInSphere(radius = 8) {
  let u = Math.random()
  let v = Math.random()
  let theta = 2 * Math.PI * u
  let phi = Math.acos(2 * v - 1)
  let r = Math.cbrt(Math.random()) * radius
  let sinPhi = Math.sin(phi)
  return [
    r * sinPhi * Math.cos(theta),
    r * Math.cos(phi),
    r * sinPhi * Math.sin(theta),
  ]
}

// ✅ 최소 거리 보장 버전
export function randomPositionWithSpacing(messages, radius = 8, minDist = 2.5) {
  let tries = 0
  while (tries < 50) { // 최대 50번 시도
    const p = randomPositionInSphere(radius)
    let ok = true
    for (const m of messages) {
      const dx = p[0] - m.pos[0]
      const dy = p[1] - m.pos[1]
      const dz = p[2] - m.pos[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < minDist) {
        ok = false
        break
      }
    }
    if (ok) return p
    tries++
  }
  // 50번 안에 실패하면 그냥 랜덤값 리턴
  return randomPositionInSphere(radius)
}

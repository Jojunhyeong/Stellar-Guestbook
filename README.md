# Lunar Guestbook (달 방명록)

달 표면에서 밤하늘을 올려다보면, 방문자들의 메시지가 **별처럼** 3D 공간에 떠다닙니다.  
React + React Three Fiber(R3F)로 만든 인터랙티브 방명록입니다.

---

## ✨ 특징

- **달 표면**: 크레이터가 있는 절차적 지형 + 텍스처(옵션)
- **메시지**: 3D 공간에 텍스트로 부유, 더블클릭으로 삭제
- **간격 보장**: 새 메시지는 기존 메시지와 **최소 거리** 유지(겹침 방지)
- **카메라**: 마우스로 회전/줌 (`OrbitControls`)
- **로컬 저장**: `localStorage`에 메시지 저장 (새로고침해도 유지)
- **가벼운 상태관리**: Zustand

---

## 🚀 빠른 시작

### 요구 사항
- **Node.js**: `^20.19.0` **또는** `>=22.12.0` 권장  
  (Vite 7, 일부 플러그인에서 엔진 체크가 엄격합니다)

### 설치 & 실행

```bash
# 패키지 설치
npm install

# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

## 🗂 폴더 구조
project-root
├─ public/
│  └─ textures/
│     └─ moon/
│        ├─ albedo.jpg            # 알베도(컬러) - 파일명 이대로 추천
│        ├─ normal.jpg|png        # 선택
│        ├─ roughness.jpg|png     # 선택
│        ├─ ao.jpg|png            # 선택
│        └─ displacement.jpg|png  # 선택
├─ src/
│  ├─ components/
│  │  ├─ Scene.jsx                # 3D 씬 (달/조명/카메라/별/메시지 배치)
│  │  └─ FloatingMessage.jsx      # 메시지(텍스트) 컴포넌트
│  ├─ store/
│  │  └─ messages.js              # Zustand 저장소 (추가/삭제/시드)
│  ├─ utils/
│  │  └─ space.js                 # 위치 생성 유틸(최소 거리 보장 등)
│  ├─ App.jsx                     # UI 패널 + Scene
│  └─ main.jsx
└─ index.html
```
- 텍스처는 public/textures/moon/에 넣으면 런타임 경로가 /textures/moon/albedo.jpg가 됩니다.
- 브라우저에서 http://localhost:5173/textures/moon/albedo.jpg로 열어지면 OK.


## 🧩 핵심 파일 설명
```js
src/components/Scene.jsx

달 지형(PlaneGeometry) + 크레이터 노이즈

텍스처가 있으면 자동 로드(없어도 회색 지형으로 동작)

메시지 Y 보정값으로 “하늘 쪽”에 띄움

자주 만지는 파라미터

// 텍스트 높이 보정 (너무 높으면 낮추세요)
const SKY_MULT = 1.2;   // 기본 1.0~1.4 범위 권장
const SKY_BASE = 0.8;   // 기본 0.6~1.0 범위 권장
// (원한다면 MAX_Y 캡을 걸어 화면 밖 방지도 가능)


지형 크기/해상도

<LunarSurface width={600} height={600} segments={384} />


카메라 컨트롤

<OrbitControls
  enablePan={false}
  target={[0, 0.8, 0]}  // 시선 중심을 살짝 위로
  minPolarAngle={0}
  maxPolarAngle={Math.PI / 2.1}
  minDistance={10}      // 기본 시점 더 멀게
  maxDistance={50}
/>


기본 카메라 거리

<Canvas camera={{ position: [0, 5, 22], fov: 55 }} />

src/components/FloatingMessage.jsx

텍스트만 표시(halo/반짝임 없음), 부드럽게 부유 애니메이션

텍스트 더블클릭 → 해당 메시지 삭제

src/store/messages.js

messages: 현재 메시지 배열

add({name, text}): 메시지 추가

remove(id): 삭제

seedIfEmpty(): 초기 더미 데이터 주입(첫 실행 시)

src/utils/space.js

randomPositionInSphere(radius)

randomPositionWithSpacing(messages, radius, minDist)
→ 최소거리 보장으로 겹침 방지 (기본 minDist: 2.5)

원하면 메시지가 항상 “위쪽 하늘”에만 생성되도록

export function randomPositionAboveGround(radius = 8, minY = 1.0, maxY = 4.8) {
  const p = randomPositionInSphere(radius)
  const y = Math.min(Math.abs(p[1]) + minY, maxY)
  return [p[0], y, p[2]]
}


를 만들고 store/messages.js의 add에서 사용하면 됩니다.
```

## 🧪 조작법

- 마우스 드래그: 회전

- 휠: 줌 인/아웃

- 더블클릭(메시지): 삭제

## 🛠 커스터마이징 팁

- 메시지 간격: randomPositionWithSpacing(..., minDist) 값을 3.0~4.0으로 올리면 더 널찍

- 지면 톤: LunarSurface의 meshStandardMaterial 색/러프니스 조정

- 별 필드: <Stars radius depth count factor /> 값으로 밀도/밝기 조정

- 텍스처 타일링: useMoonTextures()에서 t.repeat.set(repeat, repeat) 값

## 🧰 트러블슈팅

텍스처가 안 뜰 때

- 경로 확인: /textures/moon/albedo.jpg 브라우저에서 열리는지 확인

- 파일명 대소문자 주의 (macOS에서는 관대하지만 배포 환경은 아닐 수 있음)

- Vite BASE_URL 커스텀 시 public 경로 달라질 수 있음

엔진 경고(EBADENGINE)

- Node를 **20.19+ 또는 22.12+**로 맞추세요 (권장: 최신 LTS)

끝단이 보일 때

- LunarSurface 크기 키우기, fog 강하게, maxPolarAngle 살짝 줄이기

## 🙏 Thanks

- NASA LRO Moon Textures

- three.js, @react-three/fiber, @react-three/drei

- Zustand

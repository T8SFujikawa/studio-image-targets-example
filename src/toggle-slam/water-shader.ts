import * as ecs from '@8thwall/ecs'

const {THREE} = window as any

ecs.registerComponent({
  name: 'water-shader',
  schema: {},
  schemaDefaults: {},
  add: (world, component) => {
    setTimeout(() => {
      const mesh = world.three.entityToObject.get(component.eid)
      if (!mesh) return

      // 頂点は動かさない、通常のパススルー
      const vertexShader = `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `

      const fragmentShader = `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform float uTime;

        // ノイズっぽい流線パターン(FBM風)
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 4; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }

        void main() {
          vec3 viewDir = normalize(vViewPosition);
          vec3 normal = normalize(vNormal);
          float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.0);

          // 時間で流れる筋模様(2方向に歪ませて重ねる)
          vec2 uv = vUv * 2.5;
          vec2 flow1 = uv + vec2(uTime * 0.05, uTime * 0.03);
          vec2 flow2 = uv * 1.3 - vec2(uTime * 0.04, uTime * 0.06);

          float n1 = fbm(flow1 + fbm(flow1 * 1.5));
          float n2 = fbm(flow2 + fbm(flow2 * 1.8));
          float streaks = fbm(vec2(n1, n2) * 3.0);

          // 筋を強調(細く光る線にする)
          float lines = smoothstep(0.45, 0.55, streaks) - smoothstep(0.55, 0.65, streaks);
          lines = clamp(lines * 1.5, 0.0, 1.0);

          // ベースはすりガラス風の淡い色
          vec3 baseColor = vec3(0.85, 0.83, 0.95);
          vec3 streakColor = vec3(1.0, 1.0, 1.0);

          vec3 color = mix(baseColor, streakColor, lines * 0.8 + streaks * 0.15);

          // フレネルで縁を柔らかく明るく(すりガラスのエッジ感)
          color = mix(color, streakColor, fresnel * 0.3);

          // 透明度:すりガラスなので中間くらい、筋の部分はやや不透明
          float alpha = mix(0.35, 0.6, streaks) + lines * 0.2 + fresnel * 0.15;
          alpha = clamp(alpha, 0.0, 0.85);

          gl_FragColor = vec4(color, alpha);
        }
      `

      mesh.traverse((child: any) => {
        if (child.isMesh) {
          child.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: { uTime: { value: 0 } },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        }
      })
    }, 2000)
  },
  tick: (world, component) => {
    const mesh = world.three.entityToObject.get(component.eid)
    if (!mesh) return
    mesh.traverse((child: any) => {
      if (child.isMesh && child.material?.uniforms?.uTime) {
        child.material.uniforms.uTime.value = world.time.elapsed / 1000
      }
    })
  },
})
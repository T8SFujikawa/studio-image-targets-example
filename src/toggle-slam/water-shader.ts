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

      const vertexShader = `
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.z += sin(pos.x * 3.0 + uTime) * 0.02;
          pos.z += sin(pos.y * 2.0 + uTime * 0.8) * 0.02;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `
      const fragmentShader = `
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          float wave1 = sin(vUv.x * 10.0 + uTime * 1.5) * 0.5 + 0.5;
          float wave2 = sin(vUv.y * 8.0 + uTime * 1.2) * 0.5 + 0.5;
          float wave = (wave1 + wave2) * 0.5;
          vec3 deepColor = vec3(0.0, 0.2, 0.6);
          vec3 shallowColor = vec3(0.2, 0.6, 0.9);
          vec3 color = mix(deepColor, shallowColor, wave);
          gl_FragColor = vec4(color, 0.75);
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
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export class SceneManager {
  constructor() {
    this.scene = null
    this.camera = null
    this.renderer = null
  }

  init(container) {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = false // disabled for performance
    container.appendChild(this.renderer.domElement)

    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x222222)

    // Camera — start overhead; Game.js drives position each frame
    const aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.02, 100)
    this.camera.position.set(0, 2.5, 0.5)
    this.camera.lookAt(0, 0, 0)

    // Lighting
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(0, 4, 2)
    this.scene.add(dirLight)

    // Environment map for ball reflections (no external HDR needed)
    const pmremGen = new THREE.PMREMGenerator(this.renderer)
    const roomEnv = new RoomEnvironment()
    this.scene.environment = pmremGen.fromScene(roomEnv, 0.04).texture
    roomEnv.dispose()
    pmremGen.dispose()

    // Resize handling
    window.addEventListener('resize', () => this._onResize())
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  startLoop(updateCallback) {
    this.renderer.setAnimationLoop((time) => {
      updateCallback(time)
      this.renderer.render(this.scene, this.camera)
    })
  }

  stopLoop() {
    this.renderer.setAnimationLoop(null)
  }

  add(object) { this.scene.add(object) }
  remove(object) { this.scene.remove(object) }
}

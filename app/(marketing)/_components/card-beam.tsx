'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getAllThemes } from '@/lib/themes/config'
import type { ThemeConfig } from '@/lib/themes/types'

const codeChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789(){}[]<>;:,._-+=!@#$%^&*|\\/\"'`~?"

interface CardBeamProps {
  showCredit?: boolean
}

export function CardBeam({ showCredit = true }: CardBeamProps) {
  const [direction] = useState(-1)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const cardLineRef = useRef<HTMLDivElement>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)
  const scannerCanvasRef = useRef<HTMLCanvasElement>(null)
  
  const positionRef = useRef(0)
  const velocityRef = useRef(200)
  const isDraggingRef = useRef(false)
  const lastMouseXRef = useRef(0)
  const mouseVelocityRef = useRef(0)
  const lastTimeRef = useRef(0)
  const containerWidthRef = useRef(0)
  const cardLineWidthRef = useRef(0)
  
  const particleSystemRef = useRef<any>(null)
  const scannerSystemRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)

  const generateCode = useCallback((width: number, height: number): string => {
    const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    const pick = (arr: string[]) => arr[randInt(0, arr.length - 1)]

    const header = [
      "// compiled preview • scanner demo",
      "/* generated for visual effect – not executed */",
      "const SCAN_WIDTH = 8;",
      "const FADE_ZONE = 35;",
      "const MAX_PARTICLES = 2500;",
      "const TRANSITION = 0.05;",
    ]

    const helpers = [
      "function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }",
      "function lerp(a, b, t) { return a + (b - a) * t; }",
      "const now = () => performance.now();",
      "function rng(min, max) { return Math.random() * (max - min) + min; }",
    ]

    const particleBlock = (idx: number) => [
      `class Particle${idx} {`,
      "  constructor(x, y, vx, vy, r, a) {",
      "    this.x = x; this.y = y;",
      "    this.vx = vx; this.vy = vy;",
      "    this.r = r; this.a = a;",
      "  }",
      "  step(dt) { this.x += this.vx * dt; this.y += this.vy * dt; }",
      "}",
    ]

    const scannerBlock = [
      "const scanner = {",
      "  x: Math.floor(window.innerWidth / 2),",
      "  width: SCAN_WIDTH,",
      "  glow: 3.5,",
      "};",
      "",
      "function drawParticle(ctx, p) {",
      "  ctx.globalAlpha = clamp(p.a, 0, 1);",
      "  ctx.drawImage(gradient, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);",
      "}",
    ]

    const loopBlock = [
      "function tick(t) {",
      "  // requestAnimationFrame(tick);",
      "  const dt = 0.016;",
      "  // update & render",
      "}",
    ]

    const misc = [
      "const state = { intensity: 1.2, particles: MAX_PARTICLES };",
      "const bounds = { w: window.innerWidth, h: 300 };",
      "const gradient = document.createElement('canvas');",
      "const ctx = gradient.getContext('2d');",
      "ctx.globalCompositeOperation = 'lighter';",
      "// ascii overlay is masked with a 3-phase gradient",
    ]

    const library: string[] = []
    header.forEach((l) => library.push(l))
    helpers.forEach((l) => library.push(l))
    for (let b = 0; b < 3; b++) {
      particleBlock(b).forEach((l) => library.push(l))
    }
    scannerBlock.forEach((l) => library.push(l))
    loopBlock.forEach((l) => library.push(l))
    misc.forEach((l) => library.push(l))

    for (let i = 0; i < 40; i++) {
      const n1 = randInt(1, 9)
      const n2 = randInt(10, 99)
      library.push(`const v${i} = (${n1} + ${n2}) * 0.${randInt(1, 9)};`)
    }
    for (let i = 0; i < 20; i++) {
      library.push(`if (state.intensity > ${1 + (i % 3)}) { scanner.glow += 0.01; }`)
    }

    let flow = library.join(" ")
    flow = flow.replace(/\s+/g, " ").trim()
    const totalChars = width * height
    
    // Ensure we have enough characters to fill the entire card width
    while (flow.length < totalChars + width) {
      const extra = pick(library).replace(/\s+/g, " ").trim()
      flow += " " + extra
    }

    let out = ""
    let offset = 0
    for (let row = 0; row < height; row++) {
      let line = flow.slice(offset, offset + width)
      // Ensure each line is exactly the right width, padding with spaces if needed
      // This guarantees all lines have the same width, forming a perfect rectangle
      if (line.length < width) {
        line = line + " ".repeat(width - line.length)
      } else if (line.length > width) {
        line = line.slice(0, width)
      }
      // Double-check: force exact width
      line = line.padEnd(width, " ").slice(0, width)
      out += line + (row < height - 1 ? "\n" : "")
      offset += width
    }
    return out
  }, [])

  const calculateCodeDimensions = useCallback((cardWidth: number, cardHeight: number) => {
    const fontSize = 11
    const lineHeight = 13
    // Use standard monospace character width at 11px font size
    const charWidth = 6.6
    // Calculate number of characters per line - all lines will have exactly this width
    const width = Math.floor(cardWidth / charWidth)
    const height = Math.floor(cardHeight / lineHeight)
    return { width, height, fontSize, lineHeight }
  }, [])

  // Helper function to convert color to rgba with opacity
  const colorToRgba = useCallback((color: string, opacity: number = 1): string => {
    // If it's already rgba/rgb, extract and modify
    if (color.startsWith('rgba') || color.startsWith('rgb')) {
      const match = color.match(/(\d+\.?\d*)/g)
      if (match && match.length >= 3) {
        return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${opacity})`
      }
    }
    // If it's hex, convert to rgba
    if (color.startsWith('#')) {
      const hex = color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    // For oklch or other formats, use a simple overlay approach
    // We'll use the accent color with low opacity as fallback
    return `rgba(0, 0, 0, ${opacity * 0.1})`
  }, [])

  const createThemeCard = useCallback((theme: ThemeConfig) => {
    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 250
    const ctx = canvas.getContext("2d")
    if (!ctx) return canvas.toDataURL()

    // Get border radius from theme
    const borderRadius = parseFloat(theme.layout.borderRadius.lg) || 15

    // Draw background
    ctx.fillStyle = theme.colors.background
    ctx.fillRect(0, 0, 400, 250)

    // Draw gradient overlay for visual interest using rgba with opacity
    const gradient = ctx.createLinearGradient(0, 0, 400, 250)
    // Use a subtle overlay instead of trying to parse oklch colors
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.05)')
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 400, 250)

    // Draw border
    ctx.strokeStyle = theme.colors.border
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, 398, 248)

    // Draw theme name
    ctx.fillStyle = theme.colors.foreground
    ctx.font = `bold 24px ${theme.typography.fontFamily.heading}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(theme.displayName, 200, 80)

    // Draw description with reduced opacity
    // Use globalAlpha for opacity since we can't easily modify oklch colors
    ctx.save()
    ctx.globalAlpha = 0.7
    ctx.fillStyle = theme.colors.foreground
    ctx.font = `14px ${theme.typography.fontFamily.body}`
    ctx.fillText(theme.description, 200, 110)
    ctx.restore()

    // Draw accent elements
    ctx.fillStyle = theme.colors.accent
    ctx.fillRect(50, 150, 300, 4)
    
    // Draw button preview
    const buttonY = 180
    const buttonWidth = 120
    const buttonHeight = 40
    const buttonX = (400 - buttonWidth) / 2
    
    ctx.fillStyle = theme.colors.buttonBg
    const buttonRadius = parseFloat(theme.layout.borderRadius.md) || 8
    
    // Draw rounded rectangle for button
    if ((ctx as any).roundRect) {
      ctx.beginPath()
      ;(ctx as any).roundRect(buttonX, buttonY, buttonWidth, buttonHeight, buttonRadius)
      ctx.fill()
    } else {
      // Fallback for browsers without roundRect
      ctx.beginPath()
      ctx.moveTo(buttonX + buttonRadius, buttonY)
      ctx.lineTo(buttonX + buttonWidth - buttonRadius, buttonY)
      ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY, buttonX + buttonWidth, buttonY + buttonRadius)
      ctx.lineTo(buttonX + buttonWidth, buttonY + buttonHeight - buttonRadius)
      ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY + buttonHeight, buttonX + buttonWidth - buttonRadius, buttonY + buttonHeight)
      ctx.lineTo(buttonX + buttonRadius, buttonY + buttonHeight)
      ctx.quadraticCurveTo(buttonX, buttonY + buttonHeight, buttonX, buttonY + buttonHeight - buttonRadius)
      ctx.lineTo(buttonX, buttonY + buttonRadius)
      ctx.quadraticCurveTo(buttonX, buttonY, buttonX + buttonRadius, buttonY)
      ctx.closePath()
      ctx.fill()
    }
    
    ctx.fillStyle = theme.colors.buttonText
    ctx.font = `600 14px ${theme.typography.fontFamily.body}`
    ctx.fillText('Join Waitlist', 200, buttonY + buttonHeight / 2)

    return canvas.toDataURL()
  }, [])

  const createCardWrapper = useCallback((index: number) => {
    const wrapper = document.createElement("div")
    wrapper.className = "relative w-[400px] h-[250px] shrink-0"

    const normalCard = document.createElement("div")
    normalCard.className = "card-normal absolute top-0 left-0 w-[400px] h-[250px] ] overflow-hidden"

    // Get all themes and cycle through them
    const allThemes = getAllThemes()
    const theme = allThemes[index % allThemes.length]
    
    const cardImage = document.createElement("img")
    cardImage.className = "w-full h-full object-cover transition-all duration-300 brightness-110 contrast-110 hover:brightness-125 hover:contrast-125"
    cardImage.src = createThemeCard(theme)
    cardImage.alt = `${theme.displayName} Theme`

    normalCard.appendChild(cardImage)

    const asciiCard = document.createElement("div")
    asciiCard.className = "card-ascii absolute top-0 left-0 w-[400px] h-[250px] overflow-hidden bg-transparent z-[1]"

    const asciiContent = document.createElement("div")
    asciiContent.className = "absolute top-0 left-0 w-full h-full text-[rgba(220,210,255,0.6)] font-mono text-[11px] leading-[13px] overflow-hidden whitespace-pre"
    
    const { width, height, fontSize, lineHeight } = calculateCodeDimensions(400, 250)
    asciiContent.style.fontSize = `${fontSize}px`
    asciiContent.style.lineHeight = `${lineHeight}px`
    asciiContent.style.width = "100%"
    asciiContent.style.boxSizing = "border-box"
    asciiContent.style.padding = "0"
    asciiContent.style.margin = "0"
    
    // Calculate letter-spacing to make text fill exactly 400px width
    // For monospace font at 11px, typical character width is around 6.6px
    const cardWidthPx = 400
    const baseCharWidth = 6.6
    const totalBaseWidth = width * baseCharWidth
    const spacingNeeded = width > 1 ? (cardWidthPx - totalBaseWidth) / (width - 1) : 0
    
    asciiContent.style.letterSpacing = `${spacingNeeded}px`
    asciiContent.style.textAlign = "left"
    asciiContent.style.whiteSpace = "pre"
    asciiContent.style.wordSpacing = "0"
    
    // Generate code with exact width for each line
    const codeText = generateCode(width, height)
    asciiContent.textContent = codeText

    asciiCard.appendChild(asciiContent)
    wrapper.appendChild(normalCard)
    wrapper.appendChild(asciiCard)

    return wrapper
  }, [generateCode, calculateCodeDimensions])

  const calculateDimensions = useCallback(() => {
    if (!containerRef.current || !cardLineRef.current) return
    containerWidthRef.current = containerRef.current.offsetWidth
    const cardWidth = 400
    const cardGap = 60
    const cardCount = cardLineRef.current.children.length
    cardLineWidthRef.current = (cardWidth + cardGap) * cardCount
  }, [])

  const updateCardClipping = useCallback(() => {
    if (!cardLineRef.current) return
    
    const scannerX = window.innerWidth / 2
    const scannerWidth = 8
    const scannerLeft = scannerX - scannerWidth / 2
    const scannerRight = scannerX + scannerWidth / 2
    let anyScanningActive = false

    const wrappers = cardLineRef.current.querySelectorAll<HTMLElement>(".card-wrapper")
    wrappers.forEach((wrapper) => {
      const rect = wrapper.getBoundingClientRect()
      const cardLeft = rect.left
      const cardRight = rect.right
      const cardWidth = rect.width

      const normalCard = wrapper.querySelector<HTMLElement>(".card-normal")
      const asciiCard = wrapper.querySelector<HTMLElement>(".card-ascii")

      if (normalCard && asciiCard) {
        // Cards move from RIGHT to LEFT (direction = -1)
        // Scanner is at the center (window.innerWidth / 2)
        
        // Card is passing through the scanner line
        if (cardLeft < scannerRight && cardRight > scannerLeft) {
          anyScanningActive = true
          const scannerIntersectLeft = Math.max(scannerLeft - cardLeft, 0)
          const scannerIntersectRight = Math.min(scannerRight - cardLeft, cardWidth)
          
          // Calculate how much of the card has been scanned (0 to 1)
          // As the card moves from right to left, the scanner scans from right to left
          // scannerIntersectLeft is the position of the scanner's LEFT edge within the card
          // When card enters from right: scannerIntersectLeft starts at ~0 (scanner at left edge of card)
          // When card exits: scannerIntersectLeft ends at cardWidth (scanner at right edge of card)
          // So we calculate how much has been scanned from RIGHT to LEFT
          const scannedFromRight = scannerIntersectLeft / cardWidth
          const scannedPercent = scannedFromRight * 100

          // As the card moves right to left, the scanner converts it from right to left
          // The RIGHT part (already scanned) becomes text, LEFT part (not yet scanned) stays as card
          // - Normal card: show what's to the LEFT of scanner (not yet scanned) = clip from right
          // - ASCII text: show what's to the RIGHT of scanner (already scanned) = clip from left
          // scannedFromRight = 0 means scanner at left edge → show all card, hide all text
          // scannedFromRight = 1 means scanner at right edge → hide all card, show all text
          normalCard.style.clipPath = `inset(0 0 0 ${scannedPercent}%)`
          asciiCard.style.clipPath = `inset(0 ${100 - scannedPercent}% 0 0)`
          // Text opacity should be 1 when visible (not 0), it's controlled by clipPath
          asciiCard.style.opacity = "1"

          if (!wrapper.hasAttribute("data-scanned") && scannerIntersectLeft > 0) {
            wrapper.setAttribute("data-scanned", "true")
            const scanEffect = document.createElement("div")
            scanEffect.className = "absolute top-0 left-0 w-full h-full pointer-events-none z-[5] bg-gradient-to-r from-transparent via-[rgba(0,255,255,0.4)] to-transparent animate-[scanEffect_0.6s_ease-out]"
            wrapper.appendChild(scanEffect)
            setTimeout(() => {
              if (scanEffect.parentNode) {
                scanEffect.parentNode.removeChild(scanEffect)
              }
            }, 600)
          }
        } else {
          // Cards move from RIGHT to LEFT (direction = -1)
          // Card is to the RIGHT of scanner (hasn't reached it yet) - show normal card completely, hide ASCII
          // cardLeft > scannerRight means the entire card is to the right of the scanner
          if (cardLeft > scannerRight) {
            normalCard.style.clipPath = "inset(0 0 0 0)"
            asciiCard.style.clipPath = "inset(0 0 0 100%)"
            asciiCard.style.opacity = "1"
          } 
          // Card is to the LEFT of scanner (has passed it completely) - show ASCII text completely, hide normal card
          // cardRight < scannerLeft means the entire card is to the left of the scanner
          else if (cardRight < scannerLeft) {
            normalCard.style.clipPath = "inset(0 100% 0 0)"
            asciiCard.style.clipPath = "inset(0 0 0 0)"
            asciiCard.style.opacity = "1"
          }
          wrapper.removeAttribute("data-scanned")
        }
      }
    })

    if (scannerSystemRef.current) {
      scannerSystemRef.current.setScanningActive(anyScanningActive)
    }
  }, [])

  const updateCardPosition = useCallback(() => {
    if (!cardLineRef.current) return
    
    const containerWidth = containerWidthRef.current
    const cardLineWidth = cardLineWidthRef.current
    const position = positionRef.current

    // Create infinite loop: when cards move completely off screen to the left,
    // reposition them to the right side to create seamless infinite scroll
    let newPosition = position
    if (position < -cardLineWidth) {
      // Cards have moved completely off screen to the left, reset to right side
      newPosition = position + cardLineWidth * 2
    } else if (position > containerWidth + cardLineWidth) {
      // Cards have moved completely off screen to the right, reset to left
      newPosition = position - cardLineWidth * 2
    }

    positionRef.current = newPosition
    cardLineRef.current.style.transform = `translateX(${newPosition}px)`
    updateCardClipping()
  }, [updateCardClipping])

  const animate = useCallback(() => {
    const currentTime = performance.now()
    const deltaTime = (currentTime - lastTimeRef.current) / 1000
    lastTimeRef.current = currentTime

    if (!isDraggingRef.current) {
      const friction = 0.95
      const minVelocity = 50
      let velocity = velocityRef.current

      if (velocity > minVelocity) {
        velocity *= friction
      } else {
        velocity = Math.max(minVelocity, velocity)
      }

      velocityRef.current = velocity
      positionRef.current += velocity * direction * deltaTime
      updateCardPosition()
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [direction, updateCardPosition])

  const startDrag = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX

    isDraggingRef.current = true
    lastMouseXRef.current = clientX
    mouseVelocityRef.current = 0

    if (cardLineRef.current) {
      const transform = window.getComputedStyle(cardLineRef.current).transform
      if (transform !== "none") {
        const matrix = new DOMMatrix(transform)
        positionRef.current = matrix.m41
      }
      cardLineRef.current.style.animation = "none"
      cardLineRef.current.classList.add("cursor-grabbing")
    }

    document.body.style.userSelect = "none"
    document.body.style.cursor = "grabbing"
  }, [])

  const onDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current || !cardLineRef.current) return
    e.preventDefault()
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const deltaX = clientX - lastMouseXRef.current
    
    positionRef.current += deltaX
    mouseVelocityRef.current = deltaX * 60
    lastMouseXRef.current = clientX

    cardLineRef.current.style.transform = `translateX(${positionRef.current}px)`
    updateCardClipping()
  }, [updateCardClipping])

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return

    isDraggingRef.current = false
    if (cardLineRef.current) {
      cardLineRef.current.classList.remove("cursor-grabbing")
    }

    const minVelocity = 30
    if (Math.abs(mouseVelocityRef.current) > minVelocity) {
      velocityRef.current = Math.abs(mouseVelocityRef.current)
    } else {
      velocityRef.current = 200
    }

    document.body.style.userSelect = ""
    document.body.style.cursor = ""
  }, [])

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const scrollSpeed = 20
    const delta = e.deltaY > 0 ? scrollSpeed : -scrollSpeed
    positionRef.current += delta
    updateCardPosition()
    updateCardClipping()
  }, [updateCardPosition, updateCardClipping])


  // Initialize particle system with Three.js
  useEffect(() => {
    if (!particleCanvasRef.current) return

    // Dynamic import of Three.js - using Function to prevent Next.js static analysis
    const loadThree = async () => {
      let THREE: any
      try {
        // Use Function constructor to make import truly dynamic and prevent Next.js static analysis
        // This will only work if three is installed, otherwise it will fail gracefully
        const dynamicImport = new Function('specifier', 'return import(specifier)')
        THREE = await dynamicImport('three')
      } catch (error) {
        // Three.js not installed or failed to load - particle system will be disabled
        // Component will still work without particles
        console.log('Three.js particle system disabled (optional dependency)')
        return
      }
      
      if (!THREE || !THREE.Scene) return
      const canvas = particleCanvasRef.current
      if (!canvas) return

      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(
        -window.innerWidth / 2,
        window.innerWidth / 2,
        125,
        -125,
        1,
        1000
      )
      camera.position.z = 100

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      })
      renderer.setSize(window.innerWidth, 250)
      renderer.setClearColor(0x000000, 0)

      const particleCount = 400
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(particleCount * 3)
      const colors = new Float32Array(particleCount * 3)
      const sizes = new Float32Array(particleCount)
      const velocities = new Float32Array(particleCount)

      const gradientCanvas = document.createElement("canvas")
      gradientCanvas.width = 100
      gradientCanvas.height = 100
      const ctx = gradientCanvas.getContext("2d")
      if (ctx) {
        const half = gradientCanvas.width / 2
        const hue = 217
        const gradient = ctx.createRadialGradient(half, half, 0, half, half, half)
        gradient.addColorStop(0.025, "#fff")
        gradient.addColorStop(0.1, `hsl(${hue}, 61%, 33%)`)
        gradient.addColorStop(0.25, `hsl(${hue}, 64%, 6%)`)
        gradient.addColorStop(1, "transparent")
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(half, half, half, 0, Math.PI * 2)
        ctx.fill()
      }

      const texture = new THREE.CanvasTexture(gradientCanvas)

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * window.innerWidth * 2
        positions[i * 3 + 1] = (Math.random() - 0.5) * 250
        positions[i * 3 + 2] = 0

        colors[i * 3] = 1
        colors[i * 3 + 1] = 1
        colors[i * 3 + 2] = 1

        const orbitRadius = Math.random() * 200 + 100
        sizes[i] = (Math.random() * (orbitRadius - 60) + 60) / 8
        velocities[i] = Math.random() * 60 + 30
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))

      const alphas = new Float32Array(particleCount)
      for (let i = 0; i < particleCount; i++) {
        alphas[i] = (Math.random() * 8 + 2) / 10
      }
      geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1))

      const material = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: texture },
        size: { value: 15.0 },
      },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        varying vec3 vColor;
        uniform float size;
        void main() {
          vAlpha = alpha;
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, vAlpha) * texture2D(pointTexture, gl_PointCoord);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    })

      const particles = new THREE.Points(geometry, material)
      scene.add(particles)

      let animationId: number
      const animateParticles = () => {
        animationId = requestAnimationFrame(animateParticles)

        const positions = particles.geometry.attributes.position.array as Float32Array
        const alphas = particles.geometry.attributes.alpha.array as Float32Array
        const time = Date.now() * 0.001

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += velocities[i] * 0.016

          if (positions[i * 3] > window.innerWidth / 2 + 100) {
            positions[i * 3] = -window.innerWidth / 2 - 100
            positions[i * 3 + 1] = (Math.random() - 0.5) * 250
          }

          positions[i * 3 + 1] += Math.sin(time + i * 0.1) * 0.5

          const twinkle = Math.floor(Math.random() * 10)
          if (twinkle === 1 && alphas[i] > 0) {
            alphas[i] -= 0.05
          } else if (twinkle === 2 && alphas[i] < 1) {
            alphas[i] += 0.05
          }

          alphas[i] = Math.max(0, Math.min(1, alphas[i]))
        }

        particles.geometry.attributes.position.needsUpdate = true
        particles.geometry.attributes.alpha.needsUpdate = true
        renderer.render(scene, camera)
      }

      animateParticles()

      const handleResize = () => {
        camera.left = -window.innerWidth / 2
        camera.right = window.innerWidth / 2
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, 250)
      }

      window.addEventListener("resize", handleResize)

      particleSystemRef.current = { scene, camera, renderer, particles, animate: animateParticles }

      return () => {
        if (animationId) cancelAnimationFrame(animationId)
        window.removeEventListener("resize", handleResize)
        if (renderer) renderer.dispose()
        if (geometry) geometry.dispose()
        if (material) material.dispose()
        if (texture) texture.dispose()
      }
    }
    
    loadThree().catch((error) => {
      console.error('Failed to load Three.js:', error)
    })
  }, [])

  // Initialize scanner system
  useEffect(() => {
    if (!scannerCanvasRef.current) return

    const canvas = scannerCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let w = window.innerWidth
    let h = 300
    const particles: any[] = []
    let count = 0
    let maxParticles = 800
    let intensity = 0.8
    const lightBarX = w / 2
    const lightBarWidth = 3
    let fadeZone = 60

    const scanTargetIntensity = 1.8
    const scanTargetParticles = 2500
    const scanTargetFadeZone = 35

    let scanningActive = false

    const baseIntensity = intensity
    const baseMaxParticles = maxParticles
    const baseFadeZone = fadeZone

    let currentIntensity = intensity
    let currentMaxParticles = maxParticles
    let currentFadeZone = fadeZone
    const transitionSpeed = 0.05

    const setupCanvas = () => {
      canvas.width = w
      canvas.height = h
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.clearRect(0, 0, w, h)
    }

    setupCanvas()

    const gradientCanvas = document.createElement("canvas")
    const gradientCtx = gradientCanvas.getContext("2d")
    if (gradientCtx) {
      gradientCanvas.width = 16
      gradientCanvas.height = 16
      const half = gradientCanvas.width / 2
      const gradient = gradientCtx.createRadialGradient(half, half, 0, half, half, half)
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)")
      gradient.addColorStop(0.3, "rgba(196, 181, 253, 0.8)")
      gradient.addColorStop(0.7, "rgba(139, 92, 246, 0.4)")
      gradient.addColorStop(1, "transparent")
      gradientCtx.fillStyle = gradient
      gradientCtx.beginPath()
      gradientCtx.arc(half, half, half, 0, Math.PI * 2)
      gradientCtx.fill()
    }

    const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min

    const createParticle = () => {
      const intensityRatio = intensity / baseIntensity
      const speedMultiplier = 1 + (intensityRatio - 1) * 1.2
      const sizeMultiplier = 1 + (intensityRatio - 1) * 0.7

      return {
        x: lightBarX + randomFloat(-lightBarWidth / 2, lightBarWidth / 2),
        y: randomFloat(0, h),
        vx: randomFloat(0.2, 1.0) * speedMultiplier,
        vy: randomFloat(-0.15, 0.15) * speedMultiplier,
        radius: randomFloat(0.4, 1) * sizeMultiplier,
        alpha: randomFloat(0.6, 1),
        decay: randomFloat(0.005, 0.025) * (2 - intensityRatio * 0.5),
        originalAlpha: 0,
        life: 1.0,
        time: 0,
        startX: 0,
        twinkleSpeed: randomFloat(0.02, 0.08) * speedMultiplier,
        twinkleAmount: randomFloat(0.1, 0.25),
      }
    }

    const initParticles = () => {
      for (let i = 0; i < maxParticles; i++) {
        const particle = createParticle()
        particle.originalAlpha = particle.alpha
        particle.startX = particle.x
        count++
        particles[count] = particle
      }
    }

    initParticles()

    const updateParticle = (particle: any) => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.time++

      particle.alpha = particle.originalAlpha * particle.life + Math.sin(particle.time * particle.twinkleSpeed) * particle.twinkleAmount
      particle.life -= particle.decay

      if (particle.x > w + 10 || particle.life <= 0) {
        resetParticle(particle)
      }
    }

    const resetParticle = (particle: any) => {
      particle.x = lightBarX + randomFloat(-lightBarWidth / 2, lightBarWidth / 2)
      particle.y = randomFloat(0, h)
      particle.vx = randomFloat(0.2, 1.0)
      particle.vy = randomFloat(-0.15, 0.15)
      particle.alpha = randomFloat(0.6, 1)
      particle.originalAlpha = particle.alpha
      particle.life = 1.0
      particle.time = 0
      particle.startX = particle.x
    }

    const drawParticle = (particle: any) => {
      if (particle.life <= 0) return

      let fadeAlpha = 1
      if (particle.y < fadeZone) {
        fadeAlpha = particle.y / fadeZone
      } else if (particle.y > h - fadeZone) {
        fadeAlpha = (h - particle.y) / fadeZone
      }
      fadeAlpha = Math.max(0, Math.min(1, fadeAlpha))

      ctx.globalAlpha = particle.alpha * fadeAlpha
      ctx.drawImage(gradientCanvas, particle.x - particle.radius, particle.y - particle.radius, particle.radius * 2, particle.radius * 2)
    }

    let currentGlowIntensity = 1

    const drawLightBar = () => {
      const verticalGradient = ctx.createLinearGradient(0, 0, 0, h)
      verticalGradient.addColorStop(0, "rgba(255, 255, 255, 0)")
      verticalGradient.addColorStop(fadeZone / h, "rgba(255, 255, 255, 1)")
      verticalGradient.addColorStop(1 - fadeZone / h, "rgba(255, 255, 255, 1)")
      verticalGradient.addColorStop(1, "rgba(255, 255, 255, 0)")

      ctx.globalCompositeOperation = "lighter"

      const targetGlowIntensity = scanningActive ? 3.5 : 1
      currentGlowIntensity += (targetGlowIntensity - currentGlowIntensity) * transitionSpeed

      const glowIntensity = currentGlowIntensity
      const lineWidth = lightBarWidth
      const glow1Alpha = scanningActive ? 1.0 : 0.8
      const glow2Alpha = scanningActive ? 0.8 : 0.6
      const glow3Alpha = scanningActive ? 0.6 : 0.4

      const coreGradient = ctx.createLinearGradient(lightBarX - lineWidth / 2, 0, lightBarX + lineWidth / 2, 0)
      coreGradient.addColorStop(0, "rgba(255, 255, 255, 0)")
      coreGradient.addColorStop(0.3, `rgba(255, 255, 255, ${0.9 * glowIntensity})`)
      coreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${1 * glowIntensity})`)
      coreGradient.addColorStop(0.7, `rgba(255, 255, 255, ${0.9 * glowIntensity})`)
      coreGradient.addColorStop(1, "rgba(255, 255, 255, 0)")

      ctx.globalAlpha = 1
      ctx.fillStyle = coreGradient

      let radius = 15
      ctx.beginPath()
      if ((ctx as any).roundRect) {
        ;(ctx as any).roundRect(lightBarX - lineWidth / 2, 0, lineWidth, h, radius)
      } else {
        // Fallback for browsers without roundRect
        const x = lightBarX - lineWidth / 2
        const y = 0
        const w = lineWidth
        if (w < 2 * radius) radius = w / 2
        if (h < 2 * radius) radius = h / 2
        ctx.moveTo(x + radius, y)
        ctx.arcTo(x + w, y, x + w, y + h, radius)
        ctx.arcTo(x + w, y + h, x, y + h, radius)
        ctx.arcTo(x, y + h, x, y, radius)
        ctx.arcTo(x, y, x + w, y, radius)
        ctx.closePath()
      }
      ctx.fill()

      const glow1Gradient = ctx.createLinearGradient(lightBarX - lineWidth * 2, 0, lightBarX + lineWidth * 2, 0)
      glow1Gradient.addColorStop(0, "rgba(139, 92, 246, 0)")
      glow1Gradient.addColorStop(0.5, `rgba(196, 181, 253, ${0.8 * glowIntensity})`)
      glow1Gradient.addColorStop(1, "rgba(139, 92, 246, 0)")

      ctx.globalAlpha = glow1Alpha
      ctx.fillStyle = glow1Gradient

      const glow1Radius = 25
      ctx.beginPath()
      if ((ctx as any).roundRect) {
        ;(ctx as any).roundRect(lightBarX - lineWidth * 2, 0, lineWidth * 4, h, glow1Radius)
      } else {
        const x = lightBarX - lineWidth * 2
        const y = 0
        const w = lineWidth * 4
        let r = glow1Radius
        if (w < 2 * r) r = w / 2
        if (h < 2 * r) r = h / 2
        ctx.moveTo(x + r, y)
        ctx.arcTo(x + w, y, x + w, y + h, r)
        ctx.arcTo(x + w, y + h, x, y + h, r)
        ctx.arcTo(x, y + h, x, y, r)
        ctx.arcTo(x, y, x + w, y, r)
        ctx.closePath()
      }
      ctx.fill()

      const glow2Gradient = ctx.createLinearGradient(lightBarX - lineWidth * 4, 0, lightBarX + lineWidth * 4, 0)
      glow2Gradient.addColorStop(0, "rgba(139, 92, 246, 0)")
      glow2Gradient.addColorStop(0.5, `rgba(139, 92, 246, ${0.4 * glowIntensity})`)
      glow2Gradient.addColorStop(1, "rgba(139, 92, 246, 0)")

      ctx.globalAlpha = glow2Alpha
      ctx.fillStyle = glow2Gradient

      const glow2Radius = 35
      ctx.beginPath()
      if ((ctx as any).roundRect) {
        ;(ctx as any).roundRect(lightBarX - lineWidth * 4, 0, lineWidth * 8, h, glow2Radius)
      } else {
        const x = lightBarX - lineWidth * 4
        const y = 0
        const w = lineWidth * 8
        let r = glow2Radius
        if (w < 2 * r) r = w / 2
        if (h < 2 * r) r = h / 2
        ctx.moveTo(x + r, y)
        ctx.arcTo(x + w, y, x + w, y + h, r)
        ctx.arcTo(x + w, y + h, x, y + h, r)
        ctx.arcTo(x, y + h, x, y, r)
        ctx.arcTo(x, y, x + w, y, r)
        ctx.closePath()
      }
      ctx.fill()

      if (scanningActive) {
        const glow3Gradient = ctx.createLinearGradient(lightBarX - lineWidth * 8, 0, lightBarX + lineWidth * 8, 0)
        glow3Gradient.addColorStop(0, "rgba(139, 92, 246, 0)")
        glow3Gradient.addColorStop(0.5, "rgba(139, 92, 246, 0.2)")
        glow3Gradient.addColorStop(1, "rgba(139, 92, 246, 0)")

        ctx.globalAlpha = glow3Alpha
        ctx.fillStyle = glow3Gradient

        const glow3Radius = 45
        ctx.beginPath()
        if ((ctx as any).roundRect) {
          ;(ctx as any).roundRect(lightBarX - lineWidth * 8, 0, lineWidth * 16, h, glow3Radius)
        } else {
          const x = lightBarX - lineWidth * 8
          const y = 0
          const w = lineWidth * 16
          let r = glow3Radius
          if (w < 2 * r) r = w / 2
          if (h < 2 * r) r = h / 2
          ctx.moveTo(x + r, y)
          ctx.arcTo(x + w, y, x + w, y + h, r)
          ctx.arcTo(x + w, y + h, x, y + h, r)
          ctx.arcTo(x, y + h, x, y, r)
          ctx.arcTo(x, y, x + w, y, r)
          ctx.closePath()
        }
        ctx.fill()
      }

      ctx.globalCompositeOperation = "destination-in"
      ctx.globalAlpha = 1
      ctx.fillStyle = verticalGradient
      ctx.fillRect(0, 0, w, h)
    }

    const render = () => {
      const targetIntensity = scanningActive ? scanTargetIntensity : baseIntensity
      const targetMaxParticles = scanningActive ? scanTargetParticles : baseMaxParticles
      const targetFadeZone = scanningActive ? scanTargetFadeZone : baseFadeZone

      currentIntensity += (targetIntensity - currentIntensity) * transitionSpeed
      currentMaxParticles += (targetMaxParticles - currentMaxParticles) * transitionSpeed
      currentFadeZone += (targetFadeZone - currentFadeZone) * transitionSpeed

      intensity = currentIntensity
      maxParticles = Math.floor(currentMaxParticles)
      fadeZone = currentFadeZone

      ctx.globalCompositeOperation = "source-over"
      ctx.clearRect(0, 0, w, h)

      drawLightBar()

      ctx.globalCompositeOperation = "lighter"
      for (let i = 1; i <= count; i++) {
        if (particles[i]) {
          updateParticle(particles[i])
          drawParticle(particles[i])
        }
      }

      const currentIntensityValue = intensity
      const currentMaxParticlesValue = maxParticles

      if (Math.random() < currentIntensityValue && count < currentMaxParticlesValue) {
        const particle = createParticle()
        particle.originalAlpha = particle.alpha
        particle.startX = particle.x
        count++
        particles[count] = particle
      }

      const intensityRatio = intensity / baseIntensity

      if (intensityRatio > 1.1 && Math.random() < (intensityRatio - 1.0) * 1.2) {
        const particle = createParticle()
        particle.originalAlpha = particle.alpha
        particle.startX = particle.x
        count++
        particles[count] = particle
      }

      if (intensityRatio > 1.3 && Math.random() < (intensityRatio - 1.3) * 1.4) {
        const particle = createParticle()
        particle.originalAlpha = particle.alpha
        particle.startX = particle.x
        count++
        particles[count] = particle
      }

      if (intensityRatio > 1.5 && Math.random() < (intensityRatio - 1.5) * 1.8) {
        const particle = createParticle()
        particle.originalAlpha = particle.alpha
        particle.startX = particle.x
        count++
        particles[count] = particle
      }

      if (intensityRatio > 2.0 && Math.random() < (intensityRatio - 2.0) * 2.0) {
        const particle = createParticle()
        particle.originalAlpha = particle.alpha
        particle.startX = particle.x
        count++
        particles[count] = particle
      }

      if (count > currentMaxParticlesValue + 200) {
        const excessCount = Math.min(15, count - currentMaxParticlesValue)
        for (let i = 0; i < excessCount; i++) {
          delete particles[count - i]
        }
        count -= excessCount
      }
    }

    let animationId: number
    const animateScanner = () => {
      render()
      animationId = requestAnimationFrame(animateScanner)
    }

    animateScanner()

    const handleResize = () => {
      w = window.innerWidth
      setupCanvas()
    }

    window.addEventListener("resize", handleResize)

    scannerSystemRef.current = {
      setScanningActive: (active: boolean) => {
        scanningActive = active
      },
    }

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Populate cards
  useEffect(() => {
    if (!cardLineRef.current) return

    cardLineRef.current.innerHTML = ""
    const cardsCount = 30
    // Create initial set of cards
    for (let i = 0; i < cardsCount; i++) {
      const cardWrapper = createCardWrapper(i)
      cardWrapper.classList.add("card-wrapper")
      cardLineRef.current.appendChild(cardWrapper)
    }
    
    // Duplicate cards to create seamless infinite loop
    // This ensures there are always cards visible when scrolling
    const originalCards = Array.from(cardLineRef.current.children)
    originalCards.forEach((card) => {
      const clonedCard = card.cloneNode(true) as HTMLElement
      clonedCard.classList.add("card-wrapper")
      cardLineRef.current?.appendChild(clonedCard)
    })

    calculateDimensions()
    // Start cards closer to the center divider line
    const centerX = window.innerWidth / 2
    const cardWidth = 400
    positionRef.current = centerX - cardWidth / 2
    if (cardLineRef.current) {
      cardLineRef.current.style.transform = `translateX(${positionRef.current}px)`
    }
  }, [createCardWrapper, calculateDimensions])

  // Setup event listeners
  useEffect(() => {
    if (!cardLineRef.current) return

    const cardLine = cardLineRef.current

    const handleMouseDown = (e: MouseEvent) => startDrag(e)
    const handleMouseMove = (e: MouseEvent) => onDrag(e)
    const handleMouseUp = () => endDrag()
    const handleTouchStart = (e: TouchEvent) => startDrag(e)
    const handleTouchMove = (e: TouchEvent) => onDrag(e)
    const handleTouchEnd = () => endDrag()
    const handleWheel = (e: WheelEvent) => onWheel(e)

    cardLine.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    cardLine.addEventListener("touchstart", handleTouchStart, { passive: false })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)
    cardLine.addEventListener("wheel", handleWheel)
    cardLine.addEventListener("selectstart", (e) => e.preventDefault())
    cardLine.addEventListener("dragstart", (e) => e.preventDefault())

    const handleResize = () => {
      calculateDimensions()
      if (scannerCanvasRef.current) {
        scannerCanvasRef.current.width = window.innerWidth
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      cardLine.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      cardLine.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
      cardLine.removeEventListener("wheel", handleWheel)
      window.removeEventListener("resize", handleResize)
    }
  }, [startDrag, onDrag, endDrag, onWheel, calculateDimensions])

  // Start animation loop
  useEffect(() => {
    lastTimeRef.current = performance.now()
    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate])

  // Update ASCII content periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!cardLineRef.current) return
      
      const asciiContents = cardLineRef.current.querySelectorAll<HTMLElement>(".ascii-content")
      asciiContents.forEach((content) => {
        if (Math.random() < 0.15) {
          const { width, height } = calculateCodeDimensions(400, 250)
          content.textContent = generateCode(width, height)
        }
      })
    }, 200)

    return () => clearInterval(interval)
  }, [generateCode, calculateCodeDimensions])

  // Update clipping continuously
  useEffect(() => {
    const updateClipping = () => {
      updateCardClipping()
      requestAnimationFrame(updateClipping)
    }
    updateClipping()
  }, [updateCardClipping])

  return (

    
    <div className="relative w-screen h-[50vh] bg-background overflow-hidden">
      {/* Container */}
      <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
        {/* Particle Canvas */}

    
        <canvas
          ref={particleCanvasRef}
          className="absolute top-1/2 left-0 -translate-y-1/2 w-screen h-[250px] z-0 pointer-events-none"
        />

        {/* Scanner Canvas */}
        <canvas
          ref={scannerCanvasRef}
          className="absolute top-1/2 -left-[3px] -translate-y-1/2 w-screen h-[300px] z-15 pointer-events-none"
        />

        {/* Card Stream */}
        <div className="absolute w-screen h-[180px] flex items-center overflow-visible">
          <div
            ref={cardLineRef}
            className="flex items-center gap-[60px] whitespace-nowrap cursor-grab select-none will-change-transform"
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes scanEffect {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        .animate-\\[scanEffect_0\\.6s_ease-out\\] {
          animation: scanEffect 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}


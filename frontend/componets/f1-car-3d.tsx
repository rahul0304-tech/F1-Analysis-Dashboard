"use client"

import { useEffect, useRef } from "react"

interface F1Car3DProps {
  teamColor?: string
  size?: number
  animate?: boolean
}

export function F1Car3D({ teamColor = "#FF0000", size = 100, animate = true }: F1Car3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = size
    canvas.height = size

    let rotation = 0

    const drawF1Car = () => {
      ctx.clearRect(0, 0, size, size)
      ctx.save()

      // Center the car
      ctx.translate(size / 2, size / 2)

      if (animate) {
        ctx.rotate(rotation)
        rotation += 0.02
      }

      // Scale the car
      const scale = size / 100
      ctx.scale(scale, scale)

      // Car body (main chassis)
      ctx.fillStyle = teamColor
      ctx.fillRect(-30, -8, 60, 16)

      // Front wing
      ctx.fillStyle = "#333333"
      ctx.fillRect(-35, -12, 8, 24)

      // Rear wing
      ctx.fillStyle = "#333333"
      ctx.fillRect(25, -15, 8, 30)

      // Cockpit
      ctx.fillStyle = "#000000"
      ctx.fillRect(-10, -6, 20, 12)

      // Wheels
      ctx.fillStyle = "#222222"
      // Front wheels
      ctx.beginPath()
      ctx.arc(-20, -12, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(-20, 12, 4, 0, Math.PI * 2)
      ctx.fill()

      // Rear wheels
      ctx.beginPath()
      ctx.arc(15, -12, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(15, 12, 4, 0, Math.PI * 2)
      ctx.fill()

      // Nose cone
      ctx.fillStyle = teamColor
      ctx.beginPath()
      ctx.moveTo(-30, -4)
      ctx.lineTo(-40, 0)
      ctx.lineTo(-30, 4)
      ctx.closePath()
      ctx.fill()

      // Side mirrors
      ctx.fillStyle = "#666666"
      ctx.fillRect(-8, -10, 2, 4)
      ctx.fillRect(-8, 6, 2, 4)

      ctx.restore()
    }

    const animate3D = () => {
      drawF1Car()
      if (animate) {
        animationRef.current = requestAnimationFrame(animate3D)
      }
    }

    animate3D()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [teamColor, size, animate])

  return (
    <canvas
      ref={canvasRef}
      className="drop-shadow-lg"
      style={{
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
        background: "transparent",
      }}
    />
  )
}

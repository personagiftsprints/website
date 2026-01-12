"use client"

import { useEffect, useRef, useState } from "react"
import * as fabric from "fabric"

export default function TshirtStudio() {
  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 420,
      height: 540,
      preserveObjectStacking: true
    })

    fabricCanvasRef.current = canvas

    // Load T-shirt background
    fabric.Image.fromURL("/images/tshirt-front.png", img => {
      img.selectable = false
      img.evented = false

      canvas.setBackgroundImage(
        img,
        canvas.renderAll.bind(canvas),
        {
          scaleX: canvas.width / img.width,
          scaleY: canvas.height / img.height
        }
      )
    })

    // Print area
    const printArea = new fabric.Rect({
      left: 110,
      top: 130,
      width: 200,
      height: 260,
      fill: "rgba(0,0,0,0)",
      stroke: "#00ff00",
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false
    })

    canvas.add(printArea)
    printArea.moveTo(0)

    return () => {
      canvas.dispose()
    }
  }, [])

  const handleUpload = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"

    input.onchange = e => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        fabric.Image.fromURL(reader.result, img => {
          const printArea = canvas.getObjects().find(obj => obj.fill === "rgba(0,0,0,0)")
          
          img.set({
            left: printArea ? printArea.left + 20 : 100,
            top: printArea ? printArea.top + 20 : 100,
            scaleX: 0.3,
            scaleY: 0.3,
            cornerSize: 8,
            transparentCorners: false
          })

          canvas.add(img)
          img.moveTo(canvas.getObjects().length - 1)
          canvas.setActiveObject(img)
          canvas.requestRenderAll()
        })
      }

      reader.readAsDataURL(file)
    }

    input.click()
  }

  return (
    <div>
      <button 
        onClick={handleUpload}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Upload Image
      </button>
      <canvas
        ref={canvasRef}
        className="border bg-white"
      />
    </div>
  )
}
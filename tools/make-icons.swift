import AppKit

func color(_ red: CGFloat, _ green: CGFloat, _ blue: CGFloat) -> NSColor {
    NSColor(srgbRed: red / 255, green: green / 255, blue: blue / 255, alpha: 1)
}

func drawIcon() {
    color(13, 111, 146).setFill()
    NSBezierPath(roundedRect: NSRect(x: 0, y: 0, width: 512, height: 512), xRadius: 120, yRadius: 120).fill()

    color(35, 152, 168).setFill()
    NSBezierPath(ovalIn: NSRect(x: 135, y: 200, width: 430, height: 430)).fill()

    color(255, 216, 149).setFill()
    let tail = NSBezierPath()
    tail.move(to: NSPoint(x: 199, y: 254))
    tail.curve(to: NSPoint(x: 96, y: 357), controlPoint1: NSPoint(x: 127, y: 266), controlPoint2: NSPoint(x: 138, y: 319))
    tail.curve(to: NSPoint(x: 96, y: 151), controlPoint1: NSPoint(x: 145, y: 316), controlPoint2: NSPoint(x: 145, y: 191))
    tail.curve(to: NSPoint(x: 199, y: 254), controlPoint1: NSPoint(x: 137, y: 185), controlPoint2: NSPoint(x: 139, y: 241))
    tail.fill()

    color(255, 203, 134).setFill()
    let fin = NSBezierPath()
    fin.move(to: NSPoint(x: 213, y: 347))
    fin.curve(to: NSPoint(x: 342, y: 430), controlPoint1: NSPoint(x: 265, y: 434), controlPoint2: NSPoint(x: 311, y: 453))
    fin.line(to: NSPoint(x: 324, y: 343))
    fin.close()
    fin.fill()

    color(255, 199, 133).setFill()
    NSBezierPath(ovalIn: NSRect(x: 153, y: 112, width: 315, height: 285)).fill()
    color(255, 228, 171).setFill()
    NSBezierPath(ovalIn: NSRect(x: 176, y: 128, width: 259, height: 132)).fill()

    color(255, 249, 229).setFill()
    NSBezierPath(ovalIn: NSRect(x: 351, y: 266, width: 49, height: 49)).fill()
    color(24, 67, 87).setFill()
    NSBezierPath(ovalIn: NSRect(x: 367, y: 273, width: 28, height: 28)).fill()
    color(255, 255, 255).setFill()
    NSBezierPath(ovalIn: NSRect(x: 381, y: 290, width: 8, height: 8)).fill()

    let mouth = NSBezierPath()
    mouth.move(to: NSPoint(x: 400, y: 205))
    mouth.curve(to: NSPoint(x: 437, y: 212), controlPoint1: NSPoint(x: 415, y: 198), controlPoint2: NSPoint(x: 426, y: 203))
    mouth.lineWidth = 6
    mouth.lineCapStyle = .round
    color(144, 89, 88).setStroke()
    mouth.stroke()

    let bubble = NSBezierPath(ovalIn: NSRect(x: 92, y: 393, width: 38, height: 38))
    bubble.lineWidth = 6
    color(193, 244, 232).setStroke()
    bubble.stroke()
}

for size in [192, 512] {
    guard let bitmap = NSBitmapImageRep(
        bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
        isPlanar: false, colorSpaceName: .deviceRGB,
        bytesPerRow: 0, bitsPerPixel: 0
    ), let graphics = NSGraphicsContext(bitmapImageRep: bitmap) else {
        fatalError("Could not create icon bitmap")
    }
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = graphics
    graphics.cgContext.scaleBy(x: CGFloat(size) / 512, y: CGFloat(size) / 512)
    drawIcon()
    graphics.flushGraphics()
    NSGraphicsContext.restoreGraphicsState()
    guard let data = bitmap.representation(using: .png, properties: [:]) else {
        fatalError("Could not encode icon")
    }
    try data.write(to: URL(fileURLWithPath: "icons/fish-\(size).png"))
}

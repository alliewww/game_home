import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from 'react'
import './styles.css'

const GRID_SIZE = 3
const CUBE_SIZE = 64
const GAP = 80
const DISPLAY_MODE: 'color' | 'clear' = 'clear'
type Player = 'O' | 'X'
type CellValue = Player | null
type Position = [number, number, number]
type WinningLine = Position[]

function createEmptyBoard(): CellValue[][][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => Array<CellValue>(GRID_SIZE).fill(null)),
  )
}

function generateWinningLines(): WinningLine[] {
  const directions: Position[] = []
  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dz === 0 && dy === 0 && dx === 0) {
          continue
        }
        const firstNonZero = [dz, dy, dx].find((n) => n !== 0)
        if (firstNonZero === undefined || firstNonZero < 0) {
          continue
        }
        directions.push([dz, dy, dx])
      }
    }
  }

  const lines: WinningLine[] = []
  for (let z = 0; z < GRID_SIZE; z += 1) {
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        for (const [dz, dy, dx] of directions) {
          const endZ = z + (GRID_SIZE - 1) * dz
          const endY = y + (GRID_SIZE - 1) * dy
          const endX = x + (GRID_SIZE - 1) * dx
          if (
            endZ < 0 ||
            endZ >= GRID_SIZE ||
            endY < 0 ||
            endY >= GRID_SIZE ||
            endX < 0 ||
            endX >= GRID_SIZE
          ) {
            continue
          }
          const line: WinningLine = []
          for (let step = 0; step < GRID_SIZE; step += 1) {
            line.push([z + step * dz, y + step * dy, x + step * dx])
          }
          lines.push(line)
        }
      }
    }
  }
  return lines
}

const WINNING_LINES = generateWinningLines()

const CONFETTI_COLORS = ['#f97316', '#2563eb', '#f8fafc', '#a855f7', '#22c55e', '#f59e0b', '#38bdf8']
const CONFETTI_COUNT = 60

function Confetti() {
  const pieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    const left = `${Math.random() * 100}%`
    const delay = `${Math.random() * 1.5}s`
    const duration = `${2 + Math.random() * 2}s`
    const size = `${6 + Math.random() * 8}px`
    const rotate = `${Math.random() * 360}deg`
    return (
      <span
        key={i}
        className="confetti-piece"
        style={{ left, animationDelay: delay, animationDuration: duration, width: size, height: size, backgroundColor: color, '--rot': rotate } as React.CSSProperties}
      />
    )
  })
  return <div className="confetti-container" aria-hidden>{pieces}</div>
}

function getWinner(board: CellValue[][][]): Player | null {
  for (const line of WINNING_LINES) {
    const [z0, y0, x0] = line[0]
    const first = board[z0][y0][x0]
    if (first === null) {
      continue
    }
    if (line.every(([z, y, x]) => board[z][y][x] === first)) {
      return first
    }
  }
  return null
}

function isBoardFull(board: CellValue[][][]): boolean {
  return board.every((layer) => layer.every((row) => row.every((cell) => cell !== null)))
}

export default function App() {
  const [rotation, setRotation] = useState({ x: -28, y: 35 })
  const [zoom, setZoom] = useState(1)
  const [board, setBoard] = useState<CellValue[][][]>(() => createEmptyBoard())
  const [currentPlayer, setCurrentPlayer] = useState<Player>('O')
  const holdIntervalRef = useRef<number | null>(null)
  const keyHoldIntervalRef = useRef<number | null>(null)
  const activeKeysRef = useRef<Set<string>>(new Set())
  const suppressClickUntilRef = useRef(0)
  const restoreOverflowRef = useRef<string | null>(null)
  const pinchDistanceRef = useRef<number | null>(null)
  const activePointerPositionsRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const dragStateRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startRotateX: 0,
    startRotateY: 0,
    moved: false,
  })
  const winner = getWinner(board)
  const isDraw = !winner && isBoardFull(board)

  const clampZoom = (value: number) => Math.max(0.55, Math.min(1.8, value))
  const zoomBy = (delta: number) => setZoom((prev) => clampZoom(prev + delta))

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    activePointerPositionsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (activePointerPositionsRef.current.size === 2) {
      const [first, second] = Array.from(activePointerPositionsRef.current.values())
      pinchDistanceRef.current = Math.hypot(second.x - first.x, second.y - first.y)
      dragStateRef.current.active = false
    } else {
      dragStateRef.current = {
        active: true,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startRotateX: rotation.x,
        startRotateY: rotation.y,
        moved: false,
      }
    }

    if (restoreOverflowRef.current === null) {
      restoreOverflowRef.current = document.body.style.overflow
    }
    document.body.style.overflow = 'hidden'
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    activePointerPositionsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (activePointerPositionsRef.current.size === 2) {
      event.preventDefault()
      const [first, second] = Array.from(activePointerPositionsRef.current.values())
      const nextDistance = Math.hypot(second.x - first.x, second.y - first.y)
      if (pinchDistanceRef.current !== null) {
        const delta = (nextDistance - pinchDistanceRef.current) * 0.004
        if (Math.abs(delta) > 0) {
          zoomBy(delta)
        }
      }
      pinchDistanceRef.current = nextDistance
      return
    }

    const drag = dragStateRef.current
    if (!drag.active || drag.pointerId !== event.pointerId) {
      return
    }
    event.preventDefault()

    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY
    if (Math.abs(deltaX) + Math.abs(deltaY) > 6) {
      drag.moved = true
    }
    const nextX = drag.startRotateX - deltaY * 0.35
    const nextY = drag.startRotateY + deltaX * 0.45
    setRotation({ x: nextX, y: nextY })
  }

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current
    if (drag.pointerId === event.pointerId && drag.moved) {
      suppressClickUntilRef.current = event.timeStamp + 140
    }

    activePointerPositionsRef.current.delete(event.pointerId)
    if (activePointerPositionsRef.current.size < 2) {
      pinchDistanceRef.current = null
    }
    if (activePointerPositionsRef.current.size === 0) {
      dragStateRef.current.active = false
      document.body.style.overflow = restoreOverflowRef.current ?? ''
      restoreOverflowRef.current = null
    }
  }

  const placeAtCell = (z: number, row: number, col: number, timeStamp: number) => {
    if (timeStamp < suppressClickUntilRef.current) {
      return
    }
    if (winner || isDraw || board[z][row][col] !== null) {
      return
    }
    setBoard((prev) => {
      const next = prev.map((layer) => layer.map((line) => [...line]))
      next[z][row][col] = currentPlayer
      return next
    })
    setCurrentPlayer((prev) => (prev === 'O' ? 'X' : 'O'))
  }

  const rotateBy = (deltaX: number, deltaY: number) => {
    setRotation((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }))
  }

  const startHoldRotate = (deltaX: number, deltaY: number) => {
    rotateBy(deltaX, deltaY)
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current)
    }
    holdIntervalRef.current = window.setInterval(() => {
      rotateBy(deltaX, deltaY)
    }, 40)
  }

  const stopHoldRotate = () => {
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
  }

  const handleResetView = () => {
    stopHoldRotate()
    setRotation({ x: -28, y: 35 })
    setZoom(1)
  }

  const handleResetGame = () => {
    const gameInProgress = !winner && !isDraw && board.some((layer) => layer.some((row) => row.some((cell) => cell !== null)))
    if (gameInProgress && !window.confirm('Game in progress. Restart anyway?')) {
      return
    }
    setBoard(createEmptyBoard())
    setCurrentPlayer('O')
  }

  // Keep handler for temporarily commented controls section.
  void startHoldRotate

  useEffect(() => {
    const rotateByKey = (deltaX: number, deltaY: number) => {
      setRotation((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }))
    }

    const keyToDelta = (key: string): [number, number] => {
      switch (key) {
        case 'arrowup':
        case 'w':
          return [-2.5, 0]
        case 'arrowdown':
        case 's':
          return [2.5, 0]
        case 'arrowleft':
        case 'a':
          return [0, -2.5]
        case 'arrowright':
        case 'd':
          return [0, 2.5]
        default:
          return [0, 0]
      }
    }

    const applyKeyRotation = () => {
      let deltaX = 0
      let deltaY = 0
      for (const key of activeKeysRef.current) {
        const [dx, dy] = keyToDelta(key)
        deltaX += dx
        deltaY += dy
      }
      if (deltaX !== 0 || deltaY !== 0) {
        rotateByKey(deltaX, deltaY)
      }
    }

    const startKeyHold = () => {
      if (keyHoldIntervalRef.current !== null) {
        return
      }
      keyHoldIntervalRef.current = window.setInterval(applyKeyRotation, 40)
    }

    const stopKeyHoldIfIdle = () => {
      if (activeKeysRef.current.size === 0 && keyHoldIntervalRef.current !== null) {
        window.clearInterval(keyHoldIntervalRef.current)
        keyHoldIntervalRef.current = null
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const [dx, dy] = keyToDelta(key)
      if (dx === 0 && dy === 0) {
        return
      }
      event.preventDefault()
      if (!activeKeysRef.current.has(key)) {
        activeKeysRef.current.add(key)
        rotateByKey(dx, dy)
      }
      startKeyHold()
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      activeKeysRef.current.delete(key)
      stopKeyHoldIfIdle()
    }

    const handleBlur = () => {
      activeKeysRef.current.clear()
      stopKeyHoldIfIdle()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      if (keyHoldIntervalRef.current !== null) {
        window.clearInterval(keyHoldIntervalRef.current)
      }
      if (restoreOverflowRef.current !== null) {
        document.body.style.overflow = restoreOverflowRef.current
        restoreOverflowRef.current = null
      }
    }
  }, [])

  return (
    <main className={`single-cube-page mode-${DISPLAY_MODE}`}>
      {winner && <Confetti />}
      <div className="top-bar">
        <a className="ctrl-btn lobby-btn" href="../" aria-label="Back to Lobby">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </a>
        <div className="top-bar-center">
          <p className="game-hint">3 in a row wins</p>
          <div className="turn-indicator">
            {winner ? (
              <>
                <span className="turn-dot dot-win" style={{ backgroundColor: winner === 'O' ? '#f97316' : '#2563eb' }} />
                <span className="turn-winner-label" style={{ color: winner === 'O' ? '#f97316' : '#2563eb' }}>WINS!</span>
              </>
            ) : isDraw ? (
              <span className="turn-draw-label">DRAW</span>
            ) : (
              (['O', 'X'] as const).map((player) => {
                const isActive = currentPlayer === player
                const color = player === 'O' ? '#f97316' : '#2563eb'
                return (
                  <span
                    key={player}
                    className={`turn-dot${isActive ? ' dot-active' : ''}`}
                    style={{ backgroundColor: color, opacity: isActive ? 1 : 0.2 }}
                  />
                )
              })
            )}
          </div>
        </div>
        <button className="ctrl-btn restart-btn" onClick={handleResetGame} type="button" aria-label="Restart">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </div>
      <section
        className="cube-scene"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onWheel={(event) => {
          event.preventDefault()
          zoomBy(event.deltaY > 0 ? -0.04 : 0.04)
        }}
      >
        <div
          className="cube-group"
          style={{ transform: `scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
        >
          {Array.from({ length: GRID_SIZE }, (_, z) =>
            Array.from({ length: GRID_SIZE }, (_, row) =>
              Array.from({ length: GRID_SIZE }, (_, col) => {
                const x = (col - 1) * (CUBE_SIZE + GAP)
                const y = (row - 1) * (CUBE_SIZE + GAP)
                const depth = (z - 1) * (CUBE_SIZE + GAP)
                return (
                  <div
                    key={`${z}-${row}-${col}`}
                    className={`single-cube cube-cell ${
                      board[z][row][col] === 'O' ? 'player-o occupied' : ''
                    } ${board[z][row][col] === 'X' ? 'player-x occupied' : ''}`}
                    onClick={(event) => placeAtCell(z, row, col, event.timeStamp)}
                    onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        placeAtCell(z, row, col, event.timeStamp)
                      }
                    }}
                    role="button"
                    style={{
                      width: `${CUBE_SIZE}px`,
                      height: `${CUBE_SIZE}px`,
                      transform: `translate3d(${x}px, ${y}px, ${depth}px)`,
                    }}
                    tabIndex={0}
                  >
                    <span className="cube-face cube-front" />
                    <span className="cube-face cube-back" />
                    <span className="cube-face cube-left" />
                    <span className="cube-face cube-right" />
                    <span className="cube-face cube-top" />
                    <span className="cube-face cube-bottom" />
                  </div>
                )
              }),
            ),
          )}
        </div>
      </section>
      {/* <section className="controls">
        <div className="dpad">
          <button
            className="ctrl-btn"
            type="button"
            onPointerDown={() => startHoldRotate(-2.5, 0)}
            onPointerUp={stopHoldRotate}
            onPointerLeave={stopHoldRotate}
            onPointerCancel={stopHoldRotate}
          >
            ↑
          </button>
          <button
            className="ctrl-btn"
            type="button"
            onPointerDown={() => startHoldRotate(0, -2.5)}
            onPointerUp={stopHoldRotate}
            onPointerLeave={stopHoldRotate}
            onPointerCancel={stopHoldRotate}
          >
            ←
          </button>
          <button className="ctrl-btn reset-btn" type="button" onClick={handleResetView}>
            Reset
          </button>
          <button
            className="ctrl-btn"
            type="button"
            onPointerDown={() => startHoldRotate(0, 2.5)}
            onPointerUp={stopHoldRotate}
            onPointerLeave={stopHoldRotate}
            onPointerCancel={stopHoldRotate}
          >
            →
          </button>
          <button
            className="ctrl-btn"
            type="button"
            onPointerDown={() => startHoldRotate(2.5, 0)}
            onPointerUp={stopHoldRotate}
            onPointerLeave={stopHoldRotate}
            onPointerCancel={stopHoldRotate}
          >
            ↓
          </button>
        </div>
        <button className="ctrl-btn reset-btn mt-3 h-10 px-4" type="button" onClick={handleResetGame}>
          Restart
        </button>
      </section> */}
      <section className="controls">
        <div className="zoom-controls">
          <button className="ctrl-btn" onClick={() => zoomBy(0.08)} type="button">
            ＋
          </button>
          <button className="ctrl-btn" onClick={() => zoomBy(-0.08)} type="button">
            －
          </button>
          <button className="ctrl-btn" onClick={handleResetView} type="button">
            Reset View
          </button>
        </div>
      </section>
    </main>
  )
}

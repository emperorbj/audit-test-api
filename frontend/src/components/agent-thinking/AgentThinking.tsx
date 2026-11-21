// Shown while we wait for the agent's answer (usually 20-60 seconds, at most about 4 minutes).
// It plays the scenes from scenes.tsx in a random order, so it doesn't feel repetitive,
// and shows how long the agent has been working.
//
// Usage:   {askQuestion.isPending && <AgentThinking />}

import { useEffect, useState } from 'react'
import { SCENES, type Scene } from './scenes'
import './AgentThinking.css'

const SECONDS_PER_SCENE = 4
const SLOW_AFTER_SECONDS = 60   // after this, tell the user that big questions take longer

// Return a copy of the list in random order (Fisher-Yates shuffle).
function shuffle(list: Scene[]): Scene[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// 75 -> "1:15"
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function AgentThinking() {
  const [scenes] = useState(() => shuffle(SCENES))  // a new random order each time it appears
  const [seconds, setSeconds] = useState(0)

  // One timer, ticking every second. Everything else is worked out from `seconds`.
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)  // stop the timer when the component goes away
  }, [])

  const scene = scenes[Math.floor(seconds / SECONDS_PER_SCENE) % scenes.length]

  return (
    <div className="agent-thinking">
      {/* Read once by screen readers. The changing pictures and labels below are hidden from
          them, otherwise they would be announced every few seconds. */}
      <p className="sr-only" role="status">
        The agent is investigating your question. This usually takes under a minute.
      </p>

      {/* key={scene.id}: a new scene is a new element, so its animations start from the beginning. */}
      <div className="agent-thinking__art" key={scene.id} aria-hidden="true">
        {scene.drawing}
      </div>

      <p className="agent-thinking__label" aria-hidden="true">{scene.label}…</p>

      <p className="agent-thinking__time" aria-hidden="true">
        Working for {formatTime(seconds)}
        {seconds >= SLOW_AFTER_SECONDS && ' · Bigger questions can take up to 4 minutes'}
      </p>
    </div>
  )
}

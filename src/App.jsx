import { useState, useRef, useEffect } from 'react'
import './App.css'

const WAVEFORM = [
  18, 24, 21, 38, 31, 44, 27, 52,
  36, 29, 48, 61, 34, 42, 26, 55,
  47, 68, 39, 31, 57, 46, 73, 41,
  29, 51, 64, 35, 48, 58, 32, 44,
  62, 37, 27, 54, 46, 71, 35, 43,
  57, 31, 49, 65, 38, 52, 29, 47,
  61, 42, 34, 56, 70, 39, 45, 28,
  53, 64, 36, 48, 59, 31, 43, 55,
]

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '00:00'

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function App() {
  const audioRef = useRef(null)
  const contextRef = useRef(null)
  const voiceGainRef = useRef(null)
  const filterRef = useRef(null)
  const staticGainRef = useRef(null)
  const noiseSourceRef = useRef(null)
  const masterGainRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [gain, setGain] = useState(50)
  const [frequency, setFrequency] = useState(50)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(17)
  const [audioReady, setAudioReady] = useState(false)
  const [audioError, setAudioError] = useState(false)

  // Puzzle target settings.
  const quality = Math.max(
    0,
    100 -
      Math.abs(gain - 64) * 0.8 -
      Math.abs(frequency - 72) * 0.7
  )

  const isRecovered = quality >= 96

  // Build the audio-processing graph once.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext

    if (!AudioContextClass) {
      setAudioError(true)
      return
    }

    const context = new AudioContextClass()

    const voiceSource = context.createMediaElementSource(audio)
    const filter = context.createBiquadFilter()
    const voiceGain = context.createGain()

    // A low-pass filter gives the frequency slider a real effect.
    filter.type = 'lowpass'
    filter.frequency.value = 6150

    // Create the voice processing chain.
    voiceSource.connect(filter)
    filter.connect(voiceGain)

    // Generate continuous radio hiss in memory.
    const bufferLength = context.sampleRate * 2
    const noiseBuffer = context.createBuffer(
      1,
      bufferLength,
      context.sampleRate
    )

    const noiseData = noiseBuffer.getChannelData(0)

    for (let i = 0; i < bufferLength; i++) {
      noiseData[i] = Math.random() * 2 - 1
    }

    const noiseSource = context.createBufferSource()
    noiseSource.buffer = noiseBuffer
    noiseSource.loop = true

    // Filter the noise to make it sound more like radio hiss.
    const noiseFilter = context.createBiquadFilter()
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.value = 1000

    const staticGain = context.createGain()
    staticGain.gain.value = 0

    // Both voice and static pass through the master output.
    const masterGain = context.createGain()
    masterGain.gain.value = 0.8

    voiceGain.connect(masterGain)
    noiseSource.connect(noiseFilter)
    noiseFilter.connect(staticGain)
    staticGain.connect(masterGain)
    masterGain.connect(context.destination)

    noiseSource.start()

    contextRef.current = context
    voiceGainRef.current = voiceGain
    filterRef.current = filter
    staticGainRef.current = staticGain
    noiseSourceRef.current = noiseSource
    masterGainRef.current = masterGain

    return () => {
      try {
        noiseSource.stop()
        voiceSource.disconnect()
        filter.disconnect()
        voiceGain.disconnect()
        noiseSource.disconnect()
        noiseFilter.disconnect()
        staticGain.disconnect()
        masterGain.disconnect()
      } catch {
        // Nodes may already be disconnected.
      }

      context.close()
    }
  }, [])

  // Update the voice and static in response to the sliders.
  useEffect(() => {
    const context = contextRef.current
    const voiceGain = voiceGainRef.current
    const filter = filterRef.current
    const staticGain = staticGainRef.current

    if (!context || !voiceGain || !filter || !staticGain) return

    const now = context.currentTime

    // Voice volume: slider 0–100 maps to 0–1.
    voiceGain.gain.setTargetAtTime(
      gain / 100,
      now,
      0.04
    )

    // Frequency: 300–12000 Hz.
    // Higher settings let more high-frequency speech detail through.
    const cutoff = 300 + (frequency / 100) * 11700

    filter.frequency.setTargetAtTime(
      cutoff,
      now,
      0.04
    )

    // Static is loudest when the settings are far from the solution.
    // It fades as the player gets closer to the intended settings.
    const staticLevel = 0.13 * (1 - quality / 100)

    staticGain.gain.setTargetAtTime(
      staticLevel,
      now,
      0.08
    )
  }, [gain, frequency, quality, audioReady])

  // Keep playback time and duration in sync.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)

    const updateDuration = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const handleCanPlay = () => {
      setAudioReady(true)
      setAudioError(false)
    }

    const handleError = () => {
      setAudioReady(false)
      setAudioError(true)
      setIsPlaying(false)
    }

    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('durationchange', updateDuration)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)
    audio.addEventListener('ended', handleEnded)

    if (audio.readyState >= 2) handleCanPlay()
    if (Number.isFinite(audio.duration)) updateDuration()

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('durationchange', updateDuration)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  async function togglePlayback() {
    const audio = audioRef.current
    const context = contextRef.current

    if (!audio || !context) {
      setAudioError(true)
      return
    }

    try {
      if (context.state === 'suspended') {
        await context.resume()
      }

      if (audio.paused) {
        await audio.play()
        setIsPlaying(true)
      } else {
        audio.pause()
        setIsPlaying(false)
      }
    } catch (error) {
      console.error('Audio playback failed:', error)
      setAudioError(true)
      setIsPlaying(false)
    }
  }

  function seekAudio(event) {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) return

    const nextTime = Number(event.target.value)
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  return (
    <main className="audio-game">
      <header className="audio-header">
        <span>221B / AUDIO EVIDENCE</span>
        <span>FILE / 002</span>
      </header>

      <section className="audio-intro">
        <p className="eyebrow">SIGNAL RECOVERY</p>

        <h1>
          CLEAN
          <br />
          <em>THE AUDIO.</em>
        </h1>

        <p className="instructions">
          This recording has been corrupted by interference.
          Adjust the controls until the voice becomes clear.
        </p>
      </section>

      <section className="editor">
        <div className="editor-label">
          <span>AUDIO SIGNAL</span>
          <span>REC / 002</span>
        </div>

        <audio
          ref={audioRef}
          src="/Audio cleaner audio.m4a"
          preload="auto"
        />

        <div className="waveform">
          {WAVEFORM.map((height, index) => (
            <div
              key={index}
              className={`wave-bar ${isPlaying ? 'playing' : ''}`}
              style={{
                height: `${height}%`,
                animationDelay: `${index * 0.025}s`,
              }}
            />
          ))}
        </div>

        <div className="player">
          <button
            className="play-button"
            onClick={togglePlayback}
            aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
          >
            {isPlaying ? 'Ⅱ' : '▶'}
          </button>

          <div className="timeline">
            <input
              type="range"
              min="0"
              max={duration || 17}
              step="0.1"
              value={Math.min(currentTime, duration || 17)}
              onChange={seekAudio}
              aria-label="Seek recording"
              style={{
                width: '100%',
                accentColor: '#3a75d8',
                cursor: 'pointer',
              }}
            />

            <div className="time">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="controls">
          <div className="control">
            <div className="control-header">
              <span>GAIN</span>
              <span>{gain}</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={gain}
              onChange={(event) => setGain(Number(event.target.value))}
              aria-label="Gain"
            />

            <div className="range-labels">
              <span>LOW</span>
              <span>HIGH</span>
            </div>
          </div>

          <div className="control">
            <div className="control-header">
              <span>FREQUENCY</span>
              <span>{frequency}</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={frequency}
              onChange={(event) => setFrequency(Number(event.target.value))}
              aria-label="Frequency"
            />

            <div className="range-labels">
              <span>LOW</span>
              <span>HIGH</span>
            </div>
          </div>
        </div>

        <div className="signal">
          <div className="signal-header">
            <span>SIGNAL QUALITY</span>
            <span>{Math.round(quality)}%</span>
          </div>

          <div className="signal-track">
            <div
              className="signal-fill"
              style={{ width: `${quality}%` }}
            />
          </div>
        </div>

        <div className="status">
          <span
            className="status-dot"
            style={{
              background: isRecovered ? '#69c99a' : '#c56a5b',
              boxShadow: isRecovered
                ? '0 0 8px rgba(105, 201, 154, 0.4)'
                : '0 0 8px rgba(197, 106, 91, 0.4)',
            }}
          />

          <span>
            {audioError
              ? 'AUDIO ERROR — CHECK FILE'
              : !audioReady
                ? 'LOADING RECORDING'
                : isRecovered
                  ? 'SIGNAL RECOVERED — EVIDENCE RESTORED'
                  : 'INTERFERENCE DETECTED'}
          </span>
        </div>

        {isRecovered && (
          <div
            style={{
              margin: '22px',
              padding: '18px',
              border: '1px solid rgba(105, 201, 154, 0.35)',
              color: '#69c99a',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '10px',
              lineHeight: 1.8,
            }}
            role="status"
          >
            RECOVERY COMPLETE.
            <br />
            The recording has been restored.
          </div>
        )}
      </section>

      <footer className="audio-footer">
        <span>CASE / 221B</span>
        <span>AUDIO RESTORATION REQUIRED</span>
      </footer>
    </main>
  )
}

export default App
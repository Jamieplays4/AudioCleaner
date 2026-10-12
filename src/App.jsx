import { useState } from 'react'
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

function App() {
const [isPlaying, setIsPlaying] =
useState(false)

const [gain, setGain] =
useState(50)

const [frequency, setFrequency] =
useState(50)

/*
Temporary signal quality.

For now this is only visual.
We'll connect it to the puzzle
mechanics in the next step.

*/

const quality =
Math.max(
0,
100 -
Math.abs(gain - 64) * 0.8 -
Math.abs(frequency - 72) * 0.7
)

return ( <main className="audio-game">

  {/* HEADER */}

  <header className="audio-header">

    <span>
      221B / AUDIO EVIDENCE
    </span>

    <span>
      FILE / 002
    </span>

  </header>


  {/* INTRO */}

  <section className="audio-intro">

    <p className="eyebrow">
      SIGNAL RECOVERY
    </p>

    <h1>
      CLEAN
      <br />
      <em>THE AUDIO.</em>
    </h1>

    <p className="instructions">
      This recording has been
      corrupted by interference.
      Adjust the controls until
      the voice becomes clear.
    </p>

  </section>


  {/* EDITOR */}

  <section className="editor">

    <div className="editor-label">

      <span>
        AUDIO SIGNAL
      </span>

      <span>
        REC / 002
      </span>

    </div>


    {/* WAVEFORM */}

    <div className="waveform">

      {WAVEFORM.map(
        (height, index) => (

          <div
            key={index}
            className={
              `wave-bar ${
                isPlaying
                  ? 'playing'
                  : ''
              }`
            }
            style={{
              height:
                `${height}%`,
              animationDelay:
                `${index * 0.025}s`,
            }}
          />

        )
      )}

    </div>


    {/* PLAYER */}

    <div className="player">

      <button
        className="play-button"
        onClick={() =>
          setIsPlaying(
            !isPlaying
          )
        }
      >
        {isPlaying
          ? 'Ⅱ'
          : '▶'}
      </button>

      <div className="timeline">

        <div className="timeline-track">

          <div
            className="timeline-progress"
            style={{
              width:
                isPlaying
                  ? '42%'
                  : '18%',
            }}
          />

        </div>

        <div className="time">

          <span>
            00:00
          </span>

          <span>
            00:17
          </span>

        </div>

      </div>

    </div>


    {/* CONTROLS */}

    <div className="controls">

      {/* GAIN */}

      <div className="control">

        <div className="control-header">

          <span>
            GAIN
          </span>

          <span>
            {gain}
          </span>

        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={gain}
          onChange={(event) =>
            setGain(
              Number(
                event.target.value
              )
            )
          }
        />

        <div className="range-labels">

          <span>
            LOW
          </span>

          <span>
            HIGH
          </span>

        </div>

      </div>


      {/* FREQUENCY */}

      <div className="control">

        <div className="control-header">

          <span>
            FREQUENCY
          </span>

          <span>
            {frequency}
          </span>

        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={frequency}
          onChange={(event) =>
            setFrequency(
              Number(
                event.target.value
              )
            )
          }
        />

        <div className="range-labels">

          <span>
            LOW
          </span>

          <span>
            HIGH
          </span>

        </div>

      </div>

    </div>


    {/* SIGNAL QUALITY */}

    <div className="signal">

      <div className="signal-header">

        <span>
          SIGNAL QUALITY
        </span>

        <span>
          {Math.round(
            quality
          )}%
        </span>

      </div>

      <div className="signal-track">

        <div
          className="signal-fill"
          style={{
            width:
              `${quality}%`,
          }}
        />

      </div>

    </div>


    {/* STATUS */}

    <div className="status">

      <span className="status-dot" />

      <span>
        INTERFERENCE DETECTED
      </span>

    </div>

  </section>


  {/* FOOTER */}

  <footer className="audio-footer">

    <span>
      CASE / 221B
    </span>

    <span>
      AUDIO RESTORATION REQUIRED
    </span>

  </footer>

</main>

)
}

export default App

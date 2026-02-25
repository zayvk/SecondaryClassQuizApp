import { useLocation, useNavigate } from 'react-router-dom'

export default function ResultScreen() {
  const { state }  = useLocation()
  const navigate   = useNavigate()

  if (!state?.results) {
    navigate('/')
    return null
  }

  const { results, subjectId, selectedUnits } = state
  const score    = results.filter(r => r.correct).length
  const total    = results.length
  const skipped  = results.filter(r => r.skipped).length
  const pct      = total > 0 ? Math.round((score / total) * 100) : 0

  function getGrade() {
    if (pct >= 80) return { label: '🏆 Excellent!',    cls: 'grade-excellent' }
    if (pct >= 60) return { label: '👍 Good job!',     cls: 'grade-good'      }
    if (pct >= 40) return { label: '📚 Keep studying', cls: 'grade-average'   }
    return              { label: '💪 Keep trying!',   cls: 'grade-low'       }
  }

  const { label, cls } = getGrade()

  function retryQuiz() {
    navigate(`/quiz/${subjectId}`, {
      state: { selectedUnits, questionCount: total }
    })
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/')}>← Home</button>
      </div>

      {/* Score Card */}
      <div className={`score-card ${cls}`}>
        <div className="score-pct">{pct}%</div>
        <div className="score-fraction">{score} / {total} correct</div>
        {skipped > 0 && <div className="score-skipped">⚠️ {skipped} skipped</div>}
        <div className="score-label">{label}</div>
      </div>

      {/* Actions */}
      <div className="result-actions">
        <button className="btn btn-retry" onClick={retryQuiz}>
          🔄 Try Again
        </button>
        <button className="btn btn-units" onClick={() => navigate(`/subject/${subjectId}`)}>
          📚 Units
        </button>
      </div>

      {/* Review */}
      <div className="section-label" style={{ marginTop: 8 }}>Review Answers</div>
      <div className="review-list">
        {results.map((r, i) => (
          <div key={i} className={`review-card ${r.skipped ? 'review-skipped' : r.correct ? 'review-correct' : 'review-wrong'}`}>
            <p className="review-q">
              <span className="review-num">Q{i + 1}.</span>
              {r.question}
              {r.skipped && <span className="skipped-tag">skipped</span>}
            </p>
            {!r.skipped && (
              <>
                <p className="review-answer">
                  Your answer: <strong>{r.options[r.selected]}</strong>
                  {!r.correct && (
                    <span className="review-correct-ans"> · Correct: <strong>{r.options[r.answer]}</strong></span>
                  )}
                </p>
                <p className="review-explanation">{r.explanation}</p>
              </>
            )}
            {r.skipped && (
              <p className="review-answer">
                Correct answer: <strong>{r.options[r.answer]}</strong>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

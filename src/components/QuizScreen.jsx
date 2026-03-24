import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function QuizScreen() {
  const { categoryId, subjectId } = useParams()
  const { state }                 = useLocation()
  const navigate                  = useNavigate()
  const selectedUnits             = state?.selectedUnits ?? []
  const questionCount             = state?.questionCount ?? 10

  const [questions,  setQuestions]  = useState([])
  const [current,    setCurrent]    = useState(0)
  const [answers,    setAnswers]    = useState({})
  const [skipped,    setSkipped]    = useState(new Set())
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [showFinish, setShowFinish] = useState(false)
  const [showHint,   setShowHint]   = useState(false)

  useEffect(() => {
    async function load() {
      try {
        let allQuestions = []

        for (const unitId of selectedUnits) {
          const mod = await import(`../data/${categoryId}/${subjectId}/${unitId}.json`)
          allQuestions = allQuestions.concat(mod.default.questions)
        }

        const count = questionCount === 'All'
          ? allQuestions.length
          : Math.min(questionCount, allQuestions.length)

        setQuestions(shuffle(allQuestions).slice(0, count))
      } catch (e) {
        setError('Could not load questions. Please go back and try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="screen center">
      <div className="spinner" />
      <p className="muted">Loading questions...</p>
    </div>
  )

  if (error) return (
    <div className="screen center">
      <p className="error-msg">{error}</p>
      <button className="btn" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  )

  const q           = questions[current]
  const answered    = answers[current] !== undefined
  const isCorrect   = answered && answers[current] === q.answer
  const score       = Object.entries(answers).filter(([i, sel]) => questions[i] && sel === questions[i].answer).length

  function dotStatus(i) {
    if (i === current)            return 'dot-current'
    if (skipped.has(i))           return 'dot-skipped'
    if (answers[i] !== undefined)
      return answers[i] === questions[i].answer ? 'dot-correct' : 'dot-wrong'
    return 'dot-pending'
  }

  function handleSelect(index) {
    if (answered) return
    setAnswers(prev => ({ ...prev, [current]: index }))
    setShowHint(false)
    setSkipped(prev => {
      const next = new Set(prev)
      next.delete(current)
      return next
    })
  }

  function handleSkip() {
    if (answered) return
    setShowHint(false)
    setSkipped(prev => new Set([...prev, current]))
    moveNext()
  }

  function handleNext() {
    if (!answered) return
    setShowHint(false)
    moveNext()
  }

  function handlePrev() {
    if (current > 0) {
      setShowHint(false)
      setCurrent(current - 1)
    }
  }

  function moveNext() {
    const totalQ = questions.length
    for (let i = current + 1; i < totalQ; i++) {
      if (answers[i] === undefined) { setCurrent(i); return }
    }
    for (let i = 0; i < current; i++) {
      if (answers[i] === undefined) { setCurrent(i); return }
    }
    const allAnswered = questions.every((_, i) => answers[i] !== undefined)
    if (allAnswered) finishQuiz()
  }

  function handleEndQuiz() {
    const skippedCount    = [...skipped].filter(i => answers[i] === undefined).length
    const unansweredCount = questions.filter((_, i) => answers[i] === undefined && !skipped.has(i)).length
    if (skippedCount > 0 || unansweredCount > 0) {
      setShowFinish(true)
    } else {
      finishQuiz()
    }
  }

  function finishQuiz() {
    const results = questions.map((q, i) => ({
      question:    q.question,
      options:     q.options,
      answer:      q.answer,
      selected:    answers[i],
      explanation: q.explanation,
      correct:     answers[i] === q.answer,
      skipped:     answers[i] === undefined,
    }))
    navigate('/results', { state: { results, categoryId, subjectId, selectedUnits } })
  }

  const pendingCount = questions.filter((_, i) => answers[i] === undefined).length

  return (
    <div className="screen quiz-screen">

      {/* ── Top Bar ── */}
      <div className="quiz-topbar">
        <button className="back-btn" onClick={handleEndQuiz}>✕</button>
        <div className="dot-track">
          {questions.map((_, i) => (
            <span
              key={i}
              className={`dot ${dotStatus(i)}`}
              onClick={() => setCurrent(i)}
              title={`Question ${i + 1}`}
            />
          ))}
        </div>
        <div className="score-badge">{score} / {questions.length}</div>
      </div>

      {/* ── Skipped banner ── */}
      {skipped.size > 0 && (
        <div className="skipped-banner">
          ⚠️ {[...skipped].filter(i => answers[i] === undefined).length} skipped — keep going to come back to them
        </div>
      )}

      {/* ── Question ── */}
      <div className="question-wrap">
        <div className="question-meta">
          <span className="question-label">
            Question {current + 1}
            {skipped.has(current) && <span className="skipped-tag">skipped</span>}
          </span>
          {!answered && q.hint && (
            <button className="hint-btn" onClick={() => setShowHint(p => !p)}>
              💡 {showHint ? 'Hide Hint' : 'Hint'}
            </button>
          )}
        </div>
        <p className="question-text" dangerouslySetInnerHTML={{ __html: q.question }} />
        {showHint && !answered && q.hint && (
          <div className="hint-box">
            <span className="hint-icon">💡</span>
            <p className="hint-text" dangerouslySetInnerHTML={{ __html: q.hint }} />
          </div>
        )}
      </div>

      {/* ── Options ── */}
      <div className="options-list">
        {q.options.map((option, index) => {
          let cls = 'option-btn'
          if (answered) {
            if (index === q.answer)              cls += ' correct'
            else if (index === answers[current]) cls += ' wrong'
            else                                 cls += ' dimmed'
          }
          return (
            <button key={index} className={cls} onClick={() => handleSelect(index)}>
              <span className="option-letter">{['A','B','C','D'][index]}</span>
              <span className="option-text" dangerouslySetInnerHTML={{ __html: option }} />
              {answered && index === q.answer                              && <span className="option-tick">✓</span>}
              {answered && index === answers[current] && index !== q.answer && <span className="option-cross">✗</span>}
            </button>
          )
        })}
      </div>

      {/* ── Explanation ── */}
      {answered && (
        <div className={`explanation-box ${isCorrect ? 'expl-correct' : 'expl-wrong'}`}>
          <span className="expl-icon">{isCorrect ? '✅' : '❌'}</span>
          <p className="expl-text" dangerouslySetInnerHTML={{ __html: q.explanation }} />
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <div className="quiz-bottom">
        <button className="nav-btn" onClick={handlePrev} disabled={current === 0}>
          ← Prev
        </button>
        {!answered && (
          <button className="nav-btn skip-btn" onClick={handleSkip}>Skip ⇥</button>
        )}
        {answered && pendingCount > 0 && (
          <button className="nav-btn next-btn" onClick={handleNext}>Next →</button>
        )}
        {answered && pendingCount === 0 && (
          <button className="nav-btn finish-btn" onClick={finishQuiz}>Finish ✓</button>
        )}
        <button className="nav-btn end-btn" onClick={handleEndQuiz}>End</button>
      </div>

      {/* ── Confirm End Dialog ── */}
      {showFinish && (
        <div className="modal-overlay" onClick={() => setShowFinish(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">End Quiz?</h2>
              <p className="modal-subject" style={{ marginTop: 8 }}>
                You still have {pendingCount} unanswered question{pendingCount !== 1 ? 's' : ''}.
                Ending now will mark them as skipped.
              </p>
            </div>
            <button className="btn-start" onClick={finishQuiz}>Yes, End Quiz</button>
            <button className="modal-cancel" onClick={() => setShowFinish(false)}>Keep Going</button>
          </div>
        </div>
      )}
    </div>
  )
}

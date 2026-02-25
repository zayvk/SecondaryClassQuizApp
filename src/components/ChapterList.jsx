import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import subjects from '../data/subjects.json'

const QUESTION_OPTIONS = [10, 15, 20, 'All']

export default function ChapterList() {
  const { subjectId }                 = useParams()
  const navigate                      = useNavigate()
  const subject                       = subjects.find(s => s.id === subjectId)
  const [selected, setSelected]       = useState([])   // array of unit ids
  const [showModal, setShowModal]     = useState(false)
  const [qCount,    setQCount]        = useState(10)

  if (!subject) return <div className="screen"><p>Subject not found.</p></div>

  function toggleUnit(unitId) {
    setSelected(prev =>
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    )
  }

  function toggleAll() {
    if (selected.length === subject.unitList.length) {
      setSelected([])
    } else {
      setSelected(subject.unitList.map(u => u.id))
    }
  }

  function openModal() {
    setQCount(10)
    setShowModal(true)
  }

  function startQuiz() {
    navigate(`/quiz/${subjectId}`, {
      state: {
        selectedUnits: selected,
        questionCount: qCount,
      }
    })
  }

  const allSelected  = selected.length === subject.unitList.length
  const noneSelected = selected.length === 0

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <span className="top-bar-title">{subject.icon} {subject.name}</span>
      </div>

      {/* Select All row */}
      <div className="select-all-row">
        <label className="select-all-label" onClick={toggleAll}>
          <span className={`checkbox ${allSelected ? 'checkbox-checked' : ''}`}>
            {allSelected && <span className="checkbox-tick">✓</span>}
          </span>
          <span className="select-all-text">
            {allSelected ? 'Deselect All' : 'Select All Units'}
          </span>
        </label>
        {!noneSelected && (
          <span className="selected-count">{selected.length} selected</span>
        )}
      </div>

      <div className="section-label">Choose units</div>

      <div className="unit-list">
        {subject.unitList.map((unit, index) => {
          const isSelected = selected.includes(unit.id)
          return (
            <button
              key={unit.id}
              className={`unit-card ${isSelected ? 'unit-selected' : ''}`}
              onClick={() => toggleUnit(unit.id)}
            >
              <span className={`checkbox ${isSelected ? 'checkbox-checked' : ''}`}>
                {isSelected && <span className="checkbox-tick">✓</span>}
              </span>
              <span className="unit-number">{index + 1}</span>
              <span className="unit-name">{unit.name}</span>
            </button>
          )
        })}
      </div>

      {/* Floating Start Button */}
      {!noneSelected && (
        <div className="start-bar">
          <button className="btn-start-quiz" onClick={openModal}>
            Start Quiz with {selected.length} unit{selected.length > 1 ? 's' : ''} →
          </button>
        </div>
      )}

      {/* Quiz Setup Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <p className="modal-subject">{subject.icon} {subject.name}</p>
              <h2 className="modal-title">
                {selected.length === subject.unitList.length
                  ? 'All Units'
                  : selected.length === 1
                  ? subject.unitList.find(u => u.id === selected[0])?.name
                  : `${selected.length} Units Mixed`}
              </h2>
            </div>

            <div className="modal-section-label">How many questions?</div>
            <div className="qcount-grid">
              {QUESTION_OPTIONS.map(opt => (
                <button
                  key={opt}
                  className={`qcount-btn ${qCount === opt ? 'qcount-active' : ''}`}
                  onClick={() => setQCount(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>

            <button className="btn-start" onClick={startQuiz}>
              Start Quiz →
            </button>
            <button className="modal-cancel" onClick={() => setShowModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

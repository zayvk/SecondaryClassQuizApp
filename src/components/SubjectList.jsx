import { useNavigate, useParams } from 'react-router-dom'
import allSubjects from '../data/subjects.json'

export default function SubjectList() {
  const { categoryId } = useParams()
  const navigate       = useNavigate()

  const category = allSubjects[categoryId]
  const subjects = category?.subjects ?? []

  if (!category) return (
    <div className="screen center">
      <p className="error-msg">Category not found.</p>
      <button className="btn" onClick={() => navigate('/')}>Go Home</button>
    </div>
  )

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <span className="top-bar-title">{category.label}</span>
      </div>

      <div className="hero" style={{ paddingTop: 28 }}>
        <h1 className="hero-title">Subjects</h1>
        <p className="hero-sub">Pick a subject to start practising</p>
      </div>

      <div className="card-grid">
        {subjects.map(subject => (
          <button
            key={subject.id}
            className="subject-card"
            onClick={() => navigate(`/category/${categoryId}/subject/${subject.id}`)}
          >
            <span className="subject-icon">{subject.icon}</span>
            <div className="subject-info">
              <span className="subject-name">{subject.name}</span>
              <span className="subject-units">{subject.units} units</span>
            </div>
            <span className="subject-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

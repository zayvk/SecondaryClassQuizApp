import { useNavigate } from 'react-router-dom'
import subjects from '../data/subjects.json'

export default function SubjectList() {
  const navigate = useNavigate()

  return (
    <div className="screen">
      <div className="hero">
        <div className="hero-badge">Cambridge · Grade 9</div>
        <h1 className="hero-title">Quiz App</h1>
        <p className="hero-sub">Pick a subject to start practising</p>
      </div>

      <div className="card-grid">
        {subjects.map(subject => (
          <button
            key={subject.id}
            className="subject-card"
            onClick={() => navigate(`/subject/${subject.id}`)}
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

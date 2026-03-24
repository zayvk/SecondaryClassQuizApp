import { useNavigate } from 'react-router-dom'
import subjects from '../data/subjects.json'

export default function SubjectList() {
  const navigate = useNavigate()

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <span className="top-bar-title">🎓 Cambridge · Grade 9</span>
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

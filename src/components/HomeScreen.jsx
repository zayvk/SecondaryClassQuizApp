import { useNavigate } from 'react-router-dom'

const categories = [
  {
    id: 'grade9',
    label: 'Cambridge · Grade 9',
    title: 'Secondary School',
    description: 'Mathematics, Science, Geography and more',
    icon: '🎓',
    color: '#7c6fff',
    available: true,
  },
  {
    id: 'mbbs',
    label: 'Medical · MBBS',
    title: 'Medical School',
    description: 'Anatomy, Physiology, Biochemistry and more',
    icon: '🏥',
    color: '#2dd4a0',
    available: false,
  },
  {
    id: 'cs',
    label: 'Engineering · CS',
    title: 'Computer Science',
    description: 'OOP, Data Structures, Algorithms and more',
    icon: '💻',
    color: '#ff6b8a',
    available: true,
  },
]

export default function HomeScreen() {
  const navigate = useNavigate()

  function handleSelect(cat) {
    if (!cat.available) return
    navigate(`/category/${cat.id}`)
  }

  return (
    <div className="screen">
      <div className="hero">
        <div className="hero-badge">Study · Practice · Excel</div>
        <h1 className="hero-title">Quiz App</h1>
        <p className="hero-sub">Choose your study level to get started</p>
      </div>

      <div className="category-grid">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-tile ${!cat.available ? 'category-locked' : ''}`}
            onClick={() => handleSelect(cat)}
            style={{ '--cat-color': cat.color }}
          >
            <div className="category-tile-glow" />
            <span className="category-tile-icon">{cat.icon}</span>
            <span className="category-tile-title">{cat.title}</span>
            <span className="category-tile-label">{cat.label}</span>
            <span className="category-tile-desc">{cat.description}</span>
            {!cat.available && <span className="category-tile-soon">Coming Soon</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

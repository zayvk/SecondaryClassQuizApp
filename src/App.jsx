import { Routes, Route } from 'react-router-dom'
import SubjectList from './components/SubjectList'
import ChapterList from './components/ChapterList'
import QuizScreen from './components/QuizScreen'
import ResultScreen from './components/ResultScreen'

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/"                    element={<SubjectList />} />
        <Route path="/subject/:subjectId"  element={<ChapterList />} />
        <Route path="/quiz/:subjectId"     element={<QuizScreen />} />
        <Route path="/results"             element={<ResultScreen />} />
      </Routes>
    </div>
  )
}

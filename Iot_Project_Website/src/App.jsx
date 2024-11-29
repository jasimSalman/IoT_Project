import './App.css'
import Login from './components/login/login'
import Product from './components/product/product'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Product />} />
      </Routes>
    </Router>
  )
}

export default App

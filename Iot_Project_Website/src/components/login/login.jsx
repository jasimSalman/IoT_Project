// src/Login.js
import React, { useState } from 'react'
import credentials from '../../credentials'
import './login.css'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate() // Hook to navigate programmatically

  const handleLogin = (e) => {
    e.preventDefault()
    // Validate credentials
    if (
      username === credentials.username &&
      password === credentials.password
    ) {
      navigate('/dashboard') // Redirect to dashboard
    } else {
      setErrorMessage('Invalid username or password')
    }
  }

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        {errorMessage && <p className="error">{errorMessage}</p>}

        <button type="submit" className="login-button">
          Login
        </button>
      </form>
    </div>
  )
}

export default Login

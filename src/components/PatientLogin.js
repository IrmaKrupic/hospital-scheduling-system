import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function PatientLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await api.patientLogin(formData.username, formData.password);
      if (data.success) {
        login(data.patient, 'patient');
        navigate('/patient/departments');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="container">
      <header className="main-header">
        <h1><i className="fas fa-heartbeat"></i> Hospital Scheduling System <i className="fas fa-heartbeat"></i></h1>
      </header>

      <main className="container">
        <div className="patient-login">
          <button className="back-btn" onClick={() => navigate('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            Back to Beginning
          </button>

          <div className="login-card">
            <h2>Patient Login</h2>
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && <div className="error-message" style={{display: 'block'}}>{error}</div>}

              <button type="submit" className="login-btn">Login</button>

              <div className="signin-option">
                <p>Don't have an account? <Link to="/patient/signup">Sign Up</Link></p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PatientLogin;

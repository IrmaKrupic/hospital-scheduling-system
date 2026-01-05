import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function DoctorSignup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    department: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    try {
      const data = await api.doctorSignup(formData.username, formData.password, formData.department);
      if (data.success) {
        login(data.doctor, 'doctor');
        navigate('/doctor/dashboard');
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during signup');
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
        <div className="doctor-signup">
          <button className="back-btn" onClick={() => navigate('/login')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            Back to Login
          </button>

          <div className="login-card">
            <h2>Doctor Sign Up</h2>
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Choose a username"
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

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="department">Department</label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select your department</option>
                  <option value="Family Medicine">Family Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Gynecology">Gynecology</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Dentistry">Dentistry</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Neurology">Neurology</option>
                </select>
              </div>

              {error && <div className="error-message" style={{display: 'block'}}>{error}</div>}

              <button type="submit" className="login-btn">Sign Up</button>

              <div className="signin-option">
                <p>Already have an account? <Link to="/login">Login</Link></p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DoctorSignup;

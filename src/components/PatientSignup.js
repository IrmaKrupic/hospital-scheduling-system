import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function PatientSignup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    firstname: '',
    lastname: '',
    dob: '',
    cardid: '',
    cardexpiry: '',
    password: '',
    confirmPassword: ''
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
      const { confirmPassword, ...patientData } = formData;
      const data = await api.patientSignup(patientData);
      if (data.success) {
        login(data.patient, 'patient');
        navigate('/patient/departments');
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
        <div className="patient-signup">
          <button className="back-btn" onClick={() => navigate('/patient/login')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            Back to Login
          </button>

          <div className="login-card">
            <h2>Patient Sign Up</h2>
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input type="text" id="username" name="username" placeholder="Choose a username"
                  value={formData.username} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="firstname">First Name</label>
                <input type="text" id="firstname" name="firstname" placeholder="Enter your first name"
                  value={formData.firstname} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="lastname">Last Name</label>
                <input type="text" id="lastname" name="lastname" placeholder="Enter your last name"
                  value={formData.lastname} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="dob">Date of Birth</label>
                <input type="date" id="dob" name="dob"
                  value={formData.dob} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="cardid">ID Card Number</label>
                <input type="text" id="cardid" name="cardid" placeholder="e.g., 123456789"
                  value={formData.cardid} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="cardexpiry">Card Expiry Date</label>
                <input type="date" id="cardexpiry" name="cardexpiry"
                  value={formData.cardexpiry} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" placeholder="Enter your password"
                  value={formData.password} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Re-enter your password"
                  value={formData.confirmPassword} onChange={handleChange} required />
              </div>

              {error && <div className="error-message" style={{display: 'block'}}>{error}</div>}

              <button type="submit" className="login-btn">Sign Up</button>

              <div className="signin-option">
                <p>Already have an account? <Link to="/patient/login">Login</Link></p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PatientSignup;

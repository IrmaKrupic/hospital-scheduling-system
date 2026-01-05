import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await api.unifiedLogin(formData.username, formData.password);
      if (data.success) {
        login(data.user, data.userType);
        // Redirect based on user type
        if (data.userType === 'doctor') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/patient/departments');
        }
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-br from-blue-800 to-blue-900 dark:from-gray-900 dark:to-gray-800 text-white py-8 px-8 shadow-lg z-[9999]">
        <h1 className="text-center text-3xl font-bold tracking-wide">
          <i className="fas fa-heartbeat"></i> Hospital Scheduling System <i className="fas fa-heartbeat"></i>
        </h1>
      </header>

      <main className="container mx-auto px-4 py-8 pt-32">
        <div className="max-w-md mx-auto">
          <button 
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
            onClick={() => navigate('/')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            Back to Home
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900 border-2 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Login
              </button>

              <div className="text-center text-gray-600 dark:text-gray-400">
                <p>Don't have an account? <Link to="/signup" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold">Sign Up</Link></p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;

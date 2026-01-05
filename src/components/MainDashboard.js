import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MainDashboard() {
  const navigate = useNavigate();
  const { user, userType } = useAuth();

  // If user is already logged in, redirect to appropriate dashboard
  React.useEffect(() => {
    if (user) {
      if (userType === 'doctor') {
        navigate('/doctor/dashboard');
      } else if (userType === 'patient') {
        navigate('/patient/dashboard');
      }
    }
  }, [user, userType, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-br from-blue-800 to-blue-900 dark:from-gray-900 dark:to-gray-800 text-white py-8 px-8 shadow-lg z-[9999]">
        <h1 className="text-center text-3xl font-bold tracking-wide">
          <i className="fas fa-heartbeat"></i> Hospital Scheduling System <i className="fas fa-heartbeat"></i>
        </h1>
      </header>

      <main className="container mx-auto px-4 py-8 pt-32">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">Welcome!</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Please login or sign up to continue</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <button 
              className="flex flex-col items-center justify-center gap-4 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transform hover:-translate-y-1"
              onClick={() => navigate('/login')}
            >
              <svg className="w-16 h-16 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"></path>
              </svg>
              <span className="text-xl font-semibold text-gray-800 dark:text-gray-200">Login</span>
            </button>

            <button 
              className="flex flex-col items-center justify-center gap-4 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transform hover:-translate-y-1"
              onClick={() => navigate('/signup')}
            >
              <svg className="w-16 h-16 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M19 8v6m3-3h-6"></path>
              </svg>
              <span className="text-xl font-semibold text-gray-800 dark:text-gray-200">Sign Up</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MainDashboard;

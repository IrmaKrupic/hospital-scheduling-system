import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function DepartmentSelection() {
  const navigate = useNavigate();
  const { user, selectDepartment, logout } = useAuth();

  const handleDepartmentSelect = (department) => {
    selectDepartment(department);
    navigate('/patient/dashboard');
  };

  const handleBackToLogin = () => {
    logout();
    navigate('/login');
  };

  const departments = [
    { name: 'Family Medicine', icon: 'fa-people-group' },
    { name: 'Pediatrics', icon: 'fa-baby' },
    { name: 'Gynecology', icon: 'fa-venus' },
    { name: 'Internal Medicine', icon: 'fa-heart-pulse' },
    { name: 'Dermatology', icon: 'fa-hand-dots' },
    { name: 'Dentistry', icon: 'fa-tooth' },
    { name: 'Laboratory', icon: 'fa-flask' },
    { name: 'Neurology', icon: 'fa-brain' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      <header className="w-full border-b border-blue-100/60 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center gap-3">
          <i className="fas fa-heartbeat text-rose-500 text-xl" aria-hidden="true"></i>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Hospital Scheduling System
          </h1>
          <i className="fas fa-heartbeat text-rose-500 text-xl" aria-hidden="true"></i>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Welcome, {user?.firstname || user?.username}!
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Select a Department
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {departments.map((dept) => (
            <button
              key={dept.name}
              onClick={() => handleDepartmentSelect(dept.name)}
              className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-blue-100/70 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <span className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-300">
                <i className={`fa-solid ${dept.icon} text-2xl sm:text-3xl`} aria-hidden="true"></i>
              </span>
              <span className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 text-center">
                {dept.name}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-10">
          <button
            onClick={handleBackToLogin}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
            Back to Login
          </button>
        </div>
      </main>
    </div>
  );
}

export default DepartmentSelection;

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
    <div className="container">
      <header className="main-header">
        <h1><i className="fas fa-heartbeat"></i> Hospital Scheduling System <i className="fas fa-heartbeat"></i></h1>
      </header>

      <main className="container">
        <div className="department-selection">
          <div className="container">
            <div className="dashboard-header">
              <h2>Welcome, {user?.firstname || user?.username}!<br />
                Select a Department</h2>
            </div>

            <div className="department-grid">
              {departments.map((dept) => (
                <button
                  key={dept.name}
                  className="department-btn"
                  onClick={() => handleDepartmentSelect(dept.name)}
                >
                  <i className={`fa-solid ${dept.icon}`} style={{ fontSize: '40px' }}></i>
                  <span>{dept.name}</span>
                </button>
              ))}
            </div>

            <button className="back-btn" onClick={handleBackToLogin}>
              Back to Login
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DepartmentSelection;

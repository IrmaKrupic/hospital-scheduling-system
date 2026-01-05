import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainDashboard from './components/MainDashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import DoctorDashboard from './components/DoctorDashboard';
import DepartmentSelection from './components/DepartmentSelection';
import PatientDashboard from './components/PatientDashboard';
import './App.css';

// Protected route component
function ProtectedRoute({ children, requiredUserType }) {
  const { user, userType } = useAuth();

  if (!user || (requiredUserType && userType !== requiredUserType)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainDashboard />} />
          
          {/* Unified Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Doctor Routes */}
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute requiredUserType="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Patient Routes */}
          <Route
            path="/patient/departments"
            element={
              <ProtectedRoute requiredUserType="patient">
                <DepartmentSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute requiredUserType="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />


          {/* Catch all - redirect to main */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;

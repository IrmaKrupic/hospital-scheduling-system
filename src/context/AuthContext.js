import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [userType, setUserType] = useState(() => localStorage.getItem('userType'));
  const [selectedDepartment, setSelectedDepartment] = useState(() => localStorage.getItem('selectedDepartment'));

  const login = (userData, type) => {
    setUser(userData);
    setUserType(type);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userType', type);
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    setSelectedDepartment(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('selectedDepartment');
  };

  const selectDepartment = (department) => {
    setSelectedDepartment(department);
    localStorage.setItem('selectedDepartment', department);
  };

  const value = {
    user,
    userType,
    selectedDepartment,
    login,
    logout,
    selectDepartment
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

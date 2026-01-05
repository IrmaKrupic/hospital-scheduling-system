import React from 'react';

function Sidebar({ activeView, onViewChange, userType, onLogout, onBackAction, additionalButtons = [] }) {
  const doctorButtons = [
    { id: 'calendar', label: 'Calendar', icon: 'calendar' },
    { id: 'appointments', label: 'My Appointments', icon: 'check' },
    { id: 'working-hours', label: 'Working Hours', icon: 'settings' },
    { id: 'print', label: 'Print Schedule', icon: 'print' },
    { id: 'darkmode', label: 'Dark Mode', icon: 'moon' }
  ];

  const patientButtons = [
    { id: 'booking', label: 'Book Appointment', icon: 'calendar' },
    { id: 'appointments', label: 'My Appointments', icon: 'check' },
    { id: 'print', label: 'Print Appointments', icon: 'print' },
    { id: 'darkmode', label: 'Dark Mode', icon: 'moon' }
  ];

  const buttons = userType === 'doctor' ? doctorButtons : patientButtons;

  const getIcon = (iconName) => {
    const icons = {
      calendar: (
        <>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </>
      ),
      check: (
        <>
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
        </>
      ),
      settings: (
        <>
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
        </>
      ),
      print: (
        <>
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </>
      ),
      moon: <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>,
      back: <path d="M19 12H5M12 19l-7-7 7-7"/>,
      logout: (
        <>
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </>
      )
    };
    return icons[iconName] || null;
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-blue-900 to-blue-800 dark:from-gray-900 dark:to-gray-800 text-white shadow-xl z-50">
      <nav className="flex flex-col h-full p-4 space-y-2">
        {buttons.map((btn) => (
          <button
            key={btn.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium
              ${activeView === btn.id 
                ? 'bg-blue-700 text-white shadow-lg' 
                : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
              }
            `}
            onClick={() => onViewChange(btn.id)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {getIcon(btn.icon)}
            </svg>
            {btn.label}
          </button>
        ))}

        {additionalButtons.map((btn, index) => (
          <button 
            key={`custom-${index}`} 
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-blue-100 hover:bg-blue-700/50 hover:text-white"
            onClick={btn.onClick}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {getIcon(btn.icon)}
            </svg>
            {btn.label}
          </button>
        ))}

        {onBackAction && (
          <button 
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-blue-100 hover:bg-blue-700/50 hover:text-white"
            onClick={onBackAction}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {getIcon('back')}
            </svg>
            {userType === 'doctor' ? 'Back to Login' : 'Back to Departments'}
          </button>
        )}

        <button 
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-white bg-purple-600 hover:bg-purple-700 mt-auto"
          onClick={onLogout}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {getIcon('logout')}
          </svg>
          Logout
        </button>
      </nav>
    </div>
  );
}

export default Sidebar;

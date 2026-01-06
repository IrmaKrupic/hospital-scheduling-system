import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Calendar from './Calendar';
import ConfirmModal from './ConfirmModal';
import api from '../services/api';

function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState(() => 
    localStorage.getItem(`doctorView_${user?.id}`) || 'calendar'
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [workingHours, setWorkingHours] = useState({
    workingDays: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '17:00',
    duration: 30
  });
  const [showModal, setShowModal] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });
  const [availableTimes, setAvailableTimes] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', appointmentId: null, message: '' });

  const loadWorkingHours = useCallback(async () => {
    if (user) {
      // Load working hours from user data (which comes from database)
      setWorkingHours({
        workingDays: user.workingDays || [1, 2, 3, 4, 5],
        startTime: user.startTime || '09:00',
        endTime: user.endTime || '17:00',
        duration: user.duration || 30
      });
      // Update user object in context after loading
      if (user && user.id) {
        try {
          // Fetch latest user data to ensure we have database values
          const appointmentsData = await api.getDoctorAppointments(user.id);
          // Working hours are already in user object from login
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    }
  }, [user]);

  const loadAppointments = useCallback(async () => {
    try {
      const data = await api.getDoctorAppointments(user.id);
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  }, [user]);

  const loadPatients = useCallback(async () => {
    try {
      const data = await api.getAllPatients();
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
    loadPatients();
    loadWorkingHours();
  }, [loadAppointments, loadPatients, loadWorkingHours]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleViewChange = (view) => {
    if (view === 'print') {
      setActiveView('appointments');
      setTimeout(() => window.print(), 100);
    } else if (view === 'darkmode') {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    } else {
      setActiveView(view);
      if (user?.id) localStorage.setItem(`doctorView_${user.id}`, view);
    }
  };

  // Load dark mode preference on mount
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateToDDMMYY = (dateString) => {
  try {
    const date = new Date(dateString);
    
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = String(date.getUTCFullYear()).slice(-2);
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return dateString;
  }
};

  const getAppointmentsForDate = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    const filtered = appointments.filter(apt => {
      
      let aptDate = apt.date;
      if (typeof aptDate === 'string') {
        const match = aptDate.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) {
          aptDate = match[1];
        }
      } else if (aptDate instanceof Date) {
        aptDate = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
      }
      
      return aptDate === dateStr;
    });
    
    return filtered;
  };

  const todaysAppointments = getAppointmentsForDate(selectedDate);

  const handleSaveWorkingHours = async (e) => {
    e.preventDefault();
    try {
      await api.updateDoctorWorkingHours(user.id, workingHours);
      Object.assign(user, workingHours);
      toast.success('Working hours updated successfully!');
    } catch (error) {
      console.error('Failed to update working hours:', error);
      toast.error('Failed to update working hours. Please try again.');
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    try {
      await api.updateAppointmentStatus(user.id, appointmentId, 'approved');
      await loadAppointments();
      toast.success('Appointment approved!');
    } catch (error) {
      console.error('Failed to approve appointment:', error);
      toast.error('Failed to approve appointment.');
    }
  };

  const handleRejectAppointment = (appointmentId) => {
    setConfirmModal({
      isOpen: true,
      type: 'reject',
      appointmentId,
      message: 'Are you sure you want to reject this appointment?'
    });
  };

  const handleDeleteAppointment = (appointmentId) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      appointmentId,
      message: 'Are you sure you want to delete this appointment? This action cannot be undone.'
    });
  };

  const handleConfirmAction = async () => {
    const { type, appointmentId } = confirmModal;
    
    if (type === 'reject') {
      try {
        await api.updateAppointmentStatus(user.id, appointmentId, 'rejected');
        await loadAppointments();
        toast.success('Appointment rejected.');
      } catch (error) {
        console.error('Failed to reject appointment:', error);
        toast.error('Failed to reject appointment.');
      }
    } else if (type === 'delete') {
      try {
        await api.deleteAppointment(user.id, appointmentId);
        await loadAppointments();
        toast.success('Appointment deleted.');
      } catch (error) {
        console.error('Failed to delete appointment:', error);
        toast.error('Failed to delete appointment.');
      }
    }
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setAppointmentDate(selectedDate);
    setModalMessage({ type: '', text: '' });

    if (selectedDate) {
      const selected = new Date(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selected < today) {
        setModalMessage({ type: 'error', text: 'You cannot select a date in the past. Please choose today or a future date.' });
        setAvailableTimes([]);
        return;
      }

      // Check if the selected date falls on a working day
      const dayOfWeek = selected.getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      if (!workingHours.workingDays.includes(dayOfWeek)) {
        setModalMessage({ 
          type: 'error', 
          text: `You don't work on this day. Working days: ${workingHours.workingDays.map(d => dayNames[d]).join(', ')}` 
        });
        setAvailableTimes([]);
        return;
      }

      // Generate available times
      const times = [];
      const startHour = parseInt(workingHours.startTime?.split(':')[0] || '9');
      const endHour = parseInt(workingHours.endTime?.split(':')[0] || '17');
      const duration = workingHours.duration || 30;

      // Check if selected date is today
      const isToday = selected.toDateString() === today.toDateString();
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();

      for (let hour = startHour; hour < endHour; hour++) {
        if (duration === 30) {
          // Skip past times if today
          if (!isToday || hour > currentHour || (hour === currentHour && 0 > currentMinute)) {
            times.push(`${String(hour).padStart(2, '0')}:00`);
          }
          if (!isToday || hour > currentHour || (hour === currentHour && 30 > currentMinute)) {
            times.push(`${String(hour).padStart(2, '0')}:30`);
          }
        } else if (duration === 60) {
          if (!isToday || hour > currentHour) {
            times.push(`${String(hour).padStart(2, '0')}:00`);
          }
        } else {
          // For other durations, generate slots based on duration
          let minutes = 0;
          while (minutes < 60 && (hour < endHour - 1 || (hour === endHour - 1 && minutes === 0))) {
            if (!isToday || hour > currentHour || (hour === currentHour && minutes > currentMinute)) {
              times.push(`${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
            }
            minutes += duration;
          }
        }
      }
      setAvailableTimes(times);
    }
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    setModalMessage({ type: '', text: '' });

    const patientId = document.getElementById('patient-select').value;
    const time = document.getElementById('appointment-time').value;
    const notes = document.getElementById('appointment-notes').value;

    if (!patientId || !time || !appointmentDate) {
      setModalMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    try {
      const appointmentData = {
        patientId,
        date: appointmentDate,
        time,
        notes
      };

      const result = await api.addAppointmentByDoctor(user.id, appointmentData);
      
      if (result.success) {
        setModalMessage({ type: 'success', text: 'Appointment added successfully!' });
        await loadAppointments();
        setTimeout(() => {
          setShowModal(false);
          setModalMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setModalMessage({ type: 'error', text: result.message || 'Failed to add appointment.' });
      }
    } catch (error) {
      setModalMessage({ type: 'error', text: error.message || 'An error occurred while adding the appointment.' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        userType="doctor"
        onLogout={handleLogout}
        onBackAction={handleBackToLogin}
      />

      <div className="flex-1 ml-64 p-8 pt-32">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-blue-800 dark:text-blue-300">Welcome, Dr. {user?.username}!</h2>
        </div>
        {activeView === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Calendar
              onDateSelect={handleDateSelect}
              appointments={appointments}
              workingDays={workingHours.workingDays}
            />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-300 mb-4">
                Appointments for <span className="text-gray-700 dark:text-gray-300">{formatDate(selectedDate)}</span>
              </h3>
              <button 
                className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mb-4"
                onClick={() => {
                  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                  setAppointmentDate(dateStr);
                  handleDateChange({ target: { value: dateStr } });
                  setShowModal(true);
                }}
              >
                + Add Appointment
              </button>
              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">
                {todaysAppointments.length > 0 ? (
                  todaysAppointments.map((apt, index) => (
                    <div key={index} className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <p className="mb-2"><strong className="text-gray-700 dark:text-gray-300">Patient:</strong> <span className="text-gray-900 dark:text-gray-100">{apt.patientName}</span></p>
                      <p className="mb-2"><strong className="text-gray-700 dark:text-gray-300">Time:</strong> <span className="text-gray-900 dark:text-gray-100">{apt.time}</span></p>
                      {apt.notes && <p className="mb-2"><strong className="text-gray-700 dark:text-gray-300">Notes:</strong> <span className="text-gray-900 dark:text-gray-100">{apt.notes}</span></p>}
                      <p className="mb-3">
                        <strong className="text-gray-700 dark:text-gray-300">Status:</strong>{' '}
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                          apt.status === 'approved' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                          apt.status === 'rejected' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                          'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        }`}>
                          {apt.status || 'pending'}
                        </span>
                      </p>
                      {apt.status === 'approved' ? (
                        <div className="flex gap-2 flex-wrap">
                          <button 
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                            onClick={() => handleDeleteAppointment(apt.id)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          <button 
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                            onClick={() => handleApproveAppointment(apt.id)}
                          >
                            Approve
                          </button>
                          <button 
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-semibold"
                            onClick={() => handleRejectAppointment(apt.id)}
                          >
                            Reject
                          </button>
                          <button 
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                            onClick={() => handleDeleteAppointment(apt.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">No appointments for this day</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'appointments' && (() => {
          const pendingAppointments = appointments.filter(apt => apt.status === 'pending' || !apt.status);
          const approvedAppointments = appointments.filter(apt => apt.status === 'approved');
          const rejectedAppointments = appointments.filter(apt => apt.status === 'rejected');
          
          const renderAppointmentCard = (apt, index) => (
            <div key={index} className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
              <p className="mb-2"><strong className="text-gray-700 dark:text-gray-300">Date:</strong> <span className="text-gray-900 dark:text-gray-100">{formatDateToDDMMYY(apt.date)}</span></p>
              <p className="mb-2"><strong className="text-gray-700 dark:text-gray-300">Time:</strong> <span className="text-gray-900 dark:text-gray-100">{apt.time}</span></p>
              <p className="mb-2"><strong className="text-gray-700 dark:text-gray-300">Patient:</strong> <span className="text-gray-900 dark:text-gray-100">{apt.patientName}</span></p>
              {apt.notes && <p className="mb-2"><strong className="text-gray-700 dark:text-gray-300">Notes:</strong> <span className="text-gray-900 dark:text-gray-100">{apt.notes}</span></p>}
              <p className="mb-3">
                <strong className="text-gray-700 dark:text-gray-300">Status:</strong>{' '}
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                  apt.status === 'approved' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                  apt.status === 'rejected' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                  'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                }`}>
                  {apt.status || 'pending'}
                </span>
              </p>
              {(apt.status === 'pending' || !apt.status) && (
                <div className="flex gap-2 flex-wrap">
                  <button 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                    onClick={() => handleApproveAppointment(apt.id)}
                  >
                    Approve
                  </button>
                  <button 
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-semibold"
                    onClick={() => handleRejectAppointment(apt.id)}
                  >
                    Reject
                  </button>
                  <button 
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                    onClick={() => handleDeleteAppointment(apt.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
              {apt.status === 'approved' && (
                <div className="flex gap-2 flex-wrap">
                  <button 
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                    onClick={() => handleDeleteAppointment(apt.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
              {apt.status === 'rejected' && (
                <div className="flex gap-2 flex-wrap">
                  <button 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                    onClick={() => handleApproveAppointment(apt.id)}
                  >
                    Approve
                  </button>
                  <button 
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                    onClick={() => handleDeleteAppointment(apt.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );

          return (
            <div className="space-y-8">
              {/* Pending Appointments */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-4">
                  Pending Approval ({pendingAppointments.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                  {pendingAppointments.length > 0 ? (
                    pendingAppointments.map((apt, index) => renderAppointmentCard(apt, index))
                  ) : (
                    <p className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-8">No pending appointments</p>
                  )}
                </div>
              </div>

              {/* Approved Appointments */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-4">
                  Approved Appointments ({approvedAppointments.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                  {approvedAppointments.length > 0 ? (
                    approvedAppointments.map((apt, index) => renderAppointmentCard(apt, index))
                  ) : (
                    <p className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-8">No approved appointments</p>
                  )}
                </div>
              </div>

              {/* Rejected Appointments */}
              {rejectedAppointments.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-2xl font-bold text-red-800 dark:text-red-300 mb-4">
                    Rejected Appointments ({rejectedAppointments.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                    {rejectedAppointments.map((apt, index) => renderAppointmentCard(apt, index))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {activeView === 'working-hours' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-4xl">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Set Working Hours & Available Days</h3>
            <form onSubmit={handleSaveWorkingHours} className="space-y-8">
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">Working Days</h4>
                <div className="grid grid-cols-7 gap-3">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => {
                    const isWorking = workingHours.workingDays.includes(index);
                    return (
                      <div
                        key={index}
                        className={`aspect-square flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer transition-all border-2 shadow-sm ${
                          isWorking 
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-700 text-white' 
                            : 'bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:shadow-md'
                        }`}
                        onClick={() => {
                          const newDays = isWorking
                            ? workingHours.workingDays.filter(d => d !== index)
                            : [...workingHours.workingDays, index];
                          setWorkingHours({ ...workingHours, workingDays: newDays });
                        }}
                      >
                        <div className="text-sm font-semibold mb-1">{day.substring(0, 3)}</div>
                        <div className="text-2xl font-bold">
                          {isWorking ? '✓' : '○'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">Working Hours</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="work-start-time" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      id="work-start-time"
                      value={workingHours.startTime}
                      onChange={(e) => setWorkingHours({ ...workingHours, startTime: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="work-end-time" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      id="work-end-time"
                      value={workingHours.endTime}
                      onChange={(e) => setWorkingHours({ ...workingHours, endTime: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">Appointment Duration</h4>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { value: 15, label: '15 min', icon: '⏱' },
                    { value: 30, label: '30 min', icon: '⏱' },
                    { value: 45, label: '45 min', icon: '⏱' },
                    { value: 60, label: '1 hour', icon: '⏰' }
                  ].map((option) => (
                    <div
                      key={option.value}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all border-2 shadow-sm ${
                        workingHours.duration === option.value
                          ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-600 text-white'
                          : 'bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:border-green-400 hover:shadow-md'
                      }`}
                      onClick={() => setWorkingHours({ ...workingHours, duration: option.value })}
                    >
                      <span className="text-3xl mb-2">{option.icon}</span>
                      <span className="text-base font-semibold">{option.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
              >
                Save Working Hours
              </button>
            </form>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 relative max-h-[90vh] overflow-y-auto">
            <button 
              className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl leading-none"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-6 text-center">Add Appointment</h3>
            {modalMessage.text && (
              <div className={`mb-4 px-4 py-3 rounded-lg ${
                modalMessage.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900 border-2 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300' 
                  : 'bg-red-50 dark:bg-red-900 border-2 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
              }`}>
                {modalMessage.text}
              </div>
            )}
            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                <input 
                  type="text" 
                  value={new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 
                  readOnly 
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-default text-gray-700 dark:text-gray-300"
                />
              </div>
              <div>
                <label htmlFor="patient-select" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Patient
                </label>
                <select 
                  id="patient-select" 
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select a patient...</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName || patient.firstname} {patient.lastName || patient.lastname}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="appointment-time" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Time
                </label>
                <select 
                  id="appointment-time" 
                  required 
                  disabled={availableTimes.length === 0}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select a time...</option>
                  {availableTimes.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="appointment-notes" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea 
                  id="appointment-notes" 
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-vertical bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Add Appointment
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, type: '', appointmentId: null, message: '' })}
          onConfirm={handleConfirmAction}
          title={confirmModal.type === 'delete' ? 'Delete Appointment' : 'Reject Appointment'}
          message={confirmModal.message}
          confirmText={confirmModal.type === 'delete' ? 'Delete' : 'Reject'}
          cancelText="Cancel"
          variant={confirmModal.type === 'delete' ? 'danger' : 'warning'}
        />
      )}
    </div>
  );
}

export default DoctorDashboard;

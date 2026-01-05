import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Calendar from './Calendar';
import ConfirmModal from './ConfirmModal';
import api from '../services/api';

function PatientDashboard() {
  const navigate = useNavigate();
  const { user, selectedDepartment, logout } = useAuth();
  const [activeView, setActiveView] = useState(() => 
    localStorage.getItem(`patientView_${user?.id}`) || 'booking'
  );
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState({
    doctorId: '',
    date: '',
    time: '',
    notes: ''
  });
  const [availableTimes, setAvailableTimes] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, appointmentId: null });

  const loadDoctors = useCallback(async () => {
    try {
      const data = await api.getDoctorsByDepartment(selectedDepartment);
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  }, [selectedDepartment]);

  const loadAppointments = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await api.getPatientAppointments(user.id);
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  }, [user]);

  useEffect(() => {
    if (selectedDepartment) {
      loadDoctors();
    }
    if (user?.id) {
      loadAppointments();
    }
  }, [selectedDepartment, user, loadDoctors, loadAppointments]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBackToDepartments = () => {
    navigate('/patient/departments');
  };

  const handleViewChange = (view) => {
    if (view === 'print') {
      window.print();
    } else if (view === 'darkmode') {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    } else {
      setActiveView(view);
      if (user?.id) localStorage.setItem(`patientView_${user.id}`, view);
    }
  };

  // Load dark mode preference on mount
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setMessage({ type: '', text: '' });

    // Check if date is in the past
    if (name === 'date' && value) {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        setMessage({ type: 'error', text: 'You cannot select a date in the past. Please choose today or a future date.' });
        setAvailableTimes([]);
        return;
      }
    }

    if ((name === 'doctorId' && value && formData.date) || (name === 'date' && formData.doctorId && value)) {
      generateAvailableTimes(name === 'doctorId' ? value : formData.doctorId, name === 'date' ? value : formData.date);
    }
  };

  const generateAvailableTimes = (doctorId, selectedDate) => {
    const selectedDoctor = doctors.find(doc => doc.id === doctorId);
    if (!selectedDoctor) {
      setAvailableTimes([]);
      return;
    }

    // Check if the selected date falls on a working day
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const workingDays = selectedDoctor.workingDays || [1, 2, 3, 4, 5]; // Default Mon-Fri

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (!workingDays.includes(dayOfWeek)) {
      setAvailableTimes([]);
      setMessage({ 
        type: 'error', 
        text: `Doctor is not available on this day. Working days: ${workingDays.map(d => dayNames[d]).join(', ')}` 
      });
      return;
    }

    const times = [];
    const startHour = parseInt(selectedDoctor.startTime?.split(':')[0] || '9');
    const endHour = parseInt(selectedDoctor.endTime?.split(':')[0] || '17');
    const duration = selectedDoctor.duration || 30;

    // Check if selected date is today
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

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
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!user?.id) {
      setMessage({ type: 'error', text: 'Session expired. Please log out and log back in.' });
      console.error('User object:', user);
      return;
    }

    try {
      const appointmentData = {
        doctorId: formData.doctorId,
        date: formData.date,
        time: formData.time,
        notes: formData.notes
      };

      const data = await api.bookAppointment(user.id, appointmentData);
      
      if (data.success) {
        toast.success('Appointment booked successfully! Waiting for doctor\'s approval!');
        setFormData({ doctorId: '', date: '', time: '', notes: '' });
        loadAppointments();
      } else {
        toast.error(data.message || 'Failed to book appointment');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    }
  };

  const handleCancelAppointment = (appointmentId) => {
    setConfirmModal({ isOpen: true, appointmentId });
  };

  const handleConfirmCancel = async () => {
    try {
      await api.cancelAppointment(user.id, confirmModal.appointmentId);
      loadAppointments();
      toast.success('Appointment cancelled successfully.');
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      toast.error('Failed to cancel appointment.');
    }
  };

  return (
    <div className="patient-dashboard">
      {/* Print-only view */}
      <div className="print-only">
        <div className="print-header">
          <h1>Hospital Scheduling System</h1>
          <h2>Appointment Schedule for {user?.firstName || user?.firstname} {user?.lastName || user?.lastname}</h2>
          <p className="print-date">Printed on: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <table className="print-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Doctor</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt, index) => (
              <tr key={index}>
                <td>{apt.date}</td>
                <td>{apt.time}</td>
                <td>Dr. {apt.doctorName}</td>
                <td>{apt.department}</td>
                <td>
                  {apt.status === 'pending' ? 'Waiting for Doctor\'s Approval' : 
                   apt.status === 'approved' ? 'Approved by Doctor' : 
                   apt.status === 'rejected' ? 'Rejected by Doctor' : 
                   'Waiting for Doctor\'s Approval'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Regular screen view */}
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        userType="patient"
        onLogout={handleLogout}
        onBackAction={handleBackToDepartments}
      />

      <div className="main-content">
        <div className="dashboard-greeting">
          <h2>Welcome, {user?.firstName || user?.firstname} {user?.lastName || user?.lastname}!</h2>
        </div>
        {activeView === 'booking' && (
          <div className="patient-dashboard-content">
            <h3>Book an Appointment</h3>
            <div className="booking-form-container">
              <form onSubmit={handleBookingSubmit} className="patient-booking-form">
                <div className="form-group">
                  <label htmlFor="doctorId">Select Doctor *</label>
                  <select
                    id="doctorId"
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a doctor...</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.username} - {doctor.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Appointment Date *</label>
                  <div className="calendar-wrapper">
                    <Calendar
                      onDateSelect={(date) => {
                        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        setFormData({ ...formData, date: dateStr });
                        if (formData.doctorId) {
                          generateAvailableTimes(formData.doctorId, dateStr);
                        }
                      }}
                      appointments={[]}
                      selectedDateStr={formData.date}
                    />
                  </div>
                </div>

                {formData.date && formData.doctorId && (
                  <div className="form-group full-width">
                    <label htmlFor="time">Appointment Time *</label>
                    <div className="time-slots-grid">
                      {availableTimes.length > 0 ? (
                        availableTimes.map(time => (
                          <button
                            key={time}
                            type="button"
                            className={`time-slot-btn ${formData.time === time ? 'selected' : ''}`}
                            onClick={() => setFormData({ ...formData, time })}
                          >
                            {time}
                          </button>
                        ))
                      ) : (
                        <p className="no-times-message">No available times for this date</p>
                      )}
                    </div>
                  </div>
                )}


                <div className="form-group full-width">
                  <label htmlFor="notes">Additional Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Describe your symptoms or reason for visit..."
                  ></textarea>
                </div>

                {message.text && (
                  <div className={`${message.type}-message full-width`} style={{ display: 'block' }}>
                    {message.text}
                  </div>
                )}

                <button type="submit" className="submit-booking-btn full-width">
                  Book Appointment
                </button>
              </form>
            </div>
          </div>
        )}

        {activeView === 'appointments' && (
          <div className="patient-my-appointments-view">
            <h3>My Appointments</h3>
            <div className="patient-appointments-list">
              {appointments.length > 0 ? (
                appointments.map((apt, index) => (
                  <div key={index} className={`appointment-card status-${apt.status || 'pending'}`}>
                    <p><strong>Doctor:</strong> Dr. {apt.doctorName}</p>
                    <p><strong>Department:</strong> {apt.department}</p>
                    <p><strong>Date:</strong> {apt.date}</p>
                    <p><strong>Time:</strong> {apt.time}</p>
                    {apt.notes && <p><strong>Notes:</strong> {apt.notes}</p>}
                    <p><strong>Status:</strong> <span className={`status-badge ${apt.status}`}>
                      {apt.status === 'pending' ? 'Waiting for Doctor\'s Approval' : 
                       apt.status === 'approved' ? 'Approved by Doctor' : 
                       apt.status === 'rejected' ? 'Rejected by Doctor' : 
                       'Waiting for Doctor\'s Approval'}
                    </span></p>
                    {apt.status !== 'rejected' && (
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancelAppointment(apt.id)}
                      >
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p>No appointments scheduled</p>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, appointmentId: null })}
        onConfirm={handleConfirmCancel}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment?"
        confirmText="Cancel Appointment"
        cancelText="Keep Appointment"
        variant="warning"
      />
    </div>
  );
}

export default PatientDashboard;

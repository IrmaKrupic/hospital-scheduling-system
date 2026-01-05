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
    <>
      {/* Print-only view */}
      <div className="hidden print:block p-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold">Hospital Scheduling System</h1>
          <h2 className="text-lg">
            Appointment Schedule for {user?.firstName || user?.firstname} {user?.lastName || user?.lastname}
          </h2>
          <p className="text-sm">
            Printed on: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left px-3 py-2">Date</th>
              <th className="text-left px-3 py-2">Time</th>
              <th className="text-left px-3 py-2">Doctor</th>
              <th className="text-left px-3 py-2">Department</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt, index) => (
              <tr key={index} className="border-b border-gray-200 text-sm">
                <td className="px-3 py-2">{apt.date}</td>
                <td className="px-3 py-2">{apt.time}</td>
                <td className="px-3 py-2">Dr. {apt.doctorName}</td>
                <td className="px-3 py-2">{apt.department}</td>
                <td className="px-3 py-2">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex print:hidden">
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          userType="patient"
          onLogout={handleLogout}
          onBackAction={handleBackToDepartments}
        />

        <div className="flex-1 ml-64 p-8 pt-16">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-blue-800 dark:text-blue-300">
            Welcome, {user?.firstName || user?.firstname} {user?.lastName || user?.lastname}!
          </h2>
        </div>

        {activeView === 'booking' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Book an Appointment</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calendar */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">Select Date</h4>
                <Calendar
                  onDateSelect={(date) => {
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    setFormData({ ...formData, date: dateStr });
                    if (formData.doctorId) {
                      generateAvailableTimes(formData.doctorId, dateStr);
                    }
                  }}
                  appointments={appointments}
                  selectedDateStr={formData.date}
                  workingDays={(doctors.find(d => d.id === formData.doctorId)?.workingDays) || null}
                />
              </div>

              {/* Form */}
              <form onSubmit={handleBookingSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-5">
                <div>
                  <label htmlFor="doctorId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Select Doctor *
                  </label>
                  <select
                    id="doctorId"
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select a doctor...</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.username} - {doctor.department}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.date && formData.doctorId && (
                  <div>
                    <label htmlFor="time" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Appointment Time *
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableTimes.length > 0 ? (
                        availableTimes.map((time) => (
                          <button
                            key={time}
                            type="button"
                            className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-colors ${
                              formData.time === time
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:border-blue-400'
                            }`}
                            onClick={() => setFormData({ ...formData, time })}
                          >
                            {time}
                          </button>
                        ))
                      ) : (
                        <p className="col-span-3 sm:col-span-4 text-gray-500 dark:text-gray-400">No available times for this date</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Describe your symptoms or reason for visit..."
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  ></textarea>
                </div>

                {message.text && (
                  <div
                    className={`px-4 py-3 rounded-lg border-2 ${
                      message.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
                        : 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300'
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Book Appointment
                </button>
              </form>
            </div>
          </div>
        )}

        {activeView === 'appointments' && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">My Appointments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.length > 0 ? (
                appointments.map((apt, index) => (
                  <div
                    key={index}
                    className={`p-4 border-2 rounded-lg bg-white dark:bg-gray-800 ${
                      apt.status === 'approved'
                        ? 'border-green-200 dark:border-green-700'
                        : apt.status === 'rejected'
                        ? 'border-red-200 dark:border-red-700'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <p className="mb-1"><strong className="text-gray-700 dark:text-gray-300">Doctor:</strong> <span className="text-gray-900 dark:text-gray-100">Dr. {apt.doctorName}</span></p>
                    <p className="mb-1"><strong className="text-gray-700 dark:text-gray-300">Department:</strong> <span className="text-gray-900 dark:text-gray-100">{apt.department}</span></p>
                    <p className="mb-1"><strong className="text-gray-700 dark:text-gray-300">Date:</strong> <span className="text-gray-900 dark:text-gray-100">{apt.date}</span></p>
                    <p className="mb-3"><strong className="text-gray-700 dark:text-gray-300">Time:</strong> <span className="text-gray-900 dark:text-gray-100">{apt.time}</span></p>
                    {apt.notes && <p className="mb-3"><strong className="text-gray-700 dark:text-gray-300">Notes:</strong> <span className="text-gray-900 dark:text-gray-100">{apt.notes}</span></p>}
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
                    {apt.status !== 'rejected' && (
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                        onClick={() => handleCancelAppointment(apt.id)}
                      >
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-8">No appointments scheduled</p>
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
    </>
  );
}

export default PatientDashboard;

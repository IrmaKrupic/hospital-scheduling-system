// Use full URL - proxy should handle it, but explicit URL works better
// In development, React dev server proxy should forward /api/* to localhost:3009
// But if proxy doesn't work, this ensures API calls go directly to backend
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : 'http://localhost:3009';

class ApiService {
  async post(url, data) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async get(url) {
    const response = await fetch(`${API_BASE_URL}${url}`);
    return this.handleResponse(response);
  }

  async put(url, data) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async patch(url, data) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async delete(url) {
    const response = await fetch(`${API_BASE_URL}${url}`, { method: 'DELETE' });
    return this.handleResponse(response);
  }

  // Unified Authentication
  unifiedLogin(username, password) {
    return this.post('/api/login', { username, password });
  }

  unifiedSignup(signupData) {
    return this.post('/api/signup', signupData);
  }

  // Doctor Authentication (legacy support)
  doctorLogin(username, password) {
    return this.post('/api/doctor/login', { username, password });
  }

  doctorSignup(username, password, department) {
    return this.post('/api/doctor/signup', { username, password, department });
  }

  // Patient Authentication (legacy support)
  patientLogin(username, password) {
    return this.post('/api/patient/login', { username, password });
  }

  patientSignup(patientData) {
    return this.post('/api/patient/signup', patientData);
  }

  // Doctor Operations
  updateDoctorWorkingHours(doctorId, workingHoursData) {
    return this.put(`/api/doctor/${doctorId}/working-hours`, workingHoursData);
  }

  getDoctorAppointments(doctorId) {
    return this.get(`/api/doctor/${doctorId}/appointments`);
  }

  addAppointmentByDoctor(doctorId, appointmentData) {
    return this.post(`/api/doctor/${doctorId}/appointments`, appointmentData);
  }

  updateAppointmentStatus(doctorId, appointmentId, status) {
    return this.patch(`/api/doctor/${doctorId}/appointments/${appointmentId}`, { status });
  }

  deleteAppointment(doctorId, appointmentId) {
    return this.delete(`/api/doctor/${doctorId}/appointments/${appointmentId}`);
  }

  // Patient Operations
  getAllPatients() {
    return this.get('/api/patients');
  }

  getDoctorsByDepartment(department) {
    return this.get(`/api/doctors/department/${encodeURIComponent(department)}`);
  }

  getPatientAppointments(patientId) {
    return this.get(`/api/patient/${patientId}/appointments`);
  }

  bookAppointment(patientId, appointmentData) {
    return this.post(`/api/patient/${patientId}/appointments`, appointmentData);
  }

  cancelAppointment(patientId, appointmentId) {
    return this.delete(`/api/patient/${patientId}/appointments/${appointmentId}`);
  }

  async handleResponse(response) {
    // Check if response is HTML (error page) instead of JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      throw new Error(`Server error: Expected JSON but received ${contentType || 'unknown'}. Make sure the backend server is running on port 3001.`);
    }
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }
    return data;
  }
}

const api = new ApiService();
export default api;

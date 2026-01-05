import React, { useState } from 'react';

function Calendar({ onDateSelect, appointments = [], selectedDateStr = null, workingDays = null }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    if (selectedDateStr) {
      return new Date(selectedDateStr);
    }
    return new Date();
  });

  // Update selectedDate when selectedDateStr prop changes
  React.useEffect(() => {
    if (selectedDateStr) {
      setSelectedDate(new Date(selectedDateStr));
    }
  }, [selectedDateStr]);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    if (day) {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setSelectedDate(newDate);
      onDateSelect(newDate);
    }
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day) => {
    return day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const getAppointmentStatusForDay = (day) => {
    const toYmd = (value) => {
      if (!value) return null;
      if (typeof value === 'string') {
        const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) return match[1];
      }
      try {
        const d = new Date(value);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
      } catch {
        return null;
      }
    };
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayAppointments = appointments.filter(apt => toYmd(apt.date) === dateStr);
    if (dayAppointments.length === 0) return null;
    const hasApproved = dayAppointments.some(apt => apt.status === 'approved');
    const hasPending = dayAppointments.some(apt => apt.status === 'pending' || !apt.status);
    if (hasApproved) return 'approved';
    if (hasPending) return 'pending';
    return 'other';
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <h3 className="text-blue-800 dark:text-blue-300 mb-4 text-xl font-semibold">Calendar</h3>
      <div>
        <div className="flex justify-between items-center mb-4">
          <button 
            className="px-4 py-2 bg-blue-400 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-500 dark:hover:bg-blue-700 transition-colors text-xl font-semibold"
            onClick={handlePrevMonth}
          >
            &lt;
          </button>
          <h4 className="text-lg text-gray-800 dark:text-gray-200 font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
          <button 
            className="px-4 py-2 bg-blue-400 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-500 dark:hover:bg-blue-700 transition-colors text-xl font-semibold"
            onClick={handleNextMonth}
          >
            &gt;
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-2 font-semibold text-gray-600 dark:text-gray-400 text-sm">
              {day}
            </div>
          ))}
          {days.map((day, index) => (
            <div
              key={index}
              className={(() => {
                const base =
                  'aspect-square flex items-center justify-center p-2 border rounded-lg cursor-pointer transition-all text-sm dark:text-gray-200';
                if (!day) return `${base} border-transparent`;
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dayOfWeek = dateObj.getDay();
                const isNonWorking =
                  Array.isArray(workingDays) && !workingDays.includes(dayOfWeek);
                const apptStatus = getAppointmentStatusForDay(day);
                const todayCls = isToday(day)
                  ? 'border-2 border-blue-400 dark:border-blue-500 font-semibold'
                  : 'border-gray-300 dark:border-gray-600';
                const selectedCls = isSelected(day)
                  ? 'bg-blue-500 dark:bg-blue-600 text-white font-semibold'
                  : 'hover:bg-blue-50 dark:hover:bg-gray-700';
                const apptCls =
                  apptStatus === 'approved'
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700 font-semibold'
                    : apptStatus === 'pending'
                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700 font-semibold'
                    : '';
                const nonWorkCls = isNonWorking
                  ? 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/60'
                  : '';
                return [base, todayCls, selectedCls, apptCls, nonWorkCls].join(' ').trim();
              })()}
              onClick={() => handleDateClick(day)}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Calendar;

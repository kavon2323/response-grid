'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Filter,
} from 'lucide-react';
import { AddEventModal } from './modals/AddEventModal';

const eventTypeColors: Record<string, string> = {
  training: 'bg-blue-100 text-blue-700 border-blue-200',
  meeting: 'bg-purple-100 text-purple-700 border-purple-200',
  drill: 'bg-orange-100 text-orange-700 border-orange-200',
  maintenance: 'bg-gray-100 text-gray-700 border-gray-200',
  social: 'bg-green-100 text-green-700 border-green-200',
  other: 'bg-fire-100 text-fire-700 border-fire-200',
};

const eventTypes = [
  { value: '', label: 'All Types' },
  { value: 'training', label: 'Training' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'drill', label: 'Drill' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' },
];

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time?: string;
  location?: string;
  department_id: string;
}

interface CalendarClientProps {
  events: CalendarEvent[];
  departmentId: string;
  defaultUserId: string;
}

export function CalendarClient({ events, departmentId, defaultUserId }: CalendarClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState('');
  const router = useRouter();

  const filteredEvents = useMemo(() => {
    if (!filterType) return events;
    return events.filter((e) => e.event_type === filterType);
  }, [events, filterType]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter((e) => new Date(e.start_time) >= now)
      .slice(0, 5);
  }, [filteredEvents]);

  // Calendar grid helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [startingDayOfWeek, daysInMonth]);

  const getEventsForDay = (day: number) => {
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() === month &&
        eventDate.getDate() === day
      );
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">Schedule and manage department events</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Event
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500"
          >
            {eventTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">{monthName}</h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                return (
                  <div
                    key={index}
                    className={`min-h-[80px] p-1 border rounded-lg ${
                      day
                        ? isToday(day)
                          ? 'bg-fire-50 border-fire-300'
                          : 'border-gray-200 hover:bg-gray-50'
                        : 'border-transparent'
                    }`}
                  >
                    {day && (
                      <>
                        <span
                          className={`text-sm font-medium ${
                            isToday(day) ? 'text-fire-600' : 'text-gray-700'
                          }`}
                        >
                          {day}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs px-1 py-0.5 rounded truncate ${
                                eventTypeColors[event.event_type] ||
                                eventTypeColors.other
                              }`}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500 px-1">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-fire-600" />
              Upcoming Events
            </h2>
          </div>
          <div className="p-4">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {event.title}
                        </h3>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded capitalize ${
                            eventTypeColors[event.event_type] ||
                            eventTypeColors.other
                          }`}
                        >
                          {event.event_type}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatDate(event.start_time)} at{' '}
                          {formatTime(event.start_time)}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => router.refresh()}
        departmentId={departmentId}
        userId={defaultUserId}
      />
    </div>
  );
}

import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useState } from 'react'

export default function RapportCalendar({ selectedDate, onDateChange }) {
  return (
    <div>
      <Calendar
        onChange={onDateChange}
        value={selectedDate}
        locale="de-DE"
      />
    </div>
  )
}

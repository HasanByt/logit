import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useState } from 'react'

export default function RapportCalendar({ selectedDate, onDateChange, rapportTage = [] }) {
  return (
    <div>
      <Calendar
        onChange={onDateChange}
        value={selectedDate}
        locale="de-DE"
        tileClassName={({ date }) => {
          const tagAlsString = date.toDateString()
          if (rapportTage.includes(tagAlsString)) {
            return 'gruen-markiert'
          }
          return null
        }}
      />
    </div>
  )
}

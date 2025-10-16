import React from 'react'

const DayLookup = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]

const MonthLookup = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const DateSuffixLookup = [
  '',
  '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th',
  '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th',
  '21st', '22nd', '23rd', '24th', '25th', '26th', '27th', '28th', '29th', '30th',
  '31st'
]

/** @param {Date} date */
function formatDate (date: Date) {
  return `${DayLookup[date.getDay()]}, ${MonthLookup[date.getMonth()]} ${DateSuffixLookup[date.getDate()]} ${date.getFullYear()}, ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ${date.getHours() >= 12 ? 'p.m. ' : 'a.m.'}`
}

const EventDescription: React.FC<{
  event: string
  payload: Record<string, any>
  timestamp: number
}> = function ({
  event,
  payload,
  timestamp
}) {
  const formattedTime = formatDate(new Date(timestamp))
  const onARepo = payload.repository && payload.repository.full_name
  const onRepos = payload.repositories && payload.repositories.every(r => r.full_name)

  return (
    <div className='text-gray'>
      <p className='mb-0'>There was an <strong>{event}</strong> event received on <code>{formattedTime}</code>.</p>
      {onARepo && <p className='mt-0'>This event was sent by <strong>{payload.repository.full_name}</strong>.</p>}
      {onRepos && <p className='mt-0'>This event was triggered against: {payload.repositories.map(r => <span key={r.full_name}>{r.full_name}</span>)}.</p>}
    </div>
  )
}
export default EventDescription

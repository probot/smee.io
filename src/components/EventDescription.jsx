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
function formatDate (date) {
  return `${DayLookup[date.getDay()]}, ${MonthLookup[date.getMonth()]} ${DateSuffixLookup[date.getDate()]} ${date.getFullYear()}, ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ${date.getHours() >= 12 ? 'p.m. ' : 'a.m.'}`
}

export default function EventDescription ({
  event,
  body,
  timestamp
}) {
  const formattedTime = formatDate(new Date(timestamp))
  const onARepo = body.repository && body.repository.full_name
  const onRepos = body.repositories && body.repositories.every(r => r.full_name)

  return (
    <div className='text-gray'>
      <p className='mb-0'>There was a <strong>{event}</strong> event received on <span>{formattedTime}</span>.</p>
      {onARepo && <p className='mt-0'>This event was sent by <strong>{body.repository.full_name}</strong>.</p>}
      {onRepos && <p className='mt-0'>This event was triggered against: {body.repositories.map(r => <span key={r.full_name}>{r.full_name}</span>)}.</p>}
    </div>
  )
}

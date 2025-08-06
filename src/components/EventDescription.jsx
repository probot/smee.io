import React from 'react'
import { string, object, number } from 'prop-types'
import { format } from 'date-fns'

export default function EventDescription ({
  event,
  payload,
  timestamp
}) {
  const formattedTime = format(timestamp, 'EEEE, MMMM do yyyy, k:mm:ss aaaa')
  const onARepo = payload.repository && payload.repository.full_name
  const onRepos = payload.repositories && payload.repositories.every(r => r.full_name)

  return (
    <div className='text-gray'>
      <p className='mb-0'>There was a <strong>{event}</strong> event received on <code>{formattedTime}</code>.</p>
      {onARepo && <p className='mt-0'>This event was sent by <strong>{payload.repository.full_name}</strong>.</p>}
      {onRepos && <p className='mt-0'>This event was triggered against: {payload.repositories.map(r => <span key={r.full_name}>{r.full_name}</span>)}.</p>}
    </div>
  )
}

EventDescription.propTypes = {
  event: string,
  payload: object.isRequired,
  timestamp: number.isRequired
}

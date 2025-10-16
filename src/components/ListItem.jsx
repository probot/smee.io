import React, { Component } from 'react'
import ReactJson from '@microlink/react-json-view'
import EventIcon from './EventIcon.jsx'
import { KebabHorizontalIcon, PaperclipIcon, SyncIcon, PinIcon } from '@primer/octicons-react'
import EventDescription from './EventDescription.jsx'
import copy from 'copy-to-clipboard'

function formatDistance (time) {
  if (time < 30000) {
    return 'less than a minute'
  } else if (time < 90000) {
    return '1 minute'
  } else if (time < 2670000) {
    return `${~~(time / 60000)} minutes`
  } else if (time < 3570000) {
    return 'about 1 hour'
  } else if (time < 86370000) {
    return `${~~(time / 3600000)} hours`
  } else if (time < 151170000) {
    return 'about 1 day'
  } else if (time < 2591970000) {
    return `${~~(time / 86400000)} days`
  } else if (time < 3887970000) {
    return 'about 1 month'
  } else if (time < 5183970000) {
    return 'about 2 months'
  } else if (time < 31536000000) {
    return `${~~(time / 2592000000)} months`
  } else if (time < 39312000000) {
    return 'about 1 year'
  } else if (time < 54864000000) {
    return 'over 1 year'
  } else if (time < 63072000000) {
    return 'almost 2 years'
  } else {
    const years = ~~(time / 31536000000)
    const rest = time % 31536000000

    if (rest < 7776000000) {
      return `about ${years} years`
    } else if (rest < 23328000000) {
      return `over ${years} years`
    } else {
      return `almost ${years + 1} years`
    }
  }
}

export default class ListItem extends Component {
  constructor (props) {
    super(props)
    this.handleToggleExpanded = () => this.setState({ expanded: !this.state.expanded })
    this.handleCopy = this.handleCopy.bind(this)
    this.handleRedeliver = this.handleRedeliver.bind(this)
    this.state = { expanded: false, copied: false, redelivered: false }
  }

  handleCopy () {
    const { item } = this.props
    const event = { event: item['x-github-event'], payload: item.body }
    const copied = copy(JSON.stringify(event))
    this.setState({ copied })
  }

  handleRedeliver () {
    const { body, rawBody, query, timestamp, action, ...headers } = this.props.item

    const querystring = '?' + new URLSearchParams(query).toString()
    return window.fetch(`${window.location.pathname}${querystring}`, {
      method: 'POST',
      body: rawBody || JSON.stringify(body),
      headers
    }).then(res => {
      this.setState({ redelivered: res.status === 200 })
    })
  }

  render () {
    const { expanded, copied, redelivered } = this.state
    const { now, item, pinned, togglePinned } = this.props

    const { body, rawBody, query, timestamp, action, ...headers } = item
    const eventType = headers['x-github-event']
    const eventId = headers['x-github-delivery'] || timestamp

    return (
      <li>
        <div onClick={this.handleToggleExpanded} className='p-3 SelectMenu-item d-flex flex-items-center'>
          <div className='mr-2' style={{ width: 16 }}>
            <EventIcon event={eventType} action={action} />
          </div>
          <span className='input'>{eventId} {eventType}</span>
          <time className='f5' style={{ marginLeft: 'auto' }}>{formatDistance(now - timestamp)} ago</time>
          <button onClick={this.handleToggleExpanded} className='ellipsis-expander ml-2'><KebabHorizontalIcon height={12} /></button>
        </div>

        {expanded && (
          <div className='p-3'>
            <div className='d-flex flex-justify-between flex-items-start'>
              <div>
                <p><strong>Event ID:</strong> <code>{eventId}</code></p>
                <EventDescription event={eventType} body={body} timestamp={timestamp} />
              </div>

              <div className='d-flex ml-2'>
                <button
                  onClick={() => togglePinned(eventId)}
                  className={`btn btn-sm tooltipped tooltipped-s ${pinned && 'text-blue'}`}
                  aria-label='Pin this delivery'
                ><PinIcon />
                </button>
                <button
                  onBlur={() => this.setState({ copied: false })}
                  onClick={this.handleCopy}
                  className='ml-2 btn btn-sm tooltipped tooltipped-s js-copy-btn'
                  aria-label={copied ? 'Copied!' : 'Copy payload to clipboard'}
                ><PaperclipIcon />
                </button>
                <button
                  onBlur={() => this.setState({ redelivered: false })}
                  onClick={this.handleRedeliver}
                  className='ml-2 btn btn-sm tooltipped tooltipped-s js-redeliver-btn'
                  aria-label={redelivered ? 'Sent!' : 'Redeliver this payload'}
                ><SyncIcon />
                </button>
              </div>
            </div>
            <hr className='mt-3' />
            <div className='mt-3'>
              <h5 className='mb-2'>Headers</h5>
              <div style={{ overflowX: 'auto' }}>
                <pre>
                  {Object.entries(headers).sort().map(([key, value]) => <div key={key}><strong>{key}: </strong><span>{value}</span><br /></div>)}
                </pre>
              </div>
            </div>
            <div className='mt-3'>
              <h5 className='mb-2'>Body</h5>
              <ReactJson
                src={body}
                name={eventId}
                collapsed={1}
                displayObjectSize={false}
                displayDataTypes={false}
                enableClipboard={false}
                sortKeys
              />
            </div>
          </div>
        )}
      </li>
    )
  }
}

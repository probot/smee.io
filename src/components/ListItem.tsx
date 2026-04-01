import React, { Component } from 'react'
import ReactJson from '@microlink/react-json-view'
import EventIcon from './EventIcon.tsx'
import { KebabHorizontalIcon, PaperclipIcon, SyncIcon, PinIcon } from '@primer/octicons-react'
import EventDescription from './EventDescription.tsx'
import copy from 'copy-to-clipboard'

function formatDistance (time: number) {
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

const RESERVED_KEYS = new Set(['body', 'timestamp', 'query', 'x-github-event', 'x-github-delivery'])

function getHeaders (item: Record<string, unknown>): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(item)) {
    if (!RESERVED_KEYS.has(key) && typeof value === 'string') {
      headers[key] = value
    }
  }
  return headers
}

export default class ListItem extends Component<
{
  item: {
    'x-github-event': string,
    body: { action: string, [key: string]: unknown },
    timestamp: number,
    [key: string]: unknown
  },
  now: number,
  last: boolean,
  pinned: boolean,
  togglePinned: (id: string) => void
}, {
  expanded: boolean
  copied: boolean
  redelivered: boolean
  headersExpanded: boolean
}> {
  handleToggleExpanded: () => void
  constructor (props) {
    super(props)
    this.handleToggleExpanded = () => this.setState({ expanded: !this.state.expanded })
    this.handleCopy = this.handleCopy.bind(this)
    this.handleRedeliver = this.handleRedeliver.bind(this)
    this.state = { expanded: false, copied: false, redelivered: false, headersExpanded: false }
  }

  handleCopy () {
    const { item } = this.props
    const event = { event: item['x-github-event'], payload: item.body }
    const copied = copy(JSON.stringify(event))
    this.setState({ copied })
  }

  handleRedeliver () {
    return window.fetch(`${window.location.pathname}/redeliver`, {
      method: 'POST',
      body: JSON.stringify(this.props.item),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => {
      this.setState({ redelivered: res.status === 200 })
    })
  }

  render () {
    const { expanded, copied, redelivered, headersExpanded } = this.state
    const { now, item, last, pinned, togglePinned } = this.props

    const event = item['x-github-event']
    const payload = item.body
    const id = item['x-github-delivery'] || item.timestamp
    const headers = getHeaders(item)

    return (
      <li className={`p-3 ${last ? '' : 'border-bottom'}`}>
        <div className='d-flex flex-items-center'>
          <div className='mr-2' style={{ width: 16 }}>
            <EventIcon event={event} action={payload && payload.action} />
          </div>
          <span className='input-monospace'>{event}</span>
          <time className='f6' style={{ marginLeft: 'auto' }}>{formatDistance(now - item.timestamp)} ago</time>
          <button onClick={this.handleToggleExpanded} className='ellipsis-expander ml-2'><KebabHorizontalIcon size={12} /></button>
        </div>

        {expanded && (
          <div className='mt-3'>
            <div className='d-flex flex-justify-between flex-items-start'>
              <div>
                <p><strong>Event ID:</strong> <code>{id}</code></p>
                <EventDescription event={event} payload={payload} timestamp={item.timestamp} />
              </div>

              <div className='d-flex ml-2'>
                <button
                  onClick={() => togglePinned(id)}
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
            {Object.keys(headers).length > 0 && (
              <>
                <hr className='mt-3' />
                <div className='mt-3'>
                  <h5
                    className='mb-2'
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => this.setState({ headersExpanded: !headersExpanded })}
                  >
                    {headersExpanded ? '▾' : '▸'} Headers <span className='f6 text-gray'>({Object.keys(headers).length})</span>
                  </h5>
                  {headersExpanded && (
                    <div className='Box p-2' style={{ fontFamily: 'monospace', fontSize: 12, overflowX: 'auto' }}>
                      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                        <tbody>
                          {Object.entries(headers).map(([key, value]) => (
                            <tr key={key}>
                              <td className='text-bold pr-3 py-1' style={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>{key}</td>
                              <td className='py-1' style={{ wordBreak: 'break-all' }}>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
            <hr className='mt-3' />
            <div className='mt-3'>
              <h5 className='mb-2'>Payload</h5>
              <ReactJson
                src={payload}
                name={id}
                collapsed={1}
                displayObjectSize={false}
                displayDataTypes={false}
                enableClipboard={false}
              />
            </div>
          </div>
        )}
      </li>
    )
  }
}

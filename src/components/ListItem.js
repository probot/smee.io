import React, { Component } from 'react'
import { object, bool, func } from 'prop-types'
import { formatDistance } from 'date-fns'
import ReactJson from '@microlink/react-json-view'
import EventIcon from './EventIcon.js'
import { KebabHorizontalIcon, PaperclipIcon, SyncIcon, PinIcon } from '@primer/octicons-react'
import EventDescription from './EventDescription.js'
import copy from 'copy-to-clipboard'
import { Button, Heading, Octicon, Text } from '@primer/react'

export default class ListItem extends Component {
  static propTypes = {
    item: object.isRequired,
    pinned: bool.isRequired,
    togglePinned: func.isRequired,
    last: bool.isRequired
  }

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
    const { expanded, copied, redelivered } = this.state
    const { item, last, pinned, togglePinned } = this.props

    const event = item['x-github-event']
    const payload = item.body
    const id = item['x-github-delivery'] || item.timestamp

    return (
      <li className={`p-3 ${last ? '' : 'border-bottom'}`}>
        <div className="d-flex flex-items-center">
          <div className="mr-2" style={{ width: 16 }}>
            <Octicon icon={EventIcon} event={event} action={payload.action} />
          </div>
          <Text as="span" fontFamily="fonts.mono">{event}</Text>
          <time className="f6" style={{ marginLeft: 'auto' }}>{formatDistance(item.timestamp, new Date())} ago</time>
          <Button onClick={this.handleToggleExpanded} className="ellipsis-expander ml-2"><Octicon icon={KebabHorizontalIcon} sx={{ height: 12 }} /></Button>
        </div>

        {expanded && (
          <div className="mt-3">
            <div className="d-flex flex-justify-between flex-items-start">
              <div>
                <p><strong>Event ID:</strong> <code>{id}</code></p>
                <EventDescription event={event} payload={payload} timestamp={item.timestamp} />
              </div>

              <div className="d-flex ml-2">
                <button
                  onClick={() => togglePinned(id)}
                  className={`btn btn-sm tooltipped tooltipped-s ${pinned && 'text-blue'}`}
                  aria-label="Pin this delivery"
                ><Octicon icon={PinIcon} />
                </button>
                <button
                  onBlur={() => this.setState({ copied: false })}
                  onClick={this.handleCopy}
                  className="ml-2 btn btn-sm tooltipped tooltipped-s js-copy-btn"
                  aria-label={copied ? 'Copied!' : 'Copy payload to clipboard'}
                ><PaperclipIcon />
                </button>
                <button
                  onBlur={() => this.setState({ redelivered: false })}
                  onClick={this.handleRedeliver}
                  className="ml-2 btn btn-sm tooltipped tooltipped-s js-redeliver-btn"
                  aria-label={redelivered ? 'Sent!' : 'Redeliver this payload'}
                ><Octicon icon={SyncIcon} />
                </button>
              </div>
            </div>
            <hr className="mt-3" />
            <div className="mt-3">
              <Heading as="h5" className="mb-2">Payload</Heading>
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

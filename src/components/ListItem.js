import React, { Component } from 'react'
import { object, bool, func } from 'prop-types'
import { formatDistance } from 'date-fns'
import ReactJson from 'react-json-view'
import EventIcon from './EventIcon'
import Octicon, { KebabHorizontal, Clippy, Sync, Pin, DesktopDownload } from '@primer/octicons-react'
import EventDescription from './EventDescription'
import copy from 'copy-to-clipboard'
import { saveAs } from 'file-saver'

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
    this.handleDownload = this.handleDownload.bind(this)
    this.state = { expanded: false, copied: false, redelivered: false }
  }

  handleCopy () {
    const { item } = this.props
    const event = { event: item['x-github-event'], payload: item.body }
    const copied = copy(JSON.stringify(event))
    this.setState({ copied })
  }

  handleDownload () {
    const { item } = this.props
    const text = JSON.stringify(item, null, 2)
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
    const id = item['x-github-delivery'] || item.timestamp

    saveAs(blob, `${id}.json`)
    this.setState({ downloaded: true })
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
    const { expanded, copied, redelivered, downloaded } = this.state
    const { item, last, pinned, togglePinned } = this.props

    const event = item['x-github-event']
    const payload = item.body
    const id = item['x-github-delivery'] || item.timestamp

    return (
      <li className={`p-3 ${last ? '' : 'border-bottom'}`}>
        <div className="d-flex flex-items-center">
          <div className="mr-2" style={{ width: 16 }}>
            <EventIcon event={event} action={payload.action} />
          </div>
          <span className="input-monospace">{event}</span>
          <time className="f6" style={{ marginLeft: 'auto' }}>{formatDistance(item.timestamp, new Date())} ago</time>
          <button onClick={this.handleToggleExpanded} className="ellipsis-expander ml-2"><Octicon icon={KebabHorizontal} height={12} /></button>
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
                ><Octicon icon={Pin} />
                </button>
                <button
                  onBlur={() => this.setState({ copied: false })}
                  onClick={this.handleCopy}
                  className="ml-2 btn btn-sm tooltipped tooltipped-s js-copy-btn"
                  aria-label={copied ? 'Copied!' : 'Copy payload to clipboard'}
                ><Octicon icon={Clippy} />
                </button>
                <button
                  onBlur={() => this.setState({ downloaded: false })}
                  onClick={this.handleDownload}
                  className="ml-2 btn btn-sm tooltipped tooltipped-s js-download-btn"
                  aria-label={downloaded ? 'Downloaded!' : 'Download this payload'}
                ><Octicon icon={DesktopDownload} />
                </button>
                <button
                  onBlur={() => this.setState({ redelivered: false })}
                  onClick={this.handleRedeliver}
                  className="ml-2 btn btn-sm tooltipped tooltipped-s js-redeliver-btn"
                  aria-label={redelivered ? 'Sent!' : 'Redeliver this payload'}
                ><Octicon icon={Sync} />
                </button>
              </div>
            </div>
            <hr className="mt-3" />
            <div className="mt-3">
              <h5 className="mb-2">Payload</h5>
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

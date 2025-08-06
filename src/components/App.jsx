import React, { Component } from 'react'
import ListItem from './ListItem.jsx'
import get from 'get-value'
import { AlertIcon, PulseIcon, SearchIcon, PinIcon } from '@primer/octicons-react'
import Blank from './Blank.jsx'

export default class App extends Component {
  constructor (props) {
    super(props)
    this.channel = window.location.pathname.substring(1)
    this.storageLimit = 30

    this.handleClear = this.handleClear.bind(this)

    this.ref = `smee:log:${this.channel}`
    this.pinnedRef = this.ref + ':pinned'
    const ref = localStorage.getItem(this.ref)
    const pinnedRef = localStorage.getItem(this.pinnedRef)

    this.state = {
      log: ref ? JSON.parse(ref) : [],
      pinnedDeliveries: pinnedRef ? JSON.parse(pinnedRef) : [],
      filter: '',
      connection: false
    }

    this.togglePinned = this.togglePinned.bind(this)
    this.isPinned = this.isPinned.bind(this)
  }

  componentDidMount () {
    this.setupEventSource()
  }

  setupEventSource () {
    const url = window.location.pathname
    console.log('Connecting to event source:', url)
    this.events = new window.EventSource(url)
    this.events.onopen = this.onopen.bind(this)
    this.events.onmessage = this.onmessage.bind(this)
    this.events.onerror = this.onerror.bind(this)
  }

  onopen (data) {
    this.setState({
      connection: true
    })
  }

  onerror (err) {
    this.setState({
      connection: false
    })
    switch (this.events.readyState) {
      case window.EventSource.CONNECTING:
        console.log('Reconnecting...', err)
        break
      case window.EventSource.CLOSED:
        console.log('Reinitializing...', err)
        this.setupEventSource()
        break
    }
  }

  onmessage (message) {
    console.log('received message!')
    const json = JSON.parse(message.data)

    // Prevent duplicates in the case of redelivered payloads
    const idProp = 'x-github-delivery'
    if (json[idProp] === undefined || this.state.log.findIndex(l => l[idProp] === json[idProp]) === -1) {
      this.setState({
        log: [json, ...this.state.log]
      }, () => {
        localStorage.setItem(this.ref, JSON.stringify(this.state.log.slice(0, this.storageLimit)))
      })
    }
  }

  handleClear () {
    if (confirm('Are you sure you want to clear the delivery log?')) {
      console.log('Clearing logs')
      const filtered = this.state.log.filter(this.isPinned)
      this.setState({ log: filtered })
      if (filtered.length > 0) {
        localStorage.setItem(this.ref, JSON.stringify(filtered))
      } else {
        localStorage.removeItem(this.ref)
      }
    }
  }

  togglePinned (id) {
    const deliveryId = this.state.pinnedDeliveries.indexOf(id)
    let pinnedDeliveries
    if (deliveryId > -1) {
      pinnedDeliveries = [
        ...this.state.pinnedDeliveries.slice(0, deliveryId),
        ...this.state.pinnedDeliveries.slice(deliveryId + 1)
      ]
    } else {
      pinnedDeliveries = [...this.state.pinnedDeliveries, id]
    }

    this.setState({ pinnedDeliveries })
    localStorage.setItem(this.pinnedRef, JSON.stringify(pinnedDeliveries))
  }

  isPinned (item) {
    const id = item['x-github-delivery'] || item.timestamp
    return this.state.pinnedDeliveries.includes(id)
  }

  render () {
    const { log, filter, pinnedDeliveries } = this.state
    let filtered = log
    if (filter) {
      filtered = log.filter(l => {
        if (filter && filter.includes(':')) {
          let [searchString, value] = filter.split(':')
          if (!searchString.startsWith('body')) searchString = `body.${searchString}`
          console.log(l, searchString, value)
          return get(l, searchString) === value
        }
        return true
      })
    }

    const stateString = this.state.connection ? 'Connected' : 'Not Connected'

    const pinnedLogs = filtered.filter(this.isPinned).map((item, i, arr) => {
      const id = item['x-github-delivery'] || item.timestamp
      return <ListItem key={id} pinned togglePinned={this.togglePinned} item={item} last={i === arr.length - 1} />
    })

    const allLogs = filtered.filter(item => !this.isPinned(item)).map((item, i, arr) => {
      const id = item['x-github-delivery'] || item.timestamp
      return <ListItem key={id} pinned={false} togglePinned={this.togglePinned} item={item} last={i === arr.length - 1} />
    })

    return (
      <main>
        <div className='py-2 bgColor-emphasis fgColor-onEmphasis'>
          <div className='container-md p-responsive d-flex flex-items-center flex-justify-between'>
            <h1 className='f4'>Webhook Deliveries</h1>
            <div className='flex-items-right tooltipped tooltipped-w' aria-label={stateString + ' to event stream'}>
              {this.state.connection
                ? <PulseIcon style={{ fill: '#6cc644' }} />
                : <AlertIcon style={{ fill: 'yellow' }} />}
            </div>
          </div>
        </div>

        {log.length > 0
          ? (
            <div className='container-md py-3 p-responsive'>
              <div className='mb-2'>
                <div className='d-flex flex-items-end mb-2'>
                  <label htmlFor='search' className='d-flex flex-items-center f6 text-gray'><SearchIcon height={12} width={12} className='mr-1' /> Filter by</label>
                  <a className='f6' href='https://github.com/jonschlinkert/get-value' target='_blank' rel='noopener noreferrer'>get-value syntax</a>

                  <button onClick={this.handleClear} className='btn btn-sm btn-danger' style={{ marginLeft: 'auto' }}>Clear deliveries</button>
                </div>
                <input
                  type='text'
                  id='search'
                  placeholder='repository.name:probot'
                  value={filter}
                  onChange={e => this.setState({ filter: e.target.value })}
                  className='input input-lg width-full Box'
                />
              </div>
              {pinnedDeliveries.length > 0 && (
                <>
                  <h6 className='d-flex flex-items-center text-gray mb-1'><PinIcon height={12} width={12} className='mr-1' /> Pinned</h6>
                  <ul className='Box list-style-none pl-0 mb-2'>
                    {pinnedLogs}
                  </ul>
                </>
              )}
              <h6 className='d-flex flex-items-center text-gray mb-1'>All</h6>
              {allLogs.length === 0
                ? <div className='Box p-3 note text-center'>All logs are pinned</div>
                : (
                  <ul className='Box list-style-none pl-0'>
                    {allLogs}
                  </ul>
                  )}
            </div>
            )
          : <Blank />}
      </main>
    )
  }
}

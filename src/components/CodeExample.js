import React from 'react'

/**
 * This is a weird component that is the output of HighlightJS, but as
 * a hard-coded component. This is done to omit HighlightJS from the bundle,
 * since the output is always exactly the same.
 *
 * React doesn't have great support for new-lines, so <br /> tags are used instead.
 */
export default React.memo(function CodeExample () {
  return (
    <pre>
      <span className="hljs-keyword">const</span> SmeeClient = <span className="hljs-built_in">require</span>(<span className="hljs-string">'smee-client'</span>)
      <br /><br />
      <span className="hljs-keyword">const</span> smee = <span className="hljs-keyword">new</span> SmeeClient({'{'}<br />
      <span className="hljs-attr">  source</span>: <span className="hljs-string">'{window.location.href}'</span>,<br />
      <span className="hljs-attr">  target</span>: <span className="hljs-string">'http://localhost:3000/events'</span>,<br />
      <span className="hljs-attr">  logger</span>: <span className="hljs-built_in">console</span><br />
      {'}'})<br /><br />
      <span className="hljs-keyword">const</span> events = smee.start()<br /><br />
      <span className="hljs-comment">// Stop forwarding events</span><br />
      events.close()
    </pre>
  )
})

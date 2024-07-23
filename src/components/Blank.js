import React from 'react'
import { InfoIcon } from '@primer/octicons-react'
import CodeExample from './CodeExample.js'
import { Box, Heading, TextInput, Tooltip, Octicon } from '@primer/react'

export default function Blank () {
  return (
    <div className="container-md p-responsive">
      <div className="Box p-3 mt-4 mb-6">
        <Box sx={{
          display: 'flex',
          marginBottom: 2
        }}>
          <label htmlFor="url">Webhook Proxy URL</label>
          <Tooltip direction="n" className="ml-2 fgColor-muted" text="Tell your service of choice to send webhook payloads to this URL."><Octicon icon={InfoIcon}/></Tooltip>
        </Box>
        <TextInput
          id="url"
          autoFocus
          onFocus={e => e.target.select()}
          readOnly
          value={window.location.href}
          className="form-control"
          block={true}
          size='large'
        />
        <p className="mt-2 text-gray-light f6">This page will automatically update as things happen.</p>

        <hr />
        <div className="mt-4 markdown-body">
          <Heading as="h3">Use the CLI</Heading>
          <pre>
            $ npm install --global smee-client
          </pre>
          <p>Then the <code>smee</code> command will forward webhooks from smee.io to your local development environment.</p>
          <pre>
            <code>$ smee -u {window.location.href}</code>
          </pre>

          <p>For usage info:</p>
          <pre>
            <code>$ smee --help</code>
          </pre>

          <Heading as="h3" className="mt-3">Use the Node.js client</Heading>
          <pre>
            $ npm install --save smee-client
          </pre>
          <p>Then:</p>
          <CodeExample />

          <Heading as="h3" className="mt-3">Using Probot's built-in support</Heading>
          <pre>
            $ npm install --save smee-client
          </pre>
          <p>Then set the environment variable:</p>
          <pre>
            WEBHOOK_PROXY_URL={window.location.href}
          </pre>
        </div>
      </div>
    </div>
  )
}

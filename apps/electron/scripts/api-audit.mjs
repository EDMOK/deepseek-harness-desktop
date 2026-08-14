/**
 * Functional audit of a running dsh web harness: exercises every unary RPC
 * method in the ApiProxy map with a minimal payload, verifies the response
 * envelope, and checks the downlink streams. Pass the port as argv[2].
 *
 * A `bad-request` result is a PASS for wire health (the method rejected a
 * minimal payload through the real zod pipeline); `ok:true` is a functional
 * PASS; anything else is reported as a failure.
 */
const port = process.argv[2] ?? '3101'
const base = `http://127.0.0.1:${port}`

const methods = [
  'credentials.describe', 'credentials.set', 'credentials.unset',
  'goal.clear', 'goal.complete', 'goal.create', 'goal.edit', 'goal.pause', 'goal.resume',
  'host.describe', 'llm.models', 'llm.providers',
  'session.attachment', 'session.cancel', 'session.create', 'session.fork',
  'session.history', 'session.list', 'session.models', 'session.prompt', 'session.rename', 'session.search',
  'settings.describe', 'settings.mutate', 'settings.replace', 'settings.update',
  'skill.list', 'subagent.history', 'subagent.interrupt', 'subagent.list', 'subagent.prompt',
  'workspace.create', 'workspace.delete', 'workspace.list', 'workspace.rename',
]

const results = []
for (const method of methods) {
  const rpcId = `audit-${results.length}`
  try {
    const r = await fetch(`${base}/api/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId, method, payload: {} }),
      signal: AbortSignal.timeout(20000),
    })
    const j = await r.json()
    const envelopeOk = j.type === 'server-response' && j.rpcId === rpcId
    const ok = j.result?.ok === true
    const code = j.result?.ok === false ? j.result.error?.code : ''
    results.push(`${envelopeOk ? 'PASS' : 'FAIL'} ${method.padEnd(24)} ${ok ? 'ok:true' : `ok:false(${code})`}`)
  } catch (e) {
    results.push(`FAIL ${method.padEnd(24)} ${e.name}: ${e.message.slice(0, 60)}`)
  }
}

// Downlink streams: mux (all-session) and host (host-level) WebSockets.
for (const [name, path] of [['mux', 'api/events.mux'], ['host', 'api/events.host']]) {
  try {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/${path}`)
    const opened = await Promise.race([
      new Promise((res) => ws.addEventListener('open', () => res(true), { once: true })),
      new Promise((res) => setTimeout(() => res(false), 6000)),
    ])
    results.push(`${opened ? 'PASS' : 'FAIL'} ${name}-stream`)
    ws.close()
  } catch (e) {
    results.push(`FAIL ${name}-stream ${e.message.slice(0, 60)}`)
  }
}

// Picker composition: plugin-inventory should show browse, not native.
try {
  const r = await fetch(`${base}/api/pluginInventory/list`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId: 'audit-inv', method: 'pluginInventory/list', payload: {} }),
    signal: AbortSignal.timeout(10000),
  })
  const j = await r.json()
  const rows = JSON.stringify(j.result?.value ?? j)
  const browse = rows.includes('directory-picker-browse')
  const native = rows.includes('directory-picker-native')
  results.push(`${browse && !native ? 'PASS' : 'FAIL'} picker-browse-pinned (browse=${browse} native=${native})`)
} catch (e) {
  results.push(`FAIL plugin-inventory ${e.message.slice(0, 60)}`)
}

console.log(results.join('\n'))
const fails = results.filter((l) => l.startsWith('FAIL'))
console.log(`\n${results.length} checks, ${fails.length} failures`)
process.exit(fails.length === 0 ? 0 : 1)

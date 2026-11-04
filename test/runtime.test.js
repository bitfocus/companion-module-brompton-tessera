const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const { once } = require('node:events')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')

const moduleRequire = createRequire(path.resolve(__dirname, '../index.js'))

async function waitFor(predicate) {
	const deadline = Date.now() + 3000
	while (!predicate()) {
		assert.ok(Date.now() < deadline, 'Timed out waiting for module response')
		await new Promise((resolve) => setTimeout(resolve, 10))
	}
}

test('HTTP polling, actions, recovery, configuration reload and timer cleanup', async (t) => {
	const requests = []
	let statusCode = 200
	let body = JSON.stringify({
		api: {
			override: { blackout: { enabled: false } },
			output: { 'global-colour': { brightness: 500 } },
			groups: { items: { 3: { brightness: 250 } } },
		},
	})
	const server = http.createServer((req, res) => {
		requests.push(req.url)
		res.writeHead(statusCode).end(body)
	})
	server.listen(0, '127.0.0.1')
	await once(server, 'listening')
	t.after(() => new Promise((resolve) => server.close(resolve)))
	const port = server.address().port
	let Instance
	const timers = new Set()
	class Host {
		constructor() {
			this.values = {}
			this.statuses = []
			this.logs = []
		}
		updateStatus(status) {
			this.statuses.push(status)
		}
		log(level, message) {
			this.logs.push({ level, message })
		}
		setVariableValues(values) {
			Object.assign(this.values, values)
		}
		setVariableDefinitions(definitions) {
			this.definitions = definitions
		}
		setActionDefinitions(actions) {
			this.actions = actions
		}
		setPresetDefinitions(presets) {
			this.presets = presets
		}
	}
	const base = moduleRequire('@companion-module/base')
	vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../index.js'), 'utf8'), {
		require: (id) => {
			if (id === '@companion-module/base')
				return {
					...base,
					InstanceBase: Host,
					runEntrypoint: (value) => {
						Instance = value
					},
				}
			if (id === 'request')
				return (options, callback) => {
					assert.match(options.url, /^http:\/\/127\.0\.0\.1:80\/api\//)
					return moduleRequire('request')({ ...options, url: options.url.replace(':80/', `:${port}/`) }, callback)
				}
			return moduleRequire(id)
		},
		setInterval: (callback) => {
			timers.add(callback)
			return callback
		},
		clearInterval: (timer) => timers.delete(timer),
	})
	const instance = new Instance()
	t.after(() => instance.destroy())
	await instance.init({ ip: '127.0.0.1', maxBrightness: '1000' })
	await waitFor(() => instance.values.outputBrightness === 500)
	assert.equal(instance.values.outputBrightnessPercentage, '50.0')
	assert.equal(instance.values.blackout, 'Disabled')
	assert.equal(instance.values.groupBrightness3, 250)
	assert.ok(instance.definitions.some((v) => v.variableId === 'groupBrightness3'))
	assert.equal(timers.size, 1)
	instance.actions.blackoutToggle.callback({ actionId: 'blackoutToggle', options: { mode: 'toggle' } })
	await waitFor(() => requests.includes('/api/override/blackout/enabled?set=true'))
	instance.actions.outputBrightnessIncrease.callback({ actionId: 'outputBrightnessIncrease', options: { step: 100 } })
	await waitFor(() => requests.includes('/api/output/global-colour/brightness?set=600'))
	const count = requests.length
	instance.actions.outputBrightnessIncrease.callback({ actionId: 'outputBrightnessIncrease', options: { step: -1 } })
	assert.ok(instance.logs.some((v) => v.message.includes('outside of the range')))
	assert.equal(requests.length, count)
	statusCode = 503
	instance.poll()
	await waitFor(() => instance.statuses.includes(base.InstanceStatus.ConnectionFailure))
	assert.equal(instance.values.outputBrightness, '?')
	statusCode = 200
	instance.poll()
	await waitFor(() => instance.values.outputBrightness === 500)
	assert.equal(instance.statuses.at(-1), base.InstanceStatus.Ok)
	body = '{invalid'
	instance.poll()
	await waitFor(() => instance.values.outputBrightness === '?')
	await instance.configUpdated({ ip: '', maxBrightness: '1000' })
	assert.equal(timers.size, 1)
	assert.equal(instance.statuses.at(-1), base.InstanceStatus.BadConfig)
	await instance.destroy()
	assert.equal(timers.size, 0)
})

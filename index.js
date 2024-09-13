'use strict'

const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const request = require('request')
const { apiKeys } = require('./apiKeys.js')

// Constants
const pollIntervalMs = 1000
const timeoutMs = 2000
const minPreset = 1
const maxPreset = 128
const minBrightness = 0
const maxBrightness = 10000
const defaultBrightness = 5000
const minBrightnessStep = 1
const maxBrightnessStep = maxBrightness
const defaultBrightnessStep = 100
const minGroupNumber = 1
const maxGroupNumber = Math.pow(2, 32) - 1

//added constants below
const minTemperature = 2000
const maxTemperature = 11000
const minTemperatureStep = 1
const maxTemperatureStep = maxTemperature
const defaultTemperatureStep = 100

function getProperty(object, path) {
	return path.reduce((object, label) => object && object[label], object)
}

function sortedArraysEqual(a, b) {
	if (a.length !== b.length) {
		return false
	}

	for (let i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) {
			return false
		}
	}

	return true
}

function apiKeyGroupBrightness(group) {
	return ['api', 'groups', 'items', group.toString(), 'brightness']
}

function validate(number, min, max, description) {
	if (number === undefined || number === '') {
		throw new Error(description + ' was not set')
	}

	if (!Number.isInteger(number)) {
		throw new Error(description + ' is not a whole number')
	}

	if (number < min || max < number) {
		throw new Error(description + ' is outside of the range (' + min + ', ' + max + ') inclusive')
	}
}

function validateFloat(number, min, max, description) {
	if (number === undefined || number === '') {
		throw new Error(description + ' was not set')
	}

	if (number < min || max < number) {
		throw new Error(description + ' is outside of the range (' + min + ', ' + max + ') inclusive')
	}
}

function clamp(number, min, max) {
	return Math.max(min, Math.min(number, max))
}

function rangeToString(min, max, units) {
	if (units == undefined) {
		return '(' + min + '-' + max + ')'
	} else {
		return '(' + min + '-' + max + ' ' + units + ')'
	}
}

function getActionDescription(actionId) {
	let description = ''
	if (actionId.indexOf('Increase') >= 0) {
		description = 'Increase Amount'
	} else if (actionId.indexOf('Decrease') >= 0) {
		description = 'Decrease Amount'
	}
	return description
}

class BromptonInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Ok)

		// Variables
		this.timer = undefined
		this.loggedError = false // Stops the poll flooding the log
		this.timestampOfRequest = Date.now()

		this.initVariables()
		this.initActions()
		this.startPolling()
	}

	async destroy() {
		let self = this
		self.stopPolling()
		self.log('debug', 'destroy')
	}

	async configUpdated(config) {
		let self = this

		self.config = config
		self.initActions()
		self.initVariables()
		self.startPolling()
	}

	startPolling() {
		let self = this

		if (self.timer === undefined) {
			self.timer = setInterval(self.poll.bind(self), pollIntervalMs)
		}

		self.poll()
	}

	stopPolling() {
		let self = this

		if (self.timer !== undefined) {
			clearInterval(self.timer)
			delete self.timer
		}
	}

	poll() {
		let self = this
		const timestamp = Date.now()

		// Check if the IP was set.
		if (self.config.ip === undefined || self.config.ip.length === 0) {
			if (self.loggedError === false) {
				let msg = 'IP is not set'
				self.log('error', msg)
				self.updateStatus(InstanceStatus.BadConfig, msg)
				self.loggedError = true
			}

			self.timestampOfRequest = timestamp
			self.updateVariables({})
			return
		}

		// Call the api endpoint to get the state.
		const options = {
			method: 'GET',
			url: 'http://' + self.config.ip + ':80/api/',
			timeout: timeoutMs,
		}

		request(options, function (err, result) {
			// If the request is old it should be ignored.
			if (timestamp < self.timestampOfRequest) {
				return
			}

			self.timestampOfRequest = timestamp

			// Check if request was unsuccessful.
			if (err !== null || result.statusCode !== 200) {
				if (self.loggedError === false) {
					let msg = 'HTTP GET Request for ' + self.config.ip + ' failed'
					if (err !== null) {
						msg += ' (' + err + ')'
					} else {
						msg += ' (' + result.statusCode + ': ' + result.body + ')'
					}

					self.log('error', msg)
					self.updateStatus(InstanceStatus.ConnectionFailure, msg)
					self.loggedError = true
				}
				self.updateVariables({})
				return
			}

			// Made a successful request.
			if (self.loggedError === true) {
				self.log('info', 'HTTP connection succeeded')
				self.updateStatus(InstanceStatus.Ok)
				self.loggedError = false
			}

			let response = {}
			if (result.body.length > 0) {
				try {
					response = JSON.parse(result.body.toString())
				} catch (error) {}
			}

			self.updateVariables(response)
		})
	}

	getConfigFields() {
		let self = this
		return [
			{
				type: 'textinput',
				id: 'ip',
				label: 'IP',
				default: '192.168.0.50',
				width: 12,
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'maxBrightness',
				label: 'Max Brightness of Device (used for percentage calculation)',
				default: '1550',
				width: 4,
			},
		]
	}

	setVariableDefinitionsFromInfo() {
		let self = this

		// Create array of definitions.
		let varDef = []

		for (let info of self.variableInfo) {
			varDef.push(info.definition)
		}

		self.setVariableDefinitions(varDef)
	}

	initVariables() {
		let self = this

		const convertBool = (input) => (input ? 'Enabled' : 'Disabled')

		self.variableInfo = [
			// Input
			{
				definition: { name: 'Input Port Number', variableId: 'inputPortNumber' },
				apiKey: apiKeys.inputPortNumber,
			},
			{
				definition: { name: 'Input Port Type', variableId: 'inputPortType' },
				apiKey: apiKeys.inputPortType,
			},
			// Processing
			// Override
			{
				definition: { name: 'Blackout', variableId: 'blackout' },
				apiKey: apiKeys.blackout,
				transform: convertBool,
			},
			{
				definition: { name: 'Freeze', variableId: 'freeze' },
				apiKey: apiKeys.freeze,
				transform: convertBool,
			},
			{
				definition: { name: 'Test Pattern', variableId: 'testPattern' },
				apiKey: apiKeys.testPattern,
				transform: convertBool,
			},
			{
				definition: { name: 'Test Pattern Format', variableId: 'testPatternFormat' },
				apiKey: apiKeys.testPatternFormat,
			},
			{
				definition: { name: 'Test Pattern Type', variableId: 'testPatternType' },
				apiKey: apiKeys.testPatternType,
			},
			// Colour & Output
			{
				definition: { name: 'Output Brightness', variableId: 'outputBrightness' },
				apiKey: apiKeys.outputBrightness,
			},
			{
				definition: { name: 'Output Brightness %', variableId: 'outputBrightnessPercentage' },
				apiKey: apiKeys.outputBrightness,
			},
			{
				definition: { label: 'Output Temperature', name: 'outputTemperature' },
				apiKey: self.apiKeyOutputTemperature,
			},
			// Network
			// Camera
			// Presets
			{
				definition: { name: 'Active Preset Number', variableId: 'activePresetNumber' },
				apiKey: apiKeys.activePresetNumber,
			},
			{
				definition: { name: 'Active Preset Name', variableId: 'activePresetName' },
				apiKey: apiKeys.activePresetName,
			},

			// Group Brightness variables are added by self.updateGroupDefinitions().
		]

		self.groups = []
		self.updateGroupDefinitions()
		self.setVariableDefinitionsFromInfo()
		self.updateVariables({})
	}

	updateGroupDefinitions() {
		let self = this

		// Check if the new groups are the same as the old ones.
		let newGroups = []

		const items = getProperty(self.state, ['api', 'groups', 'items'])
		if (items !== undefined) {
			newGroups = Object.keys(items)
				.map((x) => parseInt(x))
				.sort((x, y) => x - y)
		}

		if (sortedArraysEqual(self.groups, newGroups)) {
			return
		}

		// Undefine all the old group variables.
		let groupsIndices = []
		for (let i = 0; i < self.variableInfo.length; ++i) {
			const info = self.variableInfo[i]
			if (info.apiKey.length > 1 && info.apiKey[1] === 'groups') {
				self.setVariableValues({
					[info.definition.variableId]: undefined,
				})
				groupsIndices.push(i)
			}
		}

		// Remove the old groups from self.variableInfo.
		if (groupsIndices.length !== 0) {
			self.variableInfo.splice(groupsIndices[0], groupsIndices.length)
		}

		// Add new groups.
		self.groups = newGroups

		// Add new group variables
		for (let group of self.groups) {
			self.variableInfo.push({
				definition: { name: 'Group ' + group + ' Brightness', variableId: 'groupBrightness' + group },
				apiKey: apiKeyGroupBrightness(group),
			})
		}

		self.setVariableDefinitionsFromInfo()
	}

	updateVariables(state) {
		let self = this
		self.state = state

		if (state.api !== undefined) {
			self.updateGroupDefinitions()
		}

		for (let info of self.variableInfo) {
			let result = getProperty(state, info.apiKey)
			if (result === undefined) {
				result = '?'
			} else {
				if (info.transform) {
					result = info.transform(result)
				}
			}

			//THIS ADDS SUPPORT FOR OUTPUT BRIGHTNESS PERCENTAGE BY TAKING OUTPUT BRIGHTNESS DIVIDED BY MAX BRIGHTNESS
			if (info.definition.variableId === 'outputBrightnessPercentage') {
				result = getProperty(state, apiKeys.outputBrightness)
				if (result === undefined) {
					result = '?'
				} else {
					result = (parseInt(result) / parseInt(self.config.maxBrightness)) * 100 //output brightness divided by max brightness, multiplied by 100
					result = result.toFixed(1) //rounds to 1 decimal place
				}
			}

			self.setVariableValues({
				[info.definition.variableId]: result,
			})
		}
	}

	setProcessorProperty(apiKey, data) {
		let self = this

		// Check if the IP was set.
		if (self.config.ip === undefined || self.config.ip.length === 0) {
			self.log('error', 'IP is not set')
			return
		}

		// Call the api endpoint to set the data.
		const url = 'http://' + self.config.ip + ':80/' + apiKey.join('/') + '?set=' + data
		const options = {
			method: 'GET',
			url: url,
			timeout: timeoutMs,
		}

		request(options, function (err, result) {
			if (err !== null || result.statusCode !== 200) {
				let msg = url + ' failed'
				if (err !== null) {
					msg += ' (' + err + ')'
				} else {
					msg += ' (' + result.statusCode + ': ' + result.body + ')'
				}
				self.log('error', msg)
			} else {
				self.poll()
			}
		})
	}

	initActions() {
		let self = this

		const presetRange = rangeToString(minPreset, maxPreset)
		const brightnessRange = rangeToString(minBrightness, maxBrightness, 'nits')
		const brightnessStepRange = rangeToString(minBrightnessStep, maxBrightnessStep, 'nits')

		self.setActionDefinitions({
			// Input
			inputPortNumberSelect: {
				name: 'Input Port Number Select',
				options: [
					{
						type: 'dropdown',
						label: 'Port Number',
						id: 'portNumber',
						default: '1',
						tooltip: 'Input port number',
						choices: [
							{ id: '1', label: '1' },
							{ id: '2', label: '2' },
						],
					},
				],
				callback: (action, controlId) => {
					this.setProcessorProperty(apiKeys.inputPortNumber, action.options.portNumber)
				},
			},
			inputPortTypeSelect: {
				name: 'Input Port Type Select',
				options: [
					{
						type: 'dropdown',
						label: 'Port Type',
						id: 'portType',
						default: 'dvi',
						tooltip: 'Input port type',
						choices: [
							{ id: 'dvi', label: 'DVI' },
							{ id: 'hdmi', label: 'HDMI' },
							{ id: 'sdi', label: 'SDI' },
						],
					},
				],
				callback: (action, controlId) => {
					this.setProcessorProperty(apiKeys.inputPortType, action.options.portType)
				},
			},

			// Processing
			// Override
			blackoutToggle: {
				name: 'Blackout Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'Blackout toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.blackout, 'Blackout')
				},
			},
			freezeToggle: {
				name: 'Freeze Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'Freeze toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.freeze, 'Freeze')
				},
			},
			testPatternToggle: {
				name: 'Test Pattern Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'Test Pattern toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.testPattern, 'Test Pattern')
				},
			},
			testPatternFormatSelect: {
				name: 'Test Pattern Format Select',
				options: [
					{
						type: 'dropdown',
						label: 'Format',
						id: 'format',
						default: 'from-input',
						tooltip: 'Test pattern format',
						choices: [
							{ id: 'from-input', label: 'From Input' },
							{ id: 'standard-dynamic-range', label: 'Standard Dynamic Range' },
							{ id: 'perceptual-quantiser', label: 'Perceptual Quantiser' },
							{ id: 'hybrid-log-gamma', label: 'Hybrid Log Gamma' },
						],
					},
				],
				callback: (action, controlId) => {
					this.setProcessorProperty(apiKeys.testPatternFormat, action.options.format)
				},
			},
			testPatternTypeSelect: {
				name: 'Test Pattern Type Select',
				options: [
					{
						type: 'dropdown',
						label: 'Type',
						id: 'type',
						default: 'brompton',
						tooltip: 'Test pattern type',
						choices: [
							{ id: 'brompton', label: 'Brompton' },
							{ id: 'brompton-overlay', label: 'Brompton Overlay' },
							{ id: 'red', label: 'Red' },
							{ id: 'green', label: 'Green' },
							{ id: 'blue', label: 'Blue' },
							{ id: 'cyan', label: 'Cyan' },
							{ id: 'magenta', label: 'Magenta' },
							{ id: 'yellow', label: 'Yellow' },
							{ id: 'white', label: 'White' },
							{ id: 'black', label: 'Black' },
							{ id: 'grid', label: 'Grid' },
							{ id: 'scrolling-grid', label: 'Scrolling Grid' },
							{ id: 'checkerboard', label: 'Checkerboard' },
							{ id: 'scrolling-checkerboard', label: 'Scrolling Checkerboard' },
							{ id: 'colour-bars', label: 'Colour Bars' },
							{ id: 'gamma', label: 'Gamma' },
							{ id: 'gradient', label: 'Gradient' },
							{ id: 'scrolling-gradient', label: 'Scrolling Gradient' },
							{ id: 'strobe', label: 'Strobe' },
							{ id: 'smpte-bars', label: 'SMPTE Bars' },
							{ id: 'scrolling-smpte-bars', label: 'Scrolling SMPTE Bars' },
							{ id: 'custom', label: 'custom' },
							{ id: 'forty-five-degree-grid', label: '45 Degree Grid' },
							{ id: 'scrolling-forty-five-degree-grid', label: 'Scrolling 45 Degree Grid' },
						],
					},
				],
				callback: (action, controlId) => {
					this.setProcessorProperty(apiKeys.testPatternType, action.options.type)
				},
			},
			// Colour & Output
			outputBrightnessSelect: {
				name: 'Output Brightness Select',
				options: [
					{
						type: 'number',
						label: 'Brightness ' + brightnessRange,
						id: 'brightness',
						tooltip: 'The output brightness ' + brightnessRange,
						min: minBrightness,
						max: maxBrightness,
						default: defaultBrightness,
						step: 1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.setValidatedProperty(
						action.options.brightness,
						minBrightness,
						maxBrightness,
						'Brightness',
						apiKeys.outputBrightness
					)
				},
			},
			outputBrightnessSetToMax: {
				name: 'Output Brightness Set To Common Maximum',
				options: [],
				callback: (action, controlId) => {
					this.setProcessorProperty(apiKeys.outputBrightness, -1)
				},
			},
			outputBrightnessIncrease: {
				name: 'Output Brightness Increase',
				options: [
					{
						type: 'number',
						label: 'Increase Amount ' + brightnessStepRange,
						id: 'step',
						tooltip: 'How much to increase by ' + brightnessStepRange,
						min: minBrightnessStep,
						max: maxBrightnessStep,
						default: defaultBrightnessStep,
						step: 1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.outputBrightnessIncreaseOrDecreaseAction(action)
				},
			},
			outputBrightnessDecrease: {
				name: 'Output Brightness Decrease',
				options: [
					{
						type: 'number',
						label: 'Decrease Amount ' + brightnessStepRange,
						id: 'step',
						tooltip: 'How much to decrease by ' + brightnessStepRange,
						min: minBrightnessStep,
						max: maxBrightnessStep,
						default: defaultBrightnessStep,
						step: 1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.outputBrightnessIncreaseOrDecreaseAction(action)
				},
			},
			outputTemperatureSelect: {
				label: 'Output Temperature Select',
				options: [
					{
						type: 'number',
						label: 'Temperature ' + temperatureRange,
						id: 'temperature',
						tooltip: 'The output temperature ' + temperatureRange,
						min: minTemperature,
						max: maxTemperature,
						default: defaultTemperature,
						step: 1,
						required: true,
						range: false,
					},
				],
			},
			outputTemperatureIncrease: {
				label: 'Output Temperature Increase',
				options: [
					{
						type: 'number',
						label: 'Increase Amount ' + temperatureStepRange,
						id: 'step',
						tooltip: 'How much to increase by ' + temperatureStepRange,
						min: minTemperatureStep,
						max: maxTemperatureStep,
						default: defaultTemperatureStep,
						step: 1,
						required: true,
						range: false,
					},
				],
			},
			outputTemperatureDecrease: {
				label: 'Output Temperature Decrease',
				options: [
					{
						type: 'number',
						label: 'Decrease Amount ' + temperatureStepRange,
						id: 'step',
						tooltip: 'How much to decrease by ' + temperatureStepRange,
						min: minTemperatureStep,
						max: maxTemperatureStep,
						default: defaultTemperatureStep,
						step: 1,
						required: true,
						range: false,
					},
				],
			},

			// Network
			// Camera
			// Presets
			presetSelect: {
				name: 'Preset Select',
				options: [
					{
						type: 'number',
						label: 'Preset Number',
						id: 'presetNumber',
						tooltip: 'The preset to activate ' + presetRange,
						min: minPreset,
						max: maxPreset,
						default: minPreset,
						step: 1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.setValidatedProperty(
						action.options.presetNumber,
						minPreset,
						maxPreset,
						'Preset Number',
						apiKeys.activePresetNumber
					)
				},
			},
			presetNext: {
				name: 'Preset Next',
				options: [],
				callback: (action, controlId) => {
					this.presetNextOrPreviousAction(action)
				},
			},
			presetPrevious: {
				name: 'Preset Previous',
				options: [],
				callback: (action, controlId) => {
					this.presetNextOrPreviousAction(action)
				},
			},

			// Groups
			groupBrightnessSelect: {
				name: 'Group Brightness Select',
				options: [
					{
						type: 'number',
						label: 'Group Number',
						id: 'group',
						tooltip: 'The group number',
						min: minGroupNumber,
						max: maxGroupNumber,
						default: minGroupNumber,
						step: 1,
						required: true,
						range: false,
					},
					{
						type: 'number',
						label: 'Brightness ' + brightnessRange,
						id: 'brightness',
						tooltip: 'The group brightness ' + brightnessRange,
						min: minBrightness,
						max: maxBrightness,
						default: defaultBrightness,
						step: 1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.groupBrightnessSelectAction(action)
				},
			},
			groupBrightnessIncrease: {
				name: 'Group Brightness Increase',
				options: [
					{
						type: 'number',
						label: 'Group Number',
						id: 'group',
						tooltip: 'The group number',
						min: minGroupNumber,
						max: maxGroupNumber,
						default: minGroupNumber,
						step: 1,
						required: true,
						range: false,
					},
					{
						type: 'number',
						label: 'Increase Amount ' + brightnessStepRange,
						id: 'step',
						tooltip: 'How much to increase by ' + brightnessStepRange,
						min: minBrightnessStep,
						max: maxBrightnessStep,
						default: defaultBrightnessStep,
						step: 1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.groupBrightnessIncreaseOrDecreaseAction(action)
				},
			},
			groupBrightnessDecrease: {
				name: 'Group Brightness Decrease',
				options: [
					{
						type: 'number',
						label: 'Group Number',
						id: 'group',
						tooltip: 'The group number',
						min: minGroupNumber,
						max: maxGroupNumber,
						default: minGroupNumber,
						step: 1,
						required: true,
						range: false,
					},
					{
						type: 'number',
						label: 'Decrease Amount ' + brightnessStepRange,
						id: 'step',
						tooltip: 'How much to decrease by ' + brightnessStepRange,
						min: minBrightnessStep,
						max: maxBrightnessStep,
						default: defaultBrightnessStep,
						step: 1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.groupBrightnessIncreaseOrDecreaseAction(action)
				},
			},

			// System
		})
	}

	setValidatedProperty(value, min, max, label, apiKey) {
		try {
			validate(value, min, max, label)
			this.setProcessorProperty(apiKey, value)
		} catch (error) {
			let msg = 'Action ' + label + ' failed'
			if (error.message && error.message.length > 0) {
				msg += ' (' + error.message + ')'
			}
			this.log('error', msg)
		}
	}
	setValidatedPropertyFloat(value, min, max, label, apiKey) {
		try {
			validateFloat(value, min, max, label)
			this.setProcessorProperty(apiKey, value)
		} catch (error) {
			let msg = 'Action ' + label + ' failed'
			if (error.message && error.message.length > 0) {
				msg += ' (' + error.message + ')'
			}
			this.log('error', msg)
		}
	}

	// -------- Actions --------
	toggleAction(action, apiKey, feature) {
		if (action.options.mode === 'enable') {
			this.setProcessorProperty(apiKey, true)
		} else if (action.options.mode === 'disable') {
			this.setProcessorProperty(apiKey, false)
		} else {
			try {
				let enabled = getProperty(this.state, apiKey)

				if (enabled === undefined) {
					throw new Error(feature + ' state is not available')
				}

				this.setProcessorProperty(apiKey, !enabled)
			} catch (error) {
				let msg = 'Action ' + action.actionId + ' failed'
				if (error.message && error.message.length > 0) {
					msg += ' (' + error.message + ')'
				}
				this.log('error', msg)
			}
		}
	}

	// Input
	// Processing

	// Override
	// Colour & Output
	outputBrightnessIncreaseOrDecreaseAction(action) {
		try {
			let description = getActionDescription(action.actionId)

			validate(action.options.step, minBrightnessStep, maxBrightnessStep, description)

			let brightness = getProperty(this.state, apiKeys.outputBrightness)

			if (brightness === undefined) {
				throw new Error('Output Brightness is not available')
			}

			brightness = parseInt(brightness)

			if (action.actionId == 'outputBrightnessIncrease') {
				brightness += action.options.step
			} else {
				brightness -= action.options.step
			}

			brightness = clamp(brightness, minBrightness, maxBrightness)

			this.setProcessorProperty(apiKeys.outputBrightness, brightness)
		} catch (error) {
			let msg = 'Action ' + action.actionId + ' failed'
			if (error.message && error.message.length > 0) {
				msg += ' (' + error.message + ')'
			}
			this.log('error', msg)
		}
	}
	// Network
	// Camera

	// Presets
	presetNextOrPreviousAction(action) {
		try {
			let preset = getProperty(this.state, apiKeys.activePresetNumber)

			if (preset === undefined) {
				throw new Error('Active Preset Number is not available')
			}

			preset = parseInt(preset)

			// Create a list of presets.
			const items = getProperty(this.state, ['api', 'presets', 'items'])
			if (items === undefined) {
				return // Nothing to do.
			}

			let listOfPresets = Object.keys(items).map((x) => parseInt(x))
			if (listOfPresets.length === 0) {
				return // Nothing to do.
			}

			// Find the next/previous preset.
			let index

			if (action.actionId == 'presetNext') {
				listOfPresets.sort((x, y) => x - y)
				index = listOfPresets.findIndex((x) => preset < x)
			} else {
				listOfPresets.sort((x, y) => y - x)
				index = listOfPresets.findIndex((x) => x < preset)
			}

			if (index === -1) {
				index = 0 // Wrap around.
			}

			this.setProcessorProperty(apiKeys.activePresetNumber, listOfPresets[index])
		} catch (error) {
			let msg = 'Action ' + action.actionId + ' failed'
			if (error.message && error.message.length > 0) {
				msg += ' (' + error.message + ')'
			}
			this.log('error', msg)
		}
	}

	// Groups
	groupBrightnessSelectAction(action) {
		try {
			validate(action.options.group, minGroupNumber, maxGroupNumber, 'Group Number')
			validate(action.options.brightness, minBrightness, maxBrightness, 'Brightness')
			this.setProcessorProperty(apiKeyGroupBrightness(action.options.group), action.options.brightness)
		} catch (error) {
			let msg = 'Action ' + action.actionId + ' failed'
			if (error.message && error.message.length > 0) {
				msg += ' (' + error.message + ')'
			}
			this.log('error', msg)
		}
	}

	groupBrightnessIncreaseOrDecreaseAction(action) {
		try {
			validate(action.options.group, minGroupNumber, maxGroupNumber, 'Group Number')

			let description = getActionDescription(action.actionId)
			validate(action.options.step, minBrightnessStep, maxBrightnessStep, description)
			let brightness = getProperty(this.state, apiKeyGroupBrightness(action.options.group))

			if (brightness === undefined) {
				throw new Error('Group ' + action.options.group + ' Brightness is not available')
			}

			brightness = parseInt(brightness)

			if (action.actionId == 'groupBrightnessIncrease') {
				brightness += action.options.step
			} else {
				brightness -= action.options.step
			}

			brightness = clamp(brightness, minBrightness, maxBrightness)

			this.setProcessorProperty(apiKeyGroupBrightness(action.options.group), brightness)
		} catch (error) {
			let msg = 'Action ' + action.actionId + ' failed'
			if (error.message && error.message.length > 0) {
				msg += ' (' + error.message + ')'
			}
			this.log('error', msg)
		}
	}
}

runEntrypoint(BromptonInstance, [])

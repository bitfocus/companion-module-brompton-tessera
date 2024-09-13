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

const defaultColourTemperature = 6504
const minColourTemperature = 2000
const maxColourTemperature = 11000
const minColourTemperatureStep = 1
const maxColourTemperatureStep = maxColourTemperature - minColourTemperature
const defaultColourTemperatureStep = 100

const minPhaseOffsetAngle = -360
const maxPhaseOffsetAngle = 360
const minPhaseOffsetAngleStep = 0.0
const maxPhaseOffsetAngleStep = maxPhaseOffsetAngle
const defaultPhaseOffsetAngleStep = 0.1

const minPhaseOffsetFraction = -100
const maxPhaseOffsetFraction = 100
const minPhaseOffsetFractionStep = 0.0
const maxPhaseOffsetFractionStep = maxPhaseOffsetFraction
const defaultPhaseOffsetFractionStep = 0.1

const minShutterSyncAngle = 1
const maxShutterSyncAngle = 360
const minShutterSyncSpeed = 10
const maxShutterSyncSpeed = 250
const minShutterSyncTime = 4
const maxShutterSyncTime = 100

const minGroupNumber = 1
const maxGroupNumber = Math.pow(2, 32) - 1

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
			{
				definition: { name: 'Scaler', variableId: 'scaler' },
				apiKey: apiKeys.scaler,
				transform: convertBool,
			},
			{
				definition: { name: 'Colour Replace', variableId: 'colourReplace' },
				apiKey: apiKeys.colourReplace,
				transform: convertBool,
			},
			{
				definition: { name: '14-Way Colour Correct', variableId: 'colourCorrect' },
				apiKey: apiKeys.colourCorrect,
				transform: convertBool,
			},
			{
				definition: { name: 'Curves', variableId: 'curves' },
				apiKey: apiKeys.curves,
				transform: convertBool,
			},
			{
				definition: { name: '3D LUT', variableId: 'lut' },
				apiKey: apiKeys.lut3d,
				transform: convertBool,
			},
			{
				definition: { name: '3D LUT Strength', variableId: 'lutStrength' },
				apiKey: apiKeys.lut3dStrength,
			},
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
				definition: { name: 'Overdrive', variableId: 'overdrive' },
				apiKey: apiKeys.overdrive,
				transform: convertBool,
			},
			{
				definition: { name: 'Highlight Out-Of-Gamut Pixels', variableId: 'highlightOutOfGamut' },
				apiKey: apiKeys.highlightOutOfGamut,
				transform: convertBool,
			},
			{
				definition: { name: 'Highlight Out-Of-Gamut Pixels (v3.4)', variableId: 'highlightOutOfGamut3.4' },
				apiKey: apiKeys.highlightOutOfGamut3_4,
				transform: convertBool,
			},
			{
				definition: { name: 'Highlight Overbright Pixels', variableId: 'highlightOverbright' },
				apiKey: apiKeys.highlightOverbright,
				transform: convertBool,
			},
			{
				definition: { name: 'OSCA Module Correction', variableId: 'oscaModuleCorrection' },
				apiKey: apiKeys.oscaModule,
				transform: convertBool,
			},
			{
				definition: { name: 'OSCA Seam Correction', variableId: 'oscaSeamCorrection' },
				apiKey: apiKeys.oscaSeam,
				transform: convertBool,
			},
			{
				definition: { name: 'Dark Magic', variableId: 'darkMagic' },
				apiKey: apiKeys.darkMagic,
				transform: convertBool,
			},
			{
				definition: { name: 'Extended Bit Depth', variableId: 'extendedBitDepth' },
				apiKey: apiKeys.extendedBitDepth,
				transform: convertBool,
			},
			{
				definition: { name: 'PureTone', variableId: 'pureTone' },
				apiKey: apiKeys.pureTone,
				transform: convertBool,
			},
			{
				definition: { name: 'Output Colour Temperature', variableId: 'outputColourTemperature' },
				apiKey: apiKeys.outputColourTemperature,
			},
			// Network
			// Camera
			{
				definition: { name: 'Phase Offset Mode', variableId: 'phaseOffsetMode' },
				apiKey: apiKeys.phaseOffsetMode,
			},
			{
				definition: { name: 'Phase Offset Angle', variableId: 'phaseOffsetAngle' },
				apiKey: apiKeys.phaseOffsetAngle,
			},
			{
				definition: { name: 'Phase Offset Fraction', variableId: 'phaseOffsetFraction' },
				apiKey: apiKeys.phaseOffsetFraction,
			},
			{
				definition: { name: 'ShutterSync Mode', variableId: 'shutterSyncMode' },
				apiKey: apiKeys.shutterSyncMode,
			},
			{
				definition: { name: 'ShutterSync Angle', variableId: 'shutterSyncAngle' },
				apiKey: apiKeys.shutterSyncAngle,
			},
			{
				definition: { name: 'ShutterSync Speed', variableId: 'shutterSyncSpeed' },
				apiKey: apiKeys.shutterSyncSpeed,
			},
			{
				definition: { name: 'ShutterSync Time', variableId: 'shutterSyncTime' },
				apiKey: apiKeys.shutterSyncTime,
			},
			{
				definition: { name: 'ShutterSync Prioritise Refresh Rate', variableId: 'shutterSyncPrioritiseRefreshRate' },
				apiKey: apiKeys.shutterSyncPrioritiseRefreshRate,
				transform: convertBool,
			},
			{
				definition: { name: 'Hidden Markers', variableId: 'hiddenMarkers' },
				apiKey: apiKeys.hiddenMarkers,
				transform: convertBool,
			},
			{
				definition: { name: 'Hidden Markers Mode', variableId: 'hiddenMarkersMode' },
				apiKey: apiKeys.hiddenMarkersMode,
			},
			{
				definition: { name: 'Frame Remapping', variableId: 'frameRemapping' },
				apiKey: apiKeys.frameRemapping,
				transform: convertBool,
			},
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
		const colourTemperatureRange = rangeToString(minColourTemperature, maxColourTemperature, 'K')
		const colourTemperatureStepRange = rangeToString(minColourTemperatureStep, maxColourTemperatureStep, 'K')

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
			scalerToggle: {
				name: 'Scaler Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'Scaler toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.scaler, 'Scaler')
				},
			},
			colourReplaceToggle: {
				name: 'Colour Replace Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'Colour replace toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.colourReplace, 'Colour Replace')
				},
			},
			colourCorrectToggle: {
				name: '14-Way Colour Correct Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: '14-Way colour correct toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.colourCorrect, '14-Way Colour Correct')
				},
			},
			curvesToggle: {
				name: 'Curves Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'Curves toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.curves, 'Curves')
				},
			},
			lutToggle: {
				name: '3D LUT Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: '14-Way Colour Correct toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.lut3d, '3D LUT')
				},
			},
			lutStrengthIncrease: {
				name: '3D LUT Strength Increase',
				options: [
					{
						type: 'number',
						label: 'Increase Amount (%)',
						id: 'step',
						tooltip: 'How much to increase by (%)',
						min: 0.1,
						max: 100,
						default: 50,
						step: 0.1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.lutStrengthIncreaseOrDecreaseAction(action)
				},
			},
			lutStrengthDecrease: {
				name: '3D LUT Strength Decrease',
				options: [
					{
						type: 'number',
						label: 'Decrease Amount (%)',
						id: 'step',
						tooltip: 'How much to decrease by (%)',
						min: 0.0,
						max: 100,
						default: 50,
						step: 0.1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.lutStrengthIncreaseOrDecreaseAction(action)
				},
			},
			lutStrengthSelect: {
				name: '3D LUT Strength Select',
				options: [
					{
						type: 'number',
						label: '3D LUT Strength (%)',
						id: 'strength',
						tooltip: '3D LUT Strength (%)',
						min: 0.0,
						max: 100,
						default: 50,
						step: 0.1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.setValidatedProperty(action.options.strength, 0, 100, 'Strength', apiKeys.lut3dStrength)
				},
			},

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
			overdriveToggle: {
				name: 'Overdrive Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'Overdrive toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.overdrive, 'Overdrive')
				},
			},
			highlightOutOfGamutToggle: {
				name: 'Highlight Out-Of-Gamut Pixels Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'Highlight Out-Of-Gamut Pixels toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.highlightOutOfGamut, 'Highlight Out-Of-Gamut Pixels')
				},
			},
			highlightOutOfGamutToggle3_4: {
				name: 'Highlight Out-Of-Gamut Pixels Toggle/Enable/Disable (v3.4)',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'Highlight Out-Of-Gamut Pixels toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.highlightOutOfGamut3_4, 'Highlight Out-Of-Gamut Pixels (3.4 and older)')
				},
			},
			highlightOverbrightToggle: {
				name: 'Highlight Overbright Pixels Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'Highlight Overbright Pixels toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.highlightOverbright, 'Highlight Overbright Pixels')
				},
			},
			oscaModuleToggle: {
				name: 'OSCA Module Correction Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'OSCA Module Correction toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.oscaModule, 'OSCA Module Correction')
				},
			},
			oscaSeamToggle: {
				name: 'OSCA Seam Correction Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'OSCA Seam Correction toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.oscaSeam, 'OSCA Seam Correction')
				},
			},
			darkMagicToggle: {
				name: 'Dark Magic Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'Dark Magic toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.darkMagic, 'Dark Magic')
				},
			},
			extendedBitDepthToggle: {
				name: 'Extended Bit Depth Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'Extended Bit Depth toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.extendedBitDepth, 'Extended Bit Depth')
				},
			},
			pureToneToggle: {
				name: 'PureTone Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'PureTone toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.pureTone, 'PureTone')
				},
			},
			outputColourTemperatureSelect: {
				name: 'Output Colour Temperature Select',
				options: [
					{
						type: 'number',
						label: 'Colour Temperature ' + colourTemperatureRange,
						id: 'temperature',
						tooltip: 'The output colour temperature ' + colourTemperatureRange,
						min: minColourTemperature,
						max: maxColourTemperature,
						default: defaultColourTemperature,
						step: 1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.setValidatedProperty(
						action.options.temperature,
						minColourTemperature,
						maxColourTemperature,
						'Colour Temperature',
						apiKeys.outputColourTemperature
					)
				},
			},
			outputColourTemperatureIncrease: {
				name: 'Output Colour Temperature Increase',
				options: [
					{
						type: 'number',
						label: 'Increase Amount ' + colourTemperatureStepRange,
						id: 'step',
						tooltip: 'How much to increase by ' + colourTemperatureStepRange,
						min: minColourTemperatureStep,
						max: maxColourTemperatureStep,
						default: defaultColourTemperatureStep,
						step: 1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.outputColourTemperatureIncreaseOrDecreaseAction(action)
				},
			},
			outputColourTemperatureDecrease: {
				name: 'Output Colour Temperature Decrease',
				options: [
					{
						type: 'number',
						label: 'Decrease Amount ' + colourTemperatureStepRange,
						id: 'step',
						tooltip: 'How much to decrease by ' + colourTemperatureStepRange,
						min: minColourTemperatureStep,
						max: maxColourTemperatureStep,
						default: defaultColourTemperatureStep,
						step: 1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.outputColourTemperatureIncreaseOrDecreaseAction(action)
				},
			},

			// Network
			requestFailover: {
				name: 'Request Failover',
				options: [],
				callback: (action, controlId) => {
					this.setProcessorProperty(apiKeys.requestFailover, '')
				},
			},

			// Camera
			phaseOffsetModeSelect: {
				name: 'Phase Offset Mode Select',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'none',
						tooltip: 'Phase offset mode',
						choices: [
							{ id: 'none', label: 'None' },
							{ id: 'angle', label: 'Angle' },
							{ id: 'fraction', label: 'Fraction' },
						],
					},
				],
				callback: (action, controlId) => {
					this.setProcessorProperty(apiKeys.phaseOffsetMode, action.options.mode)
				},
			},
			phaseOffsetAngleSelect: {
				name: 'Phase Offset (Angle) Select',
				options: [
					{
						type: 'number',
						label: 'Phase Offset Angle (' + minPhaseOffsetAngle + '˚ - ' + maxPhaseOffsetAngle + '˚)',
						id: 'offset',
						tooltip: 'The phase offset angle (' + minPhaseOffsetAngle + '˚ - ' + maxPhaseOffsetAngle + '˚)',
						min: minPhaseOffsetAngle,
						max: maxPhaseOffsetAngle,
						default: 0.0,
						step: 0.1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.setValidatedPropertyFloat(
						action.options.offset,
						minPhaseOffsetAngle,
						maxPhaseOffsetAngle,
						'Phase Offset',
						apiKeys.phaseOffsetAngle
					)
				},
			},
			phaseOffsetFractionSelect: {
				name: 'Phase Offset (Fraction) Select',
				options: [
					{
						type: 'number',
						label: 'Phase Offset Fraction (' + minPhaseOffsetFraction + '% - ' + maxPhaseOffsetFraction + '%)',
						id: 'offset',
						tooltip: 'The phase offset fraction (' + minPhaseOffsetFraction + '% - ' + maxPhaseOffsetFraction + '%)',
						min: minPhaseOffsetFraction,
						max: maxPhaseOffsetFraction,
						default: 0.0,
						step: 0.1,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.setValidatedPropertyFloat(
						action.options.offset,
						minPhaseOffsetFraction,
						maxPhaseOffsetFraction,
						'Phase Offset',
						apiKeys.phaseOffsetFraction
					)
				},
			},
			phaseOffsetIncrease: {
				name: 'Phase Offset Increase',
				options: [
					{
						type: 'number',
						label: 'Increase Amount (Angle)',
						id: 'angle',
						tooltip: 'How much to increase by in degrees',
						min: minPhaseOffsetAngleStep,
						max: maxPhaseOffsetAngleStep,
						default: defaultPhaseOffsetAngleStep,
						step: 0.1,
						required: true,
						range: false,
					},
					{
						type: 'number',
						label: 'Increase Amount (%)',
						id: 'fraction',
						tooltip: 'How much to increase by as a %',
						min: minPhaseOffsetFractionStep,
						max: maxPhaseOffsetFractionStep,
						default: defaultPhaseOffsetFractionStep,
						step: 0.1,
						required: true,
						range: false,
					},
					{
						id: 'wraparound',
						label: 'Wrap-around?',
						type: 'checkbox',
						tooltip: 'If true, positive values will wrap around to 0 when the maximum value is exceeded.',
						default: false,
					},
				],
				callback: (action, controlId) => {
					this.phaseOffsetIncreaseOrDecreaseAction(action)
				},
			},
			phaseOffsetDecrease: {
				name: 'Phase Offset Decrease',
				options: [
					{
						type: 'number',
						label: 'Decrease Amount (Angle)',
						id: 'angle',
						tooltip: 'How much to decrease by in degrees',
						min: minPhaseOffsetAngleStep,
						max: maxPhaseOffsetAngleStep,
						default: defaultPhaseOffsetAngleStep,
						step: 0.1,
						required: true,
						range: false,
					},
					{
						type: 'number',
						label: 'Decrease Amount (%)',
						id: 'fraction',
						tooltip: 'How much to decrease by as a %',
						min: minPhaseOffsetFractionStep,
						max: maxPhaseOffsetFractionStep,
						default: defaultPhaseOffsetFractionStep,
						step: 0.1,
						required: true,
						range: false,
					},
					{
						id: 'wraparound',
						label: 'Wrap-around?',
						type: 'checkbox',
						tooltip: 'If true, positive values will wrap around to 0 when the maximum value is exceeded.',
						default: false,
					},
				],
				callback: (action, controlId) => {
					this.phaseOffsetIncreaseOrDecreaseAction(action)
				},
			},
			shutterSyncModeSelect: {
				name: 'ShutterSync Mode Select (Camera)',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'none',
						tooltip: 'ShutterSync mode',
						choices: [
							{ id: 'none', label: 'None' },
							{ id: 'angle', label: 'Angle' },
							{ id: 'speed', label: 'Speed' },
						],
					},
				],
				callback: (action, controlId) => {
					this.setProcessorProperty(apiKeys.shutterSyncMode, action.options.mode)
				},
			},
			shutterSyncAngleSelect: {
				name: 'ShutterSync (Angle) Select',
				options: [
					{
						type: 'number',
						label: 'ShutterSync Angle (' + minShutterSyncAngle + '˚ - ' + maxShutterSyncAngle + '˚)',
						id: 'angle',
						tooltip: 'The phase offset angle (' + minShutterSyncAngle + '˚ - ' + maxShutterSyncAngle + '˚)',
						min: minShutterSyncAngle,
						max: maxShutterSyncAngle,
						default: 180.0,
						step: 1.0,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.setValidatedPropertyFloat(
						action.options.angle,
						minShutterSyncAngle,
						maxShutterSyncAngle,
						'ShutterSync',
						apiKeys.shutterSyncAngle
					)
				},
			},
			shutterSyncSpeedSelect: {
				name: 'ShutterSync (Speed) Select',
				options: [
					{
						type: 'number',
						label: 'ShutterSync Speed (1/' + minShutterSyncSpeed + ' - 1/' + maxShutterSyncSpeed + ')',
						id: 'speed',
						tooltip: 'The phase offset speed (1/' + minShutterSyncSpeed + ' - 1/' + maxShutterSyncSpeed + ')',
						min: minShutterSyncSpeed,
						max: maxShutterSyncSpeed,
						default: 120.0,
						step: 0.001,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.setValidatedPropertyFloat(
						action.options.speed,
						minShutterSyncSpeed,
						maxShutterSyncSpeed,
						'ShutterSync',
						apiKeys.shutterSyncSpeed
					)
				},
			},
			shutterSyncTimeSelect: {
				name: 'ShutterSync (Time) Select',
				options: [
					{
						type: 'number',
						label: 'ShutterSync Time (' + minShutterSyncTime + ' ms - ' + maxShutterSyncTime + ' ms)',
						id: 'time',
						tooltip: 'The phase offset time (' + minShutterSyncTime + ' ms - ' + maxShutterSyncTime + ' ms)',
						min: minShutterSyncTime,
						max: maxShutterSyncTime,
						default: 10.0,
						step: 0.001,
						required: true,
						range: false,
					},
				],
				callback: (action, controlId) => {
					this.setValidatedPropertyFloat(
						action.options.time,
						minShutterSyncTime,
						maxShutterSyncTime,
						'ShutterSync',
						apiKeys.shutterSyncTime
					)
				},
			},
			shutterSyncPrioritiseRefreshRateToggle: {
				name: 'ShutterSync Prioritise Refresh Rate Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'ShutterSync Prioritise Refresh Rate toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.shutterSyncPrioritiseRefreshRate, 'ShutterSync Prioritise Refresh Rate')
				},
			},
			hiddenMarkersToggle: {
				name: 'Hidden Markers Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'Hidden Markers toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
					{
						type: 'dropdown',
						label: 'Marker Type',
						id: 'type',
						default: 'starTracker',
						tooltip: 'Hidden Markers mode selection',
						choices: [
							{ id: 'starTracker', label: 'StarTracker' },
							{ id: 'redSpy', label: 'RedSpy' },
							{ id: 'custom', label: 'Custom' },
						],
					},
				],
				callback: (action, controlId) => {
					let selectedMarkersMode = action.options.type.toLowerCase()

					if (this.getVariableValue('hiddenMarkersMode') !== '?') {
						this.setProcessorProperty(apiKeys.hiddenMarkersMode, selectedMarkersMode)
					}

					this.toggleAction(action, apiKeys.hiddenMarkers, 'Hidden Markers')
				},
			},
			frameRemappingToggle: {
				name: 'Frame Remapping Toggle/Enable/Disable',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'mode',
						default: 'toggle',
						tooltip: 'Frame Remapping toggle mode',
						choices: [
							{ id: 'toggle', label: 'Toggle' },
							{ id: 'enable', label: 'Enable' },
							{ id: 'disable', label: 'Disable' },
						],
					},
				],
				callback: (action, controlId) => {
					this.toggleAction(action, apiKeys.frameRemapping, 'Frame Remapping')
				},
			},

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
			shutDown: {
				name: 'Shut Down',
				options: [],
				callback: (action, controlId) => {
					this.setProcessorProperty(apiKeys.shutDown, '')
				},
			},
			reboot: {
				name: 'Reboot',
				options: [],
				callback: (action, controlId) => {
					this.setProcessorProperty(apiKeys.reboot, '')
				},
			},
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
	lutStrengthIncreaseOrDecreaseAction(action) {
		try {
			let description = getActionDescription(action.actionId)

			validate(action.options.step, 0, 100, description)

			let strength = getProperty(this.state, apiKeys.lut3dStrength)

			if (strength === undefined) {
				throw new Error('3D LUT strength is not available')
			}

			strength = parseInt(strength)

			if (action.actionId == 'lutStrengthIncrease') {
				strength += action.options.step
			} else {
				strength -= action.options.step
			}

			strength = clamp(strength, 0, 100)

			this.setProcessorProperty(apiKeys.lut3dStrength, strength)
		} catch (error) {
			let msg = 'Action ' + action.actionId + ' failed'
			if (error.message && error.message.length > 0) {
				msg += ' (' + error.message + ')'
			}
			this.log('error', msg)
		}
	}

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

	outputColourTemperatureIncreaseOrDecreaseAction(action) {
		try {
			let description = getActionDescription(action.actionId)

			validate(action.options.step, minColourTemperatureStep, maxColourTemperatureStep, description)

			let colourTemperature = getProperty(this.state, apiKeys.outputColourTemperature)

			if (colourTemperature === undefined) {
				throw new Error('Output Colour Temperature is not available')
			}

			colourTemperature = parseInt(colourTemperature)

			if (action.actionId == 'outputColourTemperatureIncrease') {
				colourTemperature += action.options.step
			} else {
				colourTemperature -= action.options.step
			}

			colourTemperature = clamp(colourTemperature, minColourTemperature, maxColourTemperature)

			this.setProcessorProperty(apiKeys.outputColourTemperature, colourTemperature)
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
	phaseOffsetIncreaseOrDecreaseAction(action) {
		let self = this

		let state = self.state

		try {
			let mode = this.getVariableValue('phaseOffsetMode')
			let settings = getPhaseOffsetActionSettings(mode)
			validateActionInput(settings)

			let phaseOffsetValue = getCurrentPhaseOffsetValue(state, settings.apiKey)
			let newPhaseOffsetValue = applyValueChange(phaseOffsetValue, settings)
			this.setProcessorProperty(settings.apiKey, newPhaseOffsetValue)
		} catch (error) {
			let msg = 'Action ' + action.actionId + ' failed'
			if (error.message && error.message.length > 0) {
				msg += ' (' + error.message + ')'
			}
			this.log('error', msg)
		}

		// Helper functions
		function getPhaseOffsetActionSettings(mode) {
			var apiKey
			var actionStep
			var minStepValue
			var maxStepValue
			var maxValue
			var minValue

			if (mode == 'angle') {
				apiKey = apiKeys.phaseOffsetAngle
				actionStep = action.options.angle
				minStepValue = minPhaseOffsetAngleStep
				maxStepValue = maxPhaseOffsetAngleStep
				maxValue = maxPhaseOffsetAngle
				minValue = minPhaseOffsetAngle
			} else if (mode == 'fraction') {
				apiKey = apiKeys.phaseOffsetFraction
				actionStep = action.options.fraction
				minStepValue = minPhaseOffsetFractionStep
				maxStepValue = maxPhaseOffsetFractionStep
				maxValue = maxPhaseOffsetFraction
				minValue = minPhaseOffsetFraction
			} else {
				throw new Error('Please select a Phase Offset mode option (Angle/Fraction)')
			}
			return {
				apiKey,
				actionStep,
				minStepValue,
				maxStepValue,
				maxValue,
				minValue,
			}
		}

		function validateActionInput(settings) {
			let description = getActionDescription(action.actionId)
			validateFloat(settings.actionStep, settings.minStepValue, settings.maxStepValue, description)
		}

		function getCurrentPhaseOffsetValue(state, apiKey) {
			let phaseOffsetValue = getProperty(state, apiKey)
			if (phaseOffsetValue === undefined) {
				throw new Error('Phase Offset is not available')
			}

			return parseFloat(phaseOffsetValue)
		}

		function applyValueChange(phaseOffsetValue, settings) {
			if (action.actionId == 'phaseOffsetIncrease') {
				phaseOffsetValue += settings.actionStep
			} else {
				phaseOffsetValue -= settings.actionStep
			}
			if (action.options.wraparound === true) {
				phaseOffsetValue = (phaseOffsetValue + settings.maxValue) % settings.maxValue
			} else {
				phaseOffsetValue = clamp(phaseOffsetValue, settings.minValue, settings.maxValue)
			}

			phaseOffsetValue = phaseOffsetValue.toFixed(6)

			return phaseOffsetValue
		}
	}

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

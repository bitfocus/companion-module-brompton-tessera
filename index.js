'use strict'

const instance_skel = require('../../instance_skel')
const request = require('request')

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
const minColourTemp = 2000
const maxColourTemp = 11000
const defaultColourTemp = 6500
const minColourTempStep = 1
const maxColourTempStep = maxColourTemp
const defaultColourTempStep = 100
const minGroupNumber = 1
const maxGroupNumber = Math.pow(2, 32) - 1

function instance(system, id, config) {
	let self = this

	instance_skel.call(self, system, id, config)

	// Variables
	self.timer = undefined
	self.loggedError = false // Stops the poll flooding the log
	self.timestampOfRequest = Date.now()

	self.initActions()
	return self
}

instance.prototype.updateConfig = function (config) {
	let self = this

	self.config = config
	self.initActions()
	self.initVariables()
	self.startPolling()
}

instance.prototype.init = function () {
	let self = this

	self.status(self.STATE_OK)

	self.initVariables()
	self.startPolling()
}

instance.prototype.startPolling = function () {
	let self = this

	if (self.timer === undefined) {
		self.timer = setInterval(self.poll.bind(self), pollIntervalMs)
	}

	self.poll()
}

instance.prototype.stopPolling = function () {
	let self = this

	if (self.timer !== undefined) {
		clearInterval(self.timer)
		delete self.timer
	}
}

instance.prototype.poll = function () {
	let self = this
	const timestamp = Date.now()

	// Check if the IP was set.
	if (self.config.ip === undefined || self.config.ip.length === 0) {
		if (self.loggedError === false) {
			let msg = 'IP is not set'
			self.log('error', msg)
			self.status(self.STATUS_WARNING, msg)
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
				self.status(self.STATUS_ERROR, msg)
				self.loggedError = true
			}
			self.updateVariables({})
			return
		}

		// Made a successful request.
		if (self.loggedError === true) {
			self.log('info', 'HTTP connection succeeded')
			self.status(self.STATUS_OK)
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

instance.prototype.config_fields = function () {
	let self = this
	return [
		{
			type: 'textinput',
			id: 'ip',
			label: 'IP',
			default: '',
			width: 12,
			regex: self.REGEX_IP,
		},
		{
			type: 'textinput',
			id: 'maxBrightness',
			label: 'Max Brightness of Device (used for percentage calculation)',
			default: '1550',
			width: 4
		}
	]
}

instance.prototype.destroy = function () {
	let self = this
	self.stopPolling()
	self.debug('destroy')
}

instance.prototype.setVariableDefinitionsFromInfo = function () {
	let self = this

	// Create array of definitions.
	let varDef = []

	for (let info of self.variableInfo) {
		varDef.push(info.definition)
	}

	self.setVariableDefinitions(varDef)
}

instance.prototype.initVariables = function () {
	let self = this

	const convertBool = (input) => (input ? 'Enabled' : 'Disabled')

	self.apiKeyActivePresetNumber = ['api', 'presets', 'active', 'number']
	self.apiKeyActivePresetName = ['api', 'presets', 'active', 'name']
	self.apiKeyOutputBrightness = ['api', 'output', 'global-colour', 'brightness']
	self.apiKeyOutputColourTemperature = ['api', 'output', 'global-colour', 'colour-temperature']
	self.apiKeyBlackout = ['api', 'override', 'blackout', 'enabled']
	self.apiKeyFreeze = ['api', 'override', 'freeze', 'enabled']
	self.apiKeyTestPattern = ['api', 'override', 'test-pattern', 'enabled']
	self.apiKeyTestPatternFormat = ['api', 'override', 'test-pattern', 'format']
	self.apiKeyTestPatternType = ['api', 'override', 'test-pattern', 'type']
	self.apiKeyInputPortNumber = ['api', 'input', 'active', 'source', 'port-number']
	self.apiKeyInputPortType = ['api', 'input', 'active', 'source', 'port-type']

	self.variableInfo = [
		{
			definition: { label: 'Active Preset Number', name: 'activePresetNumber' },
			apiKey: self.apiKeyActivePresetNumber,
		},
		{
			definition: { label: 'Active Preset Name', name: 'activePresetName' },
			apiKey: self.apiKeyActivePresetName,
		},
		{
			definition: { label: 'Output Brightness', name: 'outputBrightness' },
			apiKey: self.apiKeyOutputBrightness,
		},
		{
			definition: { label: 'Output Brightness %', name: 'outputBrightnessPercentage' },
			apiKey: self.apiKeyOutputBrightness
		},
		{	
			definition: { label: 'Output Colour Temperature', name: 'outputColourTemperature' },
			apiKey: self:apiKeyOutputColourTemperature
		},
		{
			definition: { label: 'Blackout', name: 'blackout' },
			apiKey: self.apiKeyBlackout,
			transform: convertBool,
		},
		{
			definition: { label: 'Freeze', name: 'freeze' },
			apiKey: self.apiKeyFreeze,
			transform: convertBool,
		},
		{
			definition: { label: 'Test Pattern', name: 'testPattern' },
			apiKey: self.apiKeyTestPattern,
			transform: convertBool,
		},
		{
			definition: { label: 'Test Pattern Format', name: 'testPatternFormat' },
			apiKey: self.apiKeyTestPatternFormat,
		},
		{
			definition: { label: 'Test Pattern Type', name: 'testPatternType' },
			apiKey: self.apiKeyTestPatternType,
		},
		{
			definition: { label: 'Input Port Number', name: 'inputPortNumber' },
			apiKey: self.apiKeyInputPortNumber,
		},
		{
			definition: { label: 'Input Port Type', name: 'inputPortType' },
			apiKey: self.apiKeyInputPortType,
		},

		// Group Brightness variables are added by self.updateGroupDefinitions().
	]

	self.groups = []
	self.updateGroupDefinitions()
	self.setVariableDefinitionsFromInfo()
	self.updateVariables({})
}

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

instance.prototype.updateGroupDefinitions = function () {
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
			self.setVariable(info.definition.name, undefined)
			groupsIndices.push(i)
		}
	}

	// Remove the old groups from self.variableInfo.
	if (groupsIndices.length !== 0) {
		self.variableInfo.splice(groupsIndices[0], groupsIndices.length)
	}

	// Add new groups.
	self.groups = newGroups

	for (let group of self.groups) {
		self.variableInfo.push({
			definition: { label: 'Group ' + group + ' Brightness', name: 'groupBrightness' + group },
			apiKey: apiKeyGroupBrightness(group),
		})
	}

	self.setVariableDefinitionsFromInfo()
}

instance.prototype.updateVariables = function (state) {
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
		if (info.definition.name === 'outputBrightnessPercentage') {
			result = getProperty(state, self.apiKeyOutputBrightness)
			if (result === undefined) {
				result = '?'
			} else {
				result = (parseInt(result) / parseInt(self.config.maxBrightness)) * 100; //output brightness divided by max brightness, multiplied by 100
				result = result.toFixed(1); //rounds to 1 decimal place
			}
		}
		//////

		self.setVariable(info.definition.name, result)
	}
}

instance.prototype.setProcessorProperty = function (apiKey, data) {
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

function rangeToString(min, max) {
	return '(' + min + '-' + max + ' inclusive)'
}

instance.prototype.initActions = function (system) {
	let self = this

	const presetRange = rangeToString(minPreset, maxPreset)
	const brightnessRange = rangeToString(minBrightness, maxBrightness)
	const brightnessStepRange = rangeToString(minBrightnessStep, maxBrightnessStep)
	const colorTempRange = rangeToString(minColourTemp, maxColourTemp)
	const colourTempStepRange = rangeToString(minColourTempStep, maxColourTempStep)

	self.setActions({
		presetSelect: {
			label: 'Preset Select',
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
		},
		presetNext: {
			label: 'Preset Next',
			options: [],
		},
		presetPrevious: {
			label: 'Preset Previous',
			options: [],
		},
		outputBrightnessSelect: {
			label: 'Output Brightness Select',
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
		},
		outputBrightnessSetToMax: {
			label: 'Output Brightness Set To Common Maximum',
			options: [],
		},
		outputBrightnessIncrease: {
			label: 'Output Brightness Increase',
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
		},
		outputBrightnessDecrease: {
			label: 'Output Brightness Decrease',
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
		},
		outputColourTemperatureSelect: {
			label: 'Output Colour Temperature Select',
			options: [
				{
					type: 'number',
					label: 'Colour Temperature ' + colorTempRange,
					id: 'colourTemperature',
					tooltip: 'The output color temperature ' + colorTempRange,
					min: minColourTemp,
					max: maxColourTemp,
					default: defaultColourTemp,
					step: 1,
					required: true,
					range: false,
				},
			],
		},
		outputColourTemperatureIncrease: {
			label: 'Output Colour Temperature Increase',
			options: [
				{
					type: 'number',
					label: 'Increase Amount ' + colourTempStepRange,
					id: 'step',
					tooltip: 'How much to increase by ' + colourTempStepRange,
					min: minColourTempStep,
					max: maxColourTempStep,
					default: defaultColourTempStep,
					step: 1,
					required: true,
					range: false,
				},
			],
		},
		outputColourTemperatureDecrease: {
			label: 'Output Colour Temperature Decrease',
			options: [
				{
					type: 'number',
					label: 'Decrease Amount ' + colourTempStepRange,
					id: 'step',
					tooltip: 'How much to decrease by ' + colourTempStepRange,
					min: minColourTempStep,
					max: maxColourTempStep,
					default: defaultColourTempStep,
					step: 1,
					required: true,
					range: false,
				},
			],
		},
		groupBrightnessSelect: {
			label: 'Group Brightness Select',
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
		},
		groupBrightnessIncrease: {
			label: 'Group Brightness Increase',
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
		},
		groupBrightnessDecrease: {
			label: 'Group Brightness Decrease',
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
		},
		blackoutToggle: {
			label: 'Blackout Toggle',
			options: [],
		},
		blackoutEnable: {
			label: 'Blackout Enable',
			options: [],
		},
		blackoutDisable: {
			label: 'Blackout Disable',
			options: [],
		},
		freezeToggle: {
			label: 'Freeze Toggle',
			options: [],
		},
		freezeEnable: {
			label: 'Freeze Enable',
			options: [],
		},
		freezeDisable: {
			label: 'Freeze Disable',
			options: [],
		},
		testPatternToggle: {
			label: 'Test Pattern Toggle',
			options: [],
		},
		testPatternEnable: {
			label: 'Test Pattern Enable',
			options: [],
		},
		testPatternDisable: {
			label: 'Test Pattern Disable',
			options: [],
		},
		testPatternFormatSelect: {
			label: 'Test Pattern Format Select',
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
		},
		testPatternTypeSelect: {
			label: 'Test Pattern Type Select',
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
		},
		inputPortNumberSelect: {
			label: 'Input Port Number Select',
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
		},
		inputPortTypeSelect: {
			label: 'Input Port Type Select',
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
		},
	})
}

function clamp(number, min, max) {
	return Math.max(min, Math.min(number, max))
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

instance.prototype.action = function (action) {
	let self = this

	try {
		if (action.action == 'presetSelect') {
			validate(action.options.presetNumber, minPreset, maxPreset, 'Preset Number')
			self.setProcessorProperty(self.apiKeyActivePresetNumber, action.options.presetNumber)
		}

		if (action.action == 'presetNext' || action.action == 'presetPrevious') {
			let preset = getProperty(self.state, self.apiKeyActivePresetNumber)

			if (preset === undefined) {
				throw new Error('Active Preset Number is not available')
			}

			preset = parseInt(preset)

			// Create a list of presets.
			const items = getProperty(self.state, ['api', 'presets', 'items'])
			if (items === undefined) {
				return // Nothing to do.
			}

			let listOfPresets = Object.keys(items).map((x) => parseInt(x))
			if (listOfPresets.length === 0) {
				return // Nothing to do.
			}

			// Find the next/previous preset.
			let index

			if (action.action == 'presetNext') {
				listOfPresets.sort((x, y) => x - y)
				index = listOfPresets.findIndex((x) => preset < x)
			} else {
				listOfPresets.sort((x, y) => y - x)
				index = listOfPresets.findIndex((x) => x < preset)
			}

			if (index === -1) {
				index = 0 // Wrap around.
			}

			self.setProcessorProperty(self.apiKeyActivePresetNumber, listOfPresets[index])
		}

		if (action.action == 'outputBrightnessSelect') {
			validate(action.options.brightness, minBrightness, maxBrightness, 'Brightness')
			self.setProcessorProperty(self.apiKeyOutputBrightness, action.options.brightness)
		}

		if (action.action == 'outputBrightnessSetToMax') {
			self.setProcessorProperty(self.apiKeyOutputBrightness, -1)
		}

		if (action.action == 'outputBrightnessIncrease' || action.action == 'outputBrightnessDecrease') {
			let description
			if (action.action == 'outputBrightnessIncrease') {
				description = 'Increase Amount'
			} else {
				description = 'Decrease Amount'
			}

			validate(action.options.step, minBrightnessStep, maxBrightnessStep, description)

			let brightness = getProperty(self.state, self.apiKeyOutputBrightness)

			if (brightness === undefined) {
				throw new Error('Output Brightness is not available')
			}

			brightness = parseInt(brightness)

			if (action.action == 'outputBrightnessIncrease') {
				brightness += action.options.step
			} else {
				brightness -= action.options.step
			}

			brightness = clamp(brightness, minBrightness, maxBrightness)

			self.setProcessorProperty(self.apiKeyOutputBrightness, brightness)
		}

		if (action.action == 'outputColourTemperatureIncrease') {
			validate(action.options.colourTemperature, minColourTemp, maxColourTemp, 'Colour Temperature')
			self.setProcessorProperty(self.apiKeyOutputColourTemperature, action.options.colourTemperature)
		}

		if (action.action == 'outputColourTemperatureIncrease' || action.action == 'outputColourTemperatureDecrease') {
			let description
			if (action.action == 'outputColourTemperatureIncrease') {
				description = 'Increase Amount'
			} else {
				description = 'Decrease Amount'
			}

			validate(action.options.step, minColourTempStep, maxColourTempStep, description)

			let temperature = getProperty(self.state, self.apiKeyOutputColourTemperature)

			if (temperature === undefined) {
				throw new Error('Output Colour Temperature is not available')
			}

			temperature = parseInt(temperature)

			if (action.action == 'outputColourTemperatureIncrease') {
				temperature += action.options.step
			} else {
				temperature -= action.options.step
			}

			temperature = clamp(temperature, minColourTemp, maxColourTemp)

			self.setProcessorProperty(self.apiKeyOutputColourTemperature, temperature)
		}

		if (action.action == 'groupBrightnessSelect') {
			validate(action.options.group, minGroupNumber, maxGroupNumber, 'Group Number')
			validate(action.options.brightness, minBrightness, maxBrightness, 'Brightness')
			self.setProcessorProperty(apiKeyGroupBrightness(action.options.group), action.options.brightness)
		}

		if (action.action == 'groupBrightnessIncrease' || action.action == 'groupBrightnessDecrease') {
			validate(action.options.group, minGroupNumber, maxGroupNumber, 'Group Number')

			let description
			if (action.action == 'groupBrightnessIncrease') {
				description = 'Increase Amount'
			} else {
				description = 'Decrease Amount'
			}

			validate(action.options.step, minBrightnessStep, maxBrightnessStep, description)

			let brightness = getProperty(self.state, apiKeyGroupBrightness(action.options.group))

			if (brightness === undefined) {
				throw new Error('Group ' + action.options.group + ' Brightness is not available')
			}

			brightness = parseInt(brightness)

			if (action.action == 'groupBrightnessIncrease') {
				brightness += action.options.step
			} else {
				brightness -= action.options.step
			}

			brightness = clamp(brightness, minBrightness, maxBrightness)

			self.setProcessorProperty(apiKeyGroupBrightness(action.options.group), brightness)
		}

		if (action.action == 'blackoutToggle') {
			let enabled = getProperty(self.state, self.apiKeyBlackout)

			if (enabled === undefined) {
				throw new Error('Blackout state is not available')
			}

			self.setProcessorProperty(self.apiKeyBlackout, !enabled)
		}

		if (action.action == 'blackoutEnable') {
			self.setProcessorProperty(self.apiKeyBlackout, true)
		}

		if (action.action == 'blackoutDisable') {
			self.setProcessorProperty(self.apiKeyBlackout, false)
		}

		if (action.action == 'freezeToggle') {
			let enabled = getProperty(self.state, self.apiKeyFreeze)

			if (enabled === undefined) {
				throw new Error('Freeze state is not available')
			}

			self.setProcessorProperty(self.apiKeyFreeze, !enabled)
		}

		if (action.action == 'freezeEnable') {
			self.setProcessorProperty(self.apiKeyFreeze, true)
		}

		if (action.action == 'freezeDisable') {
			self.setProcessorProperty(self.apiKeyFreeze, false)
		}

		if (action.action == 'testPatternToggle') {
			let enabled = getProperty(self.state, self.apiKeyTestPattern)

			if (enabled === undefined) {
				throw new Error('Test Pattern state is not available')
			}

			self.setProcessorProperty(self.apiKeyTestPattern, !enabled)
		}

		if (action.action == 'testPatternEnable') {
			self.setProcessorProperty(self.apiKeyTestPattern, true)
		}

		if (action.action == 'testPatternDisable') {
			self.setProcessorProperty(self.apiKeyTestPattern, false)
		}

		if (action.action == 'testPatternFormatSelect') {
			self.setProcessorProperty(self.apiKeyTestPatternFormat, action.options.format)
		}

		if (action.action == 'testPatternTypeSelect') {
			self.setProcessorProperty(self.apiKeyTestPatternType, action.options.type)
		}

		if (action.action == 'inputPortNumberSelect') {
			self.setProcessorProperty(self.apiKeyInputPortNumber, action.options.portNumber)
		}

		if (action.action == 'inputPortTypeSelect') {
			self.setProcessorProperty(self.apiKeyInputPortType, action.options.portType)
		}
	} catch (error) {
		let msg = 'Action ' + action.action + ' failed'
		if (error.message && error.message.length > 0) {
			msg += ' (' + error.message + ')'
		}
		self.log('error', msg)
	}
}

instance_skel.extendedBy(instance)
exports = module.exports = instance

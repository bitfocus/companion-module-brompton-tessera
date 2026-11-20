'use strict'

const { combineRgb } = require('@companion-module/base')

function getProperty(object, path) {
	return path.reduce((object, label) => object && object[label], object)
}

function getFeedbacks(instance) {
	const { apiKeys } = require('./apiKeys.js')

	return {
		blackout: {
			type: 'boolean',
			name: 'Blackout Status',
			description: 'Changes button style based on blackout status',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0), // Red when enabled
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				const blackoutEnabled = getProperty(instance.state, apiKeys.blackout)

				return blackoutEnabled === true
			},
		},
		freeze: {
			type: 'boolean',
			name: 'Freeze Status',
			description: 'Changes button style based on freeze status',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0), // Red when enabled
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				const freezeEnabled = getProperty(instance.state, apiKeys.freeze)

				return freezeEnabled === true
			},
		},
		lut: {
			type: 'boolean',
			name: '3D LUT Status',
			description: 'Changes button style based on 3D LUT status',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0), // Red when enabled
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				const lutEnabled = getProperty(instance.state, apiKeys.lut3d)

				return lutEnabled === true
			},
		},
		colourReplace: {
			type: 'boolean',
			name: 'Colour Replace Status',
			description: 'Changes button style based on colour replace status',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0), // Red when enabled
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				const colourReplaceEnabled = getProperty(instance.state, apiKeys.colourReplace)

				return colourReplaceEnabled === true
			},
		},
		darkMagic: {
			type: 'boolean',
			name: 'Dark Magic Status',
			description: 'Changes button style based on dark magic status',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0), // Red when enabled
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				const darkMagicEnabled = getProperty(instance.state, apiKeys.darkMagic)

				return darkMagicEnabled === true
			},
		},
		failover: {
			type: 'boolean',
			name: 'Failover Enabled Status',
			description: 'Changes button style based on failover enabled status',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0), // Red when enabled
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				const failoverEnabled = getProperty(instance.state, apiKeys.failoverEnabled)

				return failoverEnabled === true
			},
		},
		frameRemapping: {
			type: 'boolean',
			name: 'Frame Remapping Status',
			description: 'Changes button style based on frame remapping status',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0), // Red when enabled
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				const frameRemappingEnabled = getProperty(instance.state, apiKeys.frameRemapping)

				return frameRemappingEnabled === true
			},
		},
		pureTone: {
			type: 'boolean',
			name: 'PureTone Status',
			description: 'Changes button style based on PureTone status',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0), // Red when enabled
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				const pureToneEnabled = getProperty(instance.state, apiKeys.pureTone)

				return pureToneEnabled === true
			},
		},
		testPattern: {
			type: 'boolean',
			name: 'Test Pattern Status',
			description: 'Changes button style based on test pattern status',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0), // Red when enabled
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				const testPatternEnabled = getProperty(instance.state, apiKeys.testPattern)

				return testPatternEnabled === true
			},
		},
		scaler: {
			type: 'boolean',
			name: 'Scaler Status',
			description: 'Changes button style based on scaler status',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0), // Red when enabled
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				const scalerEnabled = getProperty(instance.state, apiKeys.scaler)

				return scalerEnabled === true
			},
		},
		overdrive: {
			type: 'boolean',
			name: 'Overdrive Status',
			description: 'Changes button style based on overdrive status',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0), // Red when enabled
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				const overdriveEnabled = getProperty(instance.state, apiKeys.overdrive)

				return overdriveEnabled === true
			},
		},
	}
}

module.exports = { getFeedbacks }

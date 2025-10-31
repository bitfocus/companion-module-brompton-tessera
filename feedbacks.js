'use strict'

const { combineRgb } = require('@companion-module/base')

function getProperty(object, path) {
	return path.reduce((object, label) => object && object[label], object)
}

function getFeedbacks(instance) {
	const { apiKeys } = require('./apiKeys.js')

	return {
		blackout: {
			type: 'advanced',
			name: 'Blackout Status',
			description: 'Changes button style based on blackout status',
			options: [
				{
					type: 'colorpicker',
					label: 'Enabled - Background Color',
					id: 'enabledBg',
					default: combineRgb(255, 0, 0), // Red when enabled
				},
				{
					type: 'colorpicker',
					label: 'Disabled - Background Color',
					id: 'disabledBg',
					default: combineRgb(0, 0, 0), // Black when disabled
				},
			],
			callback: (feedback) => {
				const blackoutEnabled = getProperty(instance.state, apiKeys.blackout)

				if (blackoutEnabled === undefined) {
					return {}
				}

				return {
					bgcolor: blackoutEnabled ? feedback.options.enabledBg : feedback.options.disabledBg,
				}
			},
		},
		freeze: {
			type: 'advanced',
			name: 'Freeze Status',
			description: 'Changes button style based on freeze status',
			options: [
				{
					type: 'colorpicker',
					label: 'Enabled - Background Color',
					id: 'enabledBg',
					default: combineRgb(255, 0, 0), // Red when enabled
				},
				{
					type: 'colorpicker',
					label: 'Disabled - Background Color',
					id: 'disabledBg',
					default: combineRgb(0, 0, 0), // Black when disabled
				},
			],
			callback: (feedback) => {
				const freezeEnabled = getProperty(instance.state, apiKeys.freeze)

				if (freezeEnabled === undefined) {
					return {}
				}

				return {
					bgcolor: freezeEnabled ? feedback.options.enabledBg : feedback.options.disabledBg,
				}
			},
		},
		lut: {
			type: 'advanced',
			name: '3D LUT Status',
			description: 'Changes button style based on 3D LUT status',
			options: [
				{
					type: 'colorpicker',
					label: 'Enabled - Background Color',
					id: 'enabledBg',
					default: combineRgb(255, 0, 0), // Red when enabled
				},
				{
					type: 'colorpicker',
					label: 'Disabled - Background Color',
					id: 'disabledBg',
					default: combineRgb(0, 0, 0), // Black when disabled
				},
			],
			callback: (feedback) => {
				const lutEnabled = getProperty(instance.state, apiKeys.lut3d)

				if (lutEnabled === undefined) {
					return {}
				}

				return {
					bgcolor: lutEnabled ? feedback.options.enabledBg : feedback.options.disabledBg,
				}
			},
		},
		colourReplace: {
			type: 'advanced',
			name: 'Colour Replace Status',
			description: 'Changes button style based on colour replace status',
			options: [
				{
					type: 'colorpicker',
					label: 'Enabled - Background Color',
					id: 'enabledBg',
					default: combineRgb(255, 0, 0), // Red when enabled
				},
				{
					type: 'colorpicker',
					label: 'Disabled - Background Color',
					id: 'disabledBg',
					default: combineRgb(0, 0, 0), // Black when disabled
				},
			],
			callback: (feedback) => {
				const colourReplaceEnabled = getProperty(instance.state, apiKeys.colourReplace)

				if (colourReplaceEnabled === undefined) {
					return {}
				}

				return {
					bgcolor: colourReplaceEnabled ? feedback.options.enabledBg : feedback.options.disabledBg,
				}
			},
		},
		darkMagic: {
			type: 'advanced',
			name: 'Dark Magic Status',
			description: 'Changes button style based on dark magic status',
			options: [
				{
					type: 'colorpicker',
					label: 'Enabled - Background Color',
					id: 'enabledBg',
					default: combineRgb(255, 0, 0), // Red when enabled
				},
				{
					type: 'colorpicker',
					label: 'Disabled - Background Color',
					id: 'disabledBg',
					default: combineRgb(0, 0, 0), // Black when disabled
				},
			],
			callback: (feedback) => {
				const darkMagicEnabled = getProperty(instance.state, apiKeys.darkMagic)

				if (darkMagicEnabled === undefined) {
					return {}
				}

				return {
					bgcolor: darkMagicEnabled ? feedback.options.enabledBg : feedback.options.disabledBg,
				}
			},
		},
		failover: {
			type: 'advanced',
			name: 'Failover Enabled Status',
			description: 'Changes button style based on failover enabled status',
			options: [
				{
					type: 'colorpicker',
					label: 'Enabled - Background Color',
					id: 'enabledBg',
					default: combineRgb(255, 0, 0), // Red when enabled
				},
				{
					type: 'colorpicker',
					label: 'Disabled - Background Color',
					id: 'disabledBg',
					default: combineRgb(0, 0, 0), // Black when disabled
				},
			],
			callback: (feedback) => {
				const failoverEnabled = getProperty(instance.state, apiKeys.failoverEnabled)

				if (failoverEnabled === undefined) {
					return {}
				}

				return {
					bgcolor: failoverEnabled ? feedback.options.enabledBg : feedback.options.disabledBg,
				}
			},
		},
		frameRemapping: {
			type: 'advanced',
			name: 'Frame Remapping Status',
			description: 'Changes button style based on frame remapping status',
			options: [
				{
					type: 'colorpicker',
					label: 'Enabled - Background Color',
					id: 'enabledBg',
					default: combineRgb(255, 0, 0), // Red when enabled
				},
				{
					type: 'colorpicker',
					label: 'Disabled - Background Color',
					id: 'disabledBg',
					default: combineRgb(0, 0, 0), // Black when disabled
				},
			],
			callback: (feedback) => {
				const frameRemappingEnabled = getProperty(instance.state, apiKeys.frameRemapping)

				if (frameRemappingEnabled === undefined) {
					return {}
				}

				return {
					bgcolor: frameRemappingEnabled ? feedback.options.enabledBg : feedback.options.disabledBg,
				}
			},
		},
		pureTone: {
			type: 'advanced',
			name: 'PureTone Status',
			description: 'Changes button style based on PureTone status',
			options: [
				{
					type: 'colorpicker',
					label: 'Enabled - Background Color',
					id: 'enabledBg',
					default: combineRgb(255, 0, 0), // Red when enabled
				},
				{
					type: 'colorpicker',
					label: 'Disabled - Background Color',
					id: 'disabledBg',
					default: combineRgb(0, 0, 0), // Black when disabled
				},
			],
			callback: (feedback) => {
				const pureToneEnabled = getProperty(instance.state, apiKeys.pureTone)

				if (pureToneEnabled === undefined) {
					return {}
				}

				return {
					bgcolor: pureToneEnabled ? feedback.options.enabledBg : feedback.options.disabledBg,
				}
			},
		},
		testPattern: {
			type: 'advanced',
			name: 'Test Pattern Status',
			description: 'Changes button style based on test pattern status',
			options: [
				{
					type: 'colorpicker',
					label: 'Enabled - Background Color',
					id: 'enabledBg',
					default: combineRgb(255, 0, 0), // Red when enabled
				},
				{
					type: 'colorpicker',
					label: 'Disabled - Background Color',
					id: 'disabledBg',
					default: combineRgb(0, 0, 0), // Black when disabled
				},
			],
			callback: (feedback) => {
				const testPatternEnabled = getProperty(instance.state, apiKeys.testPattern)

				if (testPatternEnabled === undefined) {
					return {}
				}

				return {
					bgcolor: testPatternEnabled ? feedback.options.enabledBg : feedback.options.disabledBg,
				}
			},
		},
		scaler: {
			type: 'advanced',
			name: 'Scaler Status',
			description: 'Changes button style based on scaler status',
			options: [
				{
					type: 'colorpicker',
					label: 'Enabled - Background Color',
					id: 'enabledBg',
					default: combineRgb(255, 0, 0), // Red when enabled
				},
				{
					type: 'colorpicker',
					label: 'Disabled - Background Color',
					id: 'disabledBg',
					default: combineRgb(0, 0, 0), // Black when disabled
				},
			],
			callback: (feedback) => {
				const scalerEnabled = getProperty(instance.state, apiKeys.scaler)

				if (scalerEnabled === undefined) {
					return {}
				}

				return {
					bgcolor: scalerEnabled ? feedback.options.enabledBg : feedback.options.disabledBg,
				}
			},
		},
		overdrive: {
			type: 'advanced',
			name: 'Overdrive Status',
			description: 'Changes button style based on overdrive status',
			options: [
				{
					type: 'colorpicker',
					label: 'Enabled - Background Color',
					id: 'enabledBg',
					default: combineRgb(255, 0, 0), // Red when enabled
				},
				{
					type: 'colorpicker',
					label: 'Disabled - Background Color',
					id: 'disabledBg',
					default: combineRgb(0, 0, 0), // Black when disabled
				},
			],
			callback: (feedback) => {
				const overdriveEnabled = getProperty(instance.state, apiKeys.overdrive)

				if (overdriveEnabled === undefined) {
					return {}
				}

				return {
					bgcolor: overdriveEnabled ? feedback.options.enabledBg : feedback.options.disabledBg,
				}
			},
		},
	}
}

module.exports = { getFeedbacks }

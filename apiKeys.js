const apiKeys = {
	inputPortNumber: ['api', 'input', 'active', 'source', 'port-number'],
	inputPortType: ['api', 'input', 'active', 'source', 'port-type'],

	// Override
	blackout: ['api', 'override', 'blackout', 'enabled'],
	freeze: ['api', 'override', 'freeze', 'enabled'],
	testPattern: ['api', 'override', 'test-pattern', 'enabled'],
	testPatternFormat: ['api', 'override', 'test-pattern', 'format'],
	testPatternType: ['api', 'override', 'test-pattern', 'type'],
	// Colour & Output
	outputBrightness: ['api', 'output', 'global-colour', 'brightness'],
	outputColourTemperature: ['api', 'output', 'global-colour', 'colour-temperature'],

	// Network

	// Camera

	// Presets
	activePresetNumber: ['api', 'presets', 'active', 'number'],
	activePresetName: ['api', 'presets', 'active', 'name'],

	// System
}

module.exports = { apiKeys }

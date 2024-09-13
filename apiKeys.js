const apiKeys = {
	inputPortNumber: ['api', 'input', 'active', 'source', 'port-number'],
	inputPortType: ['api', 'input', 'active', 'source', 'port-type'],

	scaler: ['api', 'processing', 'scaler', 'enabled'],
	colourReplace: ['api', 'processing', 'colour-replace', 'enabled'],
	colourCorrect: ['api', 'processing', 'colour-correct', 'enabled'],
	curves: ['api', 'processing', 'curves', 'enabled'],
	lut3d: ['api', 'processing', '3d-lut', 'enabled'],
	lut3dStrength: ['api', 'processing', '3d-lut', 'strength'],

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

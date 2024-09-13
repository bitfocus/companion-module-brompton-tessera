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
	overdrive: ['api', 'output', 'global-colour', 'overdrive', 'enabled'],
	highlightOutOfGamut: ['api', 'output', 'global-colour', 'dynacal', 'highlight-out-of-gamut-pixels-enabled'],
	highlightOutOfGamut3_4: ['api', 'output', 'global-colour', 'dynacal', 'hightlight-out-of-gamut-pixels-enabled'],
	highlightOverbright: ['api', 'output', 'global-colour', 'dynacal', 'highlight-overbright-pixels-enabled'],
	oscaModule: ['api', 'processing', 'osca', 'module-correction-enabled'],
	oscaSeam: ['api', 'processing', 'osca', 'seam-correction-enabled'],
	darkMagic: ['api', 'output', 'global-colour', 'dark-magic', 'enabled'],
	extendedBitDepth: ['api', 'output', 'global-colour', 'extended-bit-depth', 'enabled'],
	pureTone: ['api', 'output', 'global-colour', 'puretone', 'enabled'],
	outputColourTemperature: ['api', 'output', 'global-colour', 'colour-temperature'],

	// Network

	// Camera

	// Presets
	activePresetNumber: ['api', 'presets', 'active', 'number'],
	activePresetName: ['api', 'presets', 'active', 'name'],

	// System
}

module.exports = { apiKeys }

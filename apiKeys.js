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
	requestFailover: ['api', 'output', 'network', 'failover', 'actions', 'request-failover'],

	// Camera
	phaseOffsetMode: ['api', 'output', 'network', 'genlock', 'phase-offset', 'mode'],
	phaseOffsetAngle: ['api', 'output', 'network', 'genlock', 'phase-offset', 'angle'],
	phaseOffsetFraction: ['api', 'output', 'network', 'genlock', 'phase-offset', 'fraction'],
	shutterSyncMode: ['api', 'output', 'network', 'shuttersync', 'mode'],
	shutterSyncAngle: ['api', 'output', 'network', 'shuttersync', 'angle-settings', 'shutter-angle'],
	shutterSyncSpeed: ['api', 'output', 'network', 'shuttersync', 'speed-settings', 'shutter-speed'],
	shutterSyncTime: ['api', 'output', 'network', 'shuttersync', 'speed-settings', 'time'],
	shutterSyncPrioritiseRefreshRate: ['api', 'output', 'network', 'shuttersync', 'prioritise-refresh-rate'],
	hiddenMarkers: ['api', 'output', 'network', 'startracker', 'enabled'],
	hiddenMarkersMode: ['api', 'output', 'network', 'hidden-markers', 'mode'],
	frameRemapping: ['api', 'output', 'network', 'frame-remapping', 'enabled'],

	// Presets
	activePresetNumber: ['api', 'presets', 'active', 'number'],
	activePresetName: ['api', 'presets', 'active', 'name'],

	// System
	shutDown: ['api', 'system', 'actions', 'shutdown'],
	reboot: ['api', 'system', 'actions', 'reboot'],
}

module.exports = { apiKeys }

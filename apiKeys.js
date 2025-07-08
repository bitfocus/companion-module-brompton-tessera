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
	frameStoreCapture: ['api', 'override', 'test-pattern', 'frame-store', 'capture-frame'],

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

	// Fan Status/Speeds
	caseFan1Speed: ['api', 'system', 'fan',  'case', 'one', 'speed'],
	caseFan1Status: ['api', 'system', 'fan', 'case', 'one', 'status'],
	caseFan2Speed: ['api', 'system', 'fan', 'case', 'two', 'speed'],
	caseFan2Status: ['api', 'system', 'fan', 'case', 'two', 'status'],
	fpgaFanSpeed: ['api', 'system', 'fan', 'fpga', 'speed'],
	fpgaFanStatus: ['api', 'system', 'fan', 'fpga', 'status'],

	//Temperatures
	ambientTemperature: ['api', 'system', 'temperature', 'ambient'],
	cpuTemperature: ['api', 'system', 'temperature', 'cpu'],
	dspTemperature: ['api', 'system', 'temperature', 'dsp'],
	ethernetCopperATemperature: ['api', 'system', 'temperature', 'ethernet', 'copper', 'a'],
	ethernetCopperBTemperature: ['api', 'system', 'temperature', 'ethernet', 'copper', 'b'],
	ethernetSFPATemperature: ['api', 'system', 'temperature', 'ethernet', 'sfp', 'a'],
	ethernetSFPBTemperature: ['api', 'system', 'temperature', 'ethernet', 'sfp', 'b'],
	ethernetSFPCTemperature: ['api', 'system', 'temperature', 'ethernet', 'sfp', 'c'],
	ethernetSFPDTemperature: ['api', 'system', 'temperature', 'ethernet', 'sfp', 'd'],
	fpgaTemperature: ['api', 'system', 'temperature', 'fpga'],
	frontTemperature: ['api', 'system', 'temperature', 'front'],
	gpuTemperature: ['api', 'system', 'temperature', 'gpu'],
	mainBoardTemperature: ['api', 'system', 'temperature', 'main'],
	psuTemperature: ['api', 'system', 'temperature', 'psu'],
	rearTemperature: ['api', 'system', 'temperature', 'rear'],

	// System Information
	uptime: ['api', 'system', 'uptime'],
	serialNumber: ['api', 'system', 'serial-number'],
	softwareVersion: ['api', 'system', 'software-version'],
	processorName: ['api', 'system', 'processor-name'],
	processorType: ['api', 'system', 'processor-type'],

	//Project
	projectName: ['api', 'project', 'name'],

	// Panels
	onlinePanelCount: ['api', 'panels', 'statistics', 'online-count'],

	// Cable Loop Redundancy
	cableLoopRedundancyState1: ['api', 'output', 'network', 'cable-redundancy', 'loops', '1', 'state'],
	cableLoopRedundancyState2: ['api', 'output', 'network', 'cable-redundancy', 'loops', '2', 'state'],
}

module.exports = { apiKeys }

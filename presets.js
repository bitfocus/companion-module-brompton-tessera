const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
	self.setPresetDefinitions({
		testPatternTypeSelectorAll: {
			type: 'button',
			category: 'Test Pattern Selector',
			name: 'Test Pattern Type Selector: All',
			previewStyle: {
				text: 'All',
				size: '18',
				bgcolor: combineRgb(0, 0, 0),
				color: combineRgb(255, 255, 255),
				// png64: icons.testPatternIconSMPTEBars,
			},
			style: {
				text: '$(Tessera:testPatternType)',
				size: '14',
				bgcolor: combineRgb(0, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			steps: [
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'brompton',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'white',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'red',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'green',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'blue',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'cyan',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'magenta',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'yellow',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'black',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'grid',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'scrolling-grid',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'forty-five-degree-grid',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'scrolling-forty-five-degree-grid',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'checkerboard',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'scrolling-checkerboard',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'gradient',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'scrolling-gradient',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'colour-bars',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'scrolling-colour-bars',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'strobe',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'smpte-bars',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'scrolling-smpte-bars',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'custom-colour',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'custom-gradient',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'scrolling-custom-gradient',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'custom',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					options: {
						fg: combineRgb(255, 255, 255),
						bg: combineRgb(0, 153, 0),
					},
				},
			],
		},
		testPatternTypeSelectorColour: {
			type: 'button',
			category: 'Test Pattern Selector',
			name: 'Test Pattern Type Selector: Colours',
			previewStyle: {
				text: 'Colours',
				size: '18',
				bgcolor: combineRgb(0, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			style: {
				text: '$(Tessera:testPatternType)',
				size: '14',
				bgcolor: combineRgb(0, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			steps: [
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'white',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'red',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'green',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'blue',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'cyan',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'magenta',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'yellow',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'black',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'colour-bars',
							},
						},
					],
					up: [],
				},
				{
					down: [
						{
							actionId: 'testPatternTypeSelect',
							options: {
								type: 'smpte-bars',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					options: {
						fg: combineRgb(255, 255, 255),
						bg: combineRgb(0, 153, 0),
					},
				},
			],
		},
	})
}

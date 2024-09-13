module.exports = [
	// v1 to v2 (change to v3 of companion module)
	// update separate Toggle/Enable/Disable actions to combined T/E/D action
	function v1to2(context, props) {
		const result = {
			updatedActions: [],
			updatedConfig: null,
			updatedFeedbacks: [],
		}

		for (const action of props.actions) {
			switch (action.actionId) {
				// blackout
				case 'blackoutToggle':
					action.actionId = 'blackoutToggle'
					action.options.mode = 'toggle'
					result.updatedActions.push(action)
					break
				case 'blackoutEnable':
					action.actionId = 'blackoutToggle'
					action.options.mode = 'enable'
					result.updatedActions.push(action)
					break
				case 'blackoutDisable':
					action.actionId = 'blackoutToggle'
					action.options.mode = 'disable'
					result.updatedActions.push(action)
					break

				// freeze
				case 'freezeToggle':
					action.actionId = 'freezeToggle'
					action.options.mode = 'toggle'
					result.updatedActions.push(action)
					break
				case 'freezeEnable':
					action.actionId = 'freezeToggle'
					action.options.mode = 'enable'
					result.updatedActions.push(action)
					break
				case 'freezeDisable':
					action.actionId = 'freezeToggle'
					action.options.mode = 'disable'
					result.updatedActions.push(action)
					break

				// test pattern
				case 'testPatternToggle':
					action.actionId = 'testPatternToggle'
					action.options.mode = 'toggle'
					result.updatedActions.push(action)
					break
				case 'testPatternEnable':
					action.actionId = 'testPatternToggle'
					action.options.mode = 'enable'
					result.updatedActions.push(action)
					break
				case 'testPatternDisable':
					action.actionId = 'testPatternToggle'
					action.options.mode = 'disable'
					result.updatedActions.push(action)
					break
			}
		}

		return result
	},
]

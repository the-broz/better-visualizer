import { createId } from "@paralleldrive/cuid2"

/**
 * Plugin configuration.
 */
export default {
    ce_prefix: createId(),
    identifier: 'me.thebroz.better-visualizer',
    name: 'Better Visualizer',
    description: 'Replaces the default visualizer with opne that reacts to your music. Requires Cider Audio.',
    version: '0.0.1',
    author: 'thebroz',
    repo: 'https://github.com/ciderapp/plugin-template',
    entry: {
        'plugin.js': {
            type: 'main',
        }
    }
}
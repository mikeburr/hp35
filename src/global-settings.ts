import {
    default as streamDeck,
    type DidReceiveGlobalSettingsEvent,
} from "@elgato/streamdeck"

export type GlobalSettings = {
    layers: string[],
    currentLayer: number,
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
    layers: [ 'default' ],
    currentLayer: 0,
}

let currentSettings: GlobalSettings = DEFAULT_GLOBAL_SETTINGS

type Listener = (settings: GlobalSettings) => void
const listeners = [] as Listener[]

export function addGlobalSettingsListener(listener: Listener) {
    listeners.push(listener)
    listener(currentSettings)
}

streamDeck.settings.getGlobalSettings<GlobalSettings>()

streamDeck.settings.onDidReceiveGlobalSettings((ev: DidReceiveGlobalSettingsEvent<GlobalSettings>) => {
    streamDeck.logger.info(`global-settings: received global settings ${JSON.stringify(ev.settings, null, 2)}`)

    if (! ('currentLayer' in ev.settings)) {
        streamDeck.settings.setGlobalSettings(currentSettings = DEFAULT_GLOBAL_SETTINGS)
    }
    else {
        currentSettings = ev.settings
    }

    for (const listener of listeners) {
        listener(currentSettings)
    }
})

import {
    default as streamDeck,
    action,
    type KeyDownEvent,
    SingletonAction,
} from "@elgato/streamdeck";
import { addGlobalSettingsListener, type GlobalSettings, setGlobalSettings } from "../global-settings"

@action({ UUID: "org.mikeburr.hp35.nextlayer" })
export class NextLayer extends SingletonAction {
    globalSettings?: GlobalSettings

    constructor() {
        super()

        addGlobalSettingsListener(globalSettings => {
            this.globalSettings = globalSettings
        })
    }

    override async onKeyDown(ev: KeyDownEvent) {
        streamDeck.logger.info(`next layer: onKeyDown()`)
        if (! this.globalSettings) {
            return
        }

        this.globalSettings = await setGlobalSettings({
            ...this.globalSettings,
            currentLayer: (this.globalSettings.currentLayer + 1) % this.globalSettings.layers.length,
        })
    }
    
}

@action({ UUID: "org.mikeburr.hp35.prevlayer" })
export class PreviousLayer extends SingletonAction {
    globalSettings?: GlobalSettings

    constructor() {
        super()

        addGlobalSettingsListener(globalSettings => {
            this.globalSettings = globalSettings
        })
    }

    override async onKeyDown(ev: KeyDownEvent) {
        streamDeck.logger.info(`previous layer: onKeyDown()`)
        if (! this.globalSettings) {
            return
        }

        this.globalSettings = await setGlobalSettings({
            ...this.globalSettings,
            currentLayer: (this.globalSettings.currentLayer + this.globalSettings.layers.length - 1) % this.globalSettings.layers.length,
        })
    }
    
}

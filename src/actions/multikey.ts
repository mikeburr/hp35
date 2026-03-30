import {
    default as streamDeck,
    action,
    KeyDownEvent,
    SingletonAction,
    DidReceiveSettingsEvent,
    DidReceiveGlobalSettingsEvent,
    WillAppearEvent
} from "@elgato/streamdeck";
import { addGlobalSettingsListener, type GlobalSettings } from "../global-settings"
import { type HP35 } from "../hp35"
import process from 'process'

type  KeyData = {
    image: string,
    keyDown: (hp35: HP35) => void,
}

const KEYS: Record<string, KeyData> = {
    zero: {
        image: 'images/actions/keys/zero',
        keyDown: (hp35: HP35) => hp35.digit(0),
    },
    one: {
        image: 'images/actions/keys/one',
        keyDown: (hp35: HP35) => hp35.digit(1),
    },
    two: {
        image: 'images/actions/keys/two',
        keyDown: (hp35: HP35) => hp35.digit(2),
    },
    three: {
        image: 'images/actions/keys/three',
        keyDown: (hp35: HP35) => hp35.digit(3),
    },
    add: {
        image: 'images/actions/keys/add',
        keyDown: (hp35: HP35) => hp35.add(),
    },
    clx: {
        image: 'images/actions/keys/clx',
        keyDown: (hp35: HP35) => hp35.clx(),
    }
}

type Settings = {
    keys: Array<keyof typeof KEYS>,
}

const BLANK = 'images/actions/keys/blank'
const IMAGES = ['zero', 'one', 'two', 'three']

@action({ UUID: "org.mikeburr.hp35.multikey" })
export class MultiKey extends SingletonAction<Settings> {
    globalSettings?: GlobalSettings

    constructor(private hp35: HP35) {
        super()

        addGlobalSettingsListener(globalSettings => {
            this.globalSettings = globalSettings
            this.updateImages()
        })

        streamDeck.logger.info(`multikey: constructed`)
    }

    override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> {
        streamDeck.logger.info(`multikey.onDidReceiveSettings: got settings: ${JSON.stringify(ev.payload.settings, null, 2)}`)

        ev.action.setImage(this.getImage(ev.payload.settings))
    }

    override async onKeyDown(ev: KeyDownEvent<Settings>) {
        streamDeck.logger.info(`multikey: onKeyDown`)

    }

    override onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> | void {
        ev.action.setImage(this.getImage(ev.payload.settings))
    }

    getImage(settings: Settings) {
        let settings_: Settings = { keys: ['one', 'add', 'clx'] }
        return this.globalSettings && this.globalSettings.currentLayer < settings_.keys.length
            ? KEYS[settings_.keys[this.globalSettings.currentLayer]].image
            : 'images/actions/keys/blank'

    }

    updateImages() {
        const layer = this.globalSettings?.currentLayer || 0;

        [...this.actions].forEach(action => {
            action.getSettings().then(settings => {
                action.setImage(this.getImage(settings))
            })
        })

    }
}

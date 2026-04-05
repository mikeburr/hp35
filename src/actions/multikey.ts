import {
    default as streamDeck,
    action,
    KeyDownEvent,
    SingletonAction,
    DidReceiveSettingsEvent,
    WillAppearEvent,
    PropertyInspectorDidAppearEvent
} from "@elgato/streamdeck";
import { addGlobalSettingsListener, type GlobalSettings } from "../global-settings"
import { type HP35 } from "../hp35"

type  KeyData = {
    image: string,
    keyDown: (hp35: HP35) => void,
}

// TODO: would be better to defer to the real SingletonAction for this
const KEYS: Record<string, KeyData> = {
    "(blank)": {
        image: "images/actions/keys/blank",
        keyDown: () => {},
    },
    "0": {
        image: "images/actions/keys/zero",
        keyDown: (hp35: HP35) => hp35.digit(0),
    },
    "1": {
        image: "images/actions/keys/one",
        keyDown: (hp35: HP35) => hp35.digit(1),
    },
    "2": {
        image: "images/actions/keys/two",
        keyDown: (hp35: HP35) => hp35.digit(2),
    },
    "3": {
        image: "images/actions/keys/three",
        keyDown: (hp35: HP35) => hp35.digit(3),
    },
    "4": {
        image: "images/actions/keys/four",
        keyDown: (hp35: HP35) => hp35.digit(4),
    },
    "5": {
        image: "images/actions/keys/five",
        keyDown: (hp35: HP35) => hp35.digit(5),
    },
    "6": {
        image: "images/actions/keys/six",
        keyDown: (hp35: HP35) => hp35.digit(6),
    },
    "7": {
        image: "images/actions/keys/seven",
        keyDown: (hp35: HP35) => hp35.digit(7),
    },
    "8": {
        image: "images/actions/keys/eight",
        keyDown: (hp35: HP35) => hp35.digit(8),
    },
    "9": {
        image: "images/actions/keys/nine",
        keyDown: (hp35: HP35) => hp35.digit(9),
    },
    decimal: {
        image: "images/actions/keys/decimal",
        keyDown: (hp35: HP35) => hp35.decimal(),
    },
    pi: {
    	image: "images/actions/keys/pi",
        keyDown: (hp35: HP35) => hp35.pi(),
    },
    chs: {
        image: "images/actions/keys/chs",
        keyDown: (hp35: HP35) => hp35.chs(),
    },
    eex: {
        image: "images/actions/keys/eex",
        keyDown: (hp35: HP35) => hp35.eex(),
    },
    enter: {
        image: "images/actions/keys/enter",
        keyDown: (hp35: HP35) => hp35.enter(),
    },
    swapxy: {
        image: "images/actions/keys/swapxy",
        keyDown: (hp35: HP35) => hp35.swapxy(),
    },
    roll: {
        image: "images/actions/keys/roll",
        keyDown: (hp35: HP35) => hp35.roll(),
    },
    clx: {
        image: "images/actions/keys/clx",
        keyDown: (hp35: HP35) => hp35.clx(),
    },
    clr: {
        image: "images/actions/keys/clr",
        keyDown: (hp35: HP35) => hp35.clr(),
    },
    store: {
        image: "images/actions/keys/store",
        keyDown: (hp35: HP35) => hp35.store(),
    },
    recall: {
        image: "images/actions/keys/recall",
        keyDown: (hp35: HP35) => hp35.recall(),
    },
    add: {
        image: "images/actions/keys/add",
        keyDown: (hp35: HP35) => hp35.add(),
    },
    subtract: {
        image: "images/actions/keys/subtract",
        keyDown: (hp35: HP35) => hp35.subtract(),
    },
    multiply: {
        image: "images/actions/keys/multiply",
        keyDown: (hp35: HP35) => hp35.multiply(),
    },
    divide: {
        image: "images/actions/keys/divide",
        keyDown: (hp35: HP35) => hp35.divide(),
    },
    invert: {
        image: "images/actions/keys/invert",
        keyDown: (hp35: HP35) => hp35.invert(),
    },
    xtoy: {
        image: "images/actions/keys/xtoy",
        keyDown: (hp35: HP35) => hp35.xtoy(),
    },
    log: {
        image: "images/actions/keys/log",
        keyDown: (hp35: HP35) => hp35.log(),
    },
    ln: {
        image: "images/actions/keys/ln",
        keyDown: (hp35: HP35) => hp35.ln(),
    },
    exp: {
        image: "images/actions/keys/exp",
        keyDown: (hp35: HP35) => hp35.exp(),
    },
    root: {
        image: "images/actions/keys/root",
        keyDown: (hp35: HP35) => hp35.root(),
    },
    arc: {
        image: "images/actions/keys/arc",
        keyDown: (hp35: HP35) => hp35.arc(),
    },
    sin: {
        image: "images/actions/keys/sin",
        keyDown: (hp35: HP35) => hp35.sin(),
    },
    cos: {
        image: "images/actions/keys/cos",
        keyDown: (hp35: HP35) => hp35.cos(),
    },
    tan: {
        image: "images/actions/keys/tan",
        keyDown: (hp35: HP35) => hp35.tan(),
    },
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
            streamDeck.ui.sendToPropertyInspector({ globalSettings })
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
        if (this.globalSettings) {
            KEYS[ev.payload.settings.keys[this.globalSettings.currentLayer]].keyDown(this.hp35)
        }
    }

    override onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> | void {
        streamDeck.logger.info(`MultiKey.onWillAppear: ${JSON.stringify(ev, null, 2)}`)
        setTimeout(() => ev.action.setImage(this.getImage(ev.payload.settings)), 500)
    }

    override onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent<Settings>): Promise<void> | void {
        // global setting updates are flaky in property inspectors so use the action's
        streamDeck.ui.sendToPropertyInspector({ globalSettings: this.globalSettings })
    }

    /**
     * Given the settings for an action, returns the image to be used for the current layer
     * in the global settings.
     *
     * @param settings action settings
     * @returns image to use for the current layer
     */
    getImage(settings: Settings) {
        streamDeck.logger.info(`MultiKey.getImage: settings: ${JSON.stringify(settings, null, 2)}\nglobalSettings: ${JSON.stringify(this.globalSettings, null, 2)}`)

        if (! this.globalSettings || ! settings.keys || this.globalSettings.currentLayer >= settings.keys.length) {
            return 'images/actions/keys/blank'
        }

        return KEYS[settings.keys[this.globalSettings.currentLayer]].image
    }

    /**
     * Updates the images for all our actions.
     */
    updateImages() {
        const layer = this.globalSettings?.currentLayer || 0;

        [...this.actions].forEach(action => {
            action.getSettings().then(settings => {
                action.setImage(this.getImage(settings))
            }).catch(e => streamDeck.logger.error(e))
        })
    }
}

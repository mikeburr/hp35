import {
    default as streamDeck,
    action,
    type KeyDownEvent,
    SingletonAction,
    type WillAppearEvent,
    type WillDisappearEvent,
} from "@elgato/streamdeck";
import { addGlobalSettingsListener, type GlobalSettings, setGlobalSettings } from "../global-settings"

const SVG_STYLES = `
    <style>
        .layer-text {
            font: italic bold 12px sans-serif;
            fill: #e3e5b9;
            font-size:  18px;
            paint-order: stroke;
            stroke: black;
            stroke-width: 2;
            stroke-linecap: butt;
            stroke-linejoin: miter;
            text-anchor: middle;
        }
        .arrow {
            font: bold 18pt sans-serif;
            text-anchor: middle;
            fill: black;
        }
        .selected-box {
            fill: #229bbd;
            rx: 5;
        }
        .unselected-box {
            fill: #264342;
            rx: 5;
            stroke: black;
            stroke-width: 1;
        }
    </style>
`

type Settings = {
}

@action({ UUID: "org.mikeburr.hp35.nextlayer" })
export class NextLayer extends SingletonAction<Settings> {
    globalSettings?: GlobalSettings

    constructor() {
        super()

        addGlobalSettingsListener(globalSettings => {
            this.globalSettings = globalSettings
            this.refresh()
        })
    }

    override onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> | void {
        setTimeout(() => this.refresh(), 500)
    }

    override onWillDisappear(ev: WillDisappearEvent<Settings>): Promise<void> | void {
        setTimeout(() => this.refresh(), 500)
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

    refresh() {
        if (! this.globalSettings) {
            return
        }

        const numLayers = this.globalSettings.layers.length

        const selectedLayer = `
            <rect x="5" y="5" width="90" height="24" class="selected-box"></rect>
            <text x="50" y="22" class="layer-text">${this.globalSettings.layers[this.globalSettings.currentLayer]}</text>
        `

        const arrow = numLayers > 1
            ? `<text x="50" y="38" class="arrow">&#x2304;</text>`
            : ``
        
        let nextLayers = ''
        if (numLayers > 1) {
            const layerText = this.globalSettings.layers[(this.globalSettings.currentLayer + 1) % numLayers]
            nextLayers += `
                <rect x="5" y="42" width="90" height="24" class="unselected-box"></rect>
                <text x="50" y="59" class="layer-text">${layerText}</text>
            `
        }
        if (numLayers > 2) {
            const layerText = this.globalSettings.layers[(this.globalSettings.currentLayer + 2) % numLayers]
            nextLayers += `
                <rect x="5" y="71" width="90" height="24" class="unselected-box"></rect>
                <text x="50" y="88" class="layer-text">${layerText}</text>
            `
        }

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    ${SVG_STYLES}
                    <rect x="0" y="0" width="100" height="100" fill="#264342"></rect>
                    ${selectedLayer}
                    ${arrow}
                    ${nextLayers}
            </svg>`

        streamDeck.logger.info(`NextLayer: rendering:\n${svg}`)

        const image = `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`

        for (const action of this.actions) {
            action.setImage(image)
        }
    }
}

@action({ UUID: "org.mikeburr.hp35.prevlayer" })
export class PreviousLayer extends SingletonAction {
    globalSettings?: GlobalSettings

    constructor() {
        super()

        addGlobalSettingsListener(globalSettings => {
            this.globalSettings = globalSettings
            this.refresh()
        })
    }

    override onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> | void {
        setTimeout(() => this.refresh(), 500)
    }

    override onWillDisappear(ev: WillDisappearEvent<Settings>): Promise<void> | void {
        setTimeout(() => this.refresh(), 500)
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
    
    refresh() {
        if (! this.globalSettings) {
            return
        }

        const numLayers = this.globalSettings.layers.length

        let nextLayers = ''
        if (numLayers > 1) {
            const layerText = this.globalSettings.layers[(this.globalSettings.currentLayer + numLayers - 1) % numLayers]
            nextLayers += `
                <rect x="5" y="34" width="90" height="24" class="unselected-box"></rect>
                <text x="50" y="51" class="layer-text">${layerText}</text>
            `
        }
        if (numLayers > 2) {
            const layerText = this.globalSettings.layers[(this.globalSettings.currentLayer + numLayers - 2) % numLayers]
            nextLayers += `
                <rect x="5" y="5" width="90" height="24" class="unselected-box"></rect>
                <text x="50" y="22" class="layer-text">${layerText}</text>
            `
        }

        const arrow = numLayers > 1
            ? `<text x="50" y="79" class="arrow">&#x2303;</text>`
            : ``
        
        const selectedLayer = `
            <rect x="5" y="71" width="90" height="24" class="selected-box"></rect>
            <text x="50" y="88" class="layer-text">${this.globalSettings.layers[this.globalSettings.currentLayer]}</text>
        `

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    ${SVG_STYLES}
                    <rect x="0" y="0" width="100" height="100" fill="#264342"></rect>
                    ${nextLayers}
                    ${arrow}
                    ${selectedLayer}
            </svg>`

        streamDeck.logger.info(`PreviousLayer: rendering:\n${svg}`)

        const image = `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`

        for (const action of this.actions) {
            action.setImage(image)
        }
    }
}

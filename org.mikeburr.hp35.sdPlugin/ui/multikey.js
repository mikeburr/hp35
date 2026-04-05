const KEYS = [
    "(blank)",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "decimal", "pi", "chs", "eex",
    "enter", "swapxy", "roll", "clx", "clr",
    "store", "recall",
    "add", "subtract", "multiply", "divide",
    "invert", "xtoy", "log", "ln", "exp", "root",
    "arc", "sin", "cos", "tan",
]

let settings, globalSettings

function renderKeys() {
    if (! settings || ! globalSettings) {
        return
    }

    const section = document.getElementById('keys')
    section.innerHTML =
        globalSettings.layers.map((layer, i) => `
            <div class="layer">
                <label class="layer-name">${layer || '(unnamed)'}:</label>
                <select name="key-${i}"
                        onchange="selectKey(event, ${i})">
                    ${KEYS.map(key =>
                        `<option value=${key}${key === settings.keys[i] ? ' selected' : ''}>${key}</option>`
                    ).join('\n')}
                </select>
            </div>
        `).join('\n')
}

function selectKey(event, i) {
    while (i >= settings.keys.length) {
        settings.keys.push("(blank)")
    }

    settings.keys[i] = event.target.value

    SDPIComponents.streamDeckClient.setSettings(settings)
}

SDPIComponents.streamDeckClient.didReceiveSettings.subscribe(event => {
    settings = event.payload.settings

    if (! ('keys' in settings)) {
        settings = {
            keys: []
        }

        SDPIComponents.streamDeckClient.setSettings(settings)
    }

    renderKeys()
})

SDPIComponents.streamDeckClient.sendToPropertyInspector.subscribe(event => {
    if (event.payload.globalSettings) {
        globalSettings = event.payload.globalSettings
        renderKeys()
    }
})

// initialize UI
SDPIComponents.streamDeckClient.getSettings()

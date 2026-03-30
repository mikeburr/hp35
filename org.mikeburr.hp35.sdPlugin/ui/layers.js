let settings = {};
let renameTimeout

function renderLayers() {
    const section = document.getElementById('layers')
    section.innerHTML =
        settings.layers.map((layer, i) => `
            <div class="layer">
                <input type="text"
                       name="layer-${i}"
                       oninput="renameLayer(event, ${i})"
                       value="${layer}"
                       placeholder="(enter name)">
                </input>
                <button type="button"
                        onclick="removeLayer(event, ${i})"
                        ${settings.layers.length > 1 ? '' : 'disabled'}
                        title="Remove layer">
                    -
                </button>
                <a class="${settings.currentLayer === i ? 'current' : 'not-current'}"
                    onclick="selectLayer(event, ${i})">
                    current
                </a>
                </br>
            </div>
        `).join('\n') +
        `<button onclick="addLayer(event)">Add layer</button>`
}

function addLayer(ev) {
    settings.layers.push('')

    SDPIComponents.streamDeckClient.setGlobalSettings(settings)
    renderLayers()
}

function removeLayer(ev, index) {
    settings.layers.splice(index, 1)
    if (settings.currentLayer >= settings.layers.length) {
        settings.currentLayer = settings.layers.length - 1
    }

    SDPIComponents.streamDeckClient.setGlobalSettings(settings)
    renderLayers()
}

function renameLayer(ev, index) {
    settings.layers[index] = ev.target.value

    if (renameTimeout) {
        clearTimeout(renameTimeout)
    }

    renameTimeout = setTimeout(() => {
        SDPIComponents.streamDeckClient.setGlobalSettings(settings)
    }, 500)
}

function selectLayer(ev, index) {
    settings.currentLayer = index

    SDPIComponents.streamDeckClient.setGlobalSettings(settings)
    renderLayers()
}

SDPIComponents.streamDeckClient.didReceiveGlobalSettings.subscribe(event => {
    settings = event.payload.settings

    if (! ('currentLayer' in settings)) {
        settings = {
            layers: [ 'default layer' ],
            currentLayer: 0,
        }

        SDPIComponents.streamDeckClient.setGlobalSettings(settings)
    }

    renderLayers()
})

// initialize UI
SDPIComponents.streamDeckClient.getGlobalSettings()

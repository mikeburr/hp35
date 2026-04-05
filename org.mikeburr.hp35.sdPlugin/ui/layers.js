let globalSettings = {}
let renameTimeout

function renderLayers() {
    const section = document.getElementById('layers')
    section.innerHTML =
        globalSettings.layers.map((layer, i) => `
            <div class="layer">
                <input type="text"
                       name="layer-${i}"
                       oninput="renameLayer(event, ${i})"
                       value="${layer}"
                       placeholder="(enter name)">
                </input>
                <button type="button"
                        onclick="removeLayer(event, ${i})"
                        ${globalSettings.layers.length > 1 ? '' : 'disabled'}
                        title="Remove layer">
                    -
                </button>
                <a class="${globalSettings.currentLayer === i ? 'current' : 'not-current'}"
                    onclick="selectLayer(event, ${i})">
                    current
                </a>
                </br>
            </div>
        `).join('\n') +
        `<button onclick="addLayer(event)">Add layer</button>`
}

function addLayer(ev) {
    globalSettings.layers.push('')

    SDPIComponents.streamDeckClient.setGlobalSettings(globalSettings)
    renderLayers()
}

function removeLayer(ev, index) {
    globalSettings.layers.splice(index, 1)
    if (globalSettings.currentLayer >= globalSettings.layers.length) {
        globalSettings.currentLayer = globalSettings.layers.length - 1
    }

    SDPIComponents.streamDeckClient.setGlobalSettings(globalSettings)
    renderLayers()
}

function renameLayer(ev, index) {
    globalSettings.layers[index] = ev.target.value

    if (renameTimeout) {
        clearTimeout(renameTimeout)
    }

    renameTimeout = setTimeout(() => {
        SDPIComponents.streamDeckClient.setGlobalSettings(globalSettings)
    }, 500)
}

function selectLayer(ev, index) {
    globalSettings.currentLayer = index

    SDPIComponents.streamDeckClient.setGlobalSettings(globalSettings)
    renderLayers()
}

SDPIComponents.streamDeckClient.sendToPropertyInspector.subscribe(event => {
    if (event.payload.globalSettings) {
        globalSettings = event.payload.globalSettings
        renderLayers()
    }
})

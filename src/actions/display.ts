import {
    default as streamDeck,
    action,
    type KeyAction,
    SingletonAction,
    WillAppearEvent,
    WillDisappearEvent
} from "@elgato/streamdeck";
import { JsonObject } from "@elgato/utils"
import { type Display as HP35Display, type HP35 } from '../hp35'

/**
 *   T T T T T UR
 *   UL        UR
 *   UL        UR
 *   UL        UR
 *   UL        UR
 *   ULM M M M UR
 *   LL        LR
 *   LL        LR
 *   LL        LR
 *   LL        LR
 *   B B B B B LR
 */

const Segments = {
    TOP: `M 0 0 L 5 0 L 5 1 L 0 1 Z`,
    UL: `M 0 1 L 1 1 L 1 6 L 0 6 Z`,
    UR: `M 5 0 L 6 0 L 6 6 L 5 6 Z`,
    MID: `M 1 5 L 5 5 L 5 6 L 1 6 Z`,
    LL: `M 0 6 L 1 6 L 1 10 L 0 10 Z`,
    BOT: `M 0 10 L 5 10 L 5 11 L 0 11 Z`,
    LR: `M 5 6 L 6 6 L 6 11 L 5 11 Z`,
    DOT: `M 1.5 8 L 3.5 8 L 3.5 10 L 1.5 10 Z`,
}

const character = (...segments: Array<keyof typeof Segments>) =>
    (svgAttrs: string) =>
        `<svg ${svgAttrs} viewBox="0 0 6 11"><path d="${segments.map(seg => Segments[seg]).join(' ')}"/></svg>`

const Characters = {
    '0': character('TOP','UL','UR','LL','LR','BOT'),
    '1': character('UR','LR'),
    '2': character('TOP','UR','MID','LL','BOT'),
    '3': character('TOP','UR','MID','LR','BOT'),
    '4': character('UL','UR','MID','LR'),
    '5': character('TOP','UL','MID','LR','BOT'),
    '6': character('TOP','UL','MID','LL','LR','BOT'),
    '7': character('TOP','UR','LR'),
    '8': character('TOP','UL','UR','MID','LL','LR','BOT'),
    '9': character('TOP','UL','UR','MID','LR','BOT'),
    '-': character('MID'),
    '.': character('DOT'),
    ' ': character(),
}

function svgify(...strings: string[]) {
    const width = Math.max(...strings.map(s => s.length))

    let svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <svg viewBox="0 0 ${0.25 + width * 1.25} ${strings.length * 1.5 - 0.5}" fill="#f13e33">
                ${strings.map((s, si) =>
                    [...s].map((c, ci) =>
                        Characters[c as keyof typeof Characters](`x="${0.25 + ci * 1.25}" y="${si * 1.5}" height="1" width="1"`)
                    ).join('')
                ).join('\n')}
            </svg>
        </svg>`

    // streamDeck.logger.info(`svgify: ${JSON.stringify(strings)} => ${svg}`)
    return `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`
}

/**
 * 
 */
@action({ UUID: "org.mikeburr.hp35.display" })
export class Display extends SingletonAction {
    refreshScheduled = false
    // state information to flash the display on error
    flashInterval?: ReturnType<typeof setInterval>
    showBlanks = false

    constructor(private hp35: HP35) {
        super()
        this.hp35.addDisplayListener(x => this.update(x))
        streamDeck.logger.info('mjb: added Display as hp35 listener')
    }

    override onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void> | void {
        streamDeck.logger.info(`mjb: Display.onWillAppear: ${JSON.stringify(ev, null, 2)}`)
        if (! this.refreshScheduled) {
            this.refreshScheduled = true
            setTimeout(() => {
                this.hp35.refreshDisplays()
                this.refreshScheduled = false
             }, 500)
        }
    }

    override onWillDisappear(ev: WillDisappearEvent<JsonObject>): Promise<void> | void {
        streamDeck.logger.info(`mjb: Display.onWillDisappear: ${JSON.stringify(ev, null, 2)}`)
        if (! this.refreshScheduled) {
            this.refreshScheduled = true
            setTimeout(() => {
                this.hp35.refreshDisplays()
                this.refreshScheduled = false
             }, 500)
        }
    }

    update(display: HP35Display, redisplay = false) {
        let s = display.sign + display.mantissa.padEnd(11) + display.exponentSign + display.exponent.padEnd(2)

        // skip flashing setup if this is a call from setInterval
        if (! redisplay) {
            // stop any ongoing flashing
            if (this.flashInterval) {
                clearInterval(this.flashInterval)
                this.flashInterval = undefined
                this.showBlanks = false
            }

            // if new display is an error, start flashing
            if (display.error) {
                this.flashInterval = setInterval(() => {
                    this.showBlanks = ! this.showBlanks
                    this.update(display, true)
                }, 500)
            }
        }

        if (this.showBlanks) {
            s = '               '
        }

        const actions = Array.from(this.actions).filter(a => a.coordinates).sort((a1, a2) =>
            Math.sign((a1.coordinates!.row * 100 + a1.coordinates!.column) -
                      (a2.coordinates!.row * 100 + a2.coordinates!.column))
        ) as Array<KeyAction>

        for (let i = 0; i < actions.length; ) {
            const group = [actions[i]]
            let { row, column } = actions[i].coordinates!
            i++

            while (group.length < 3 &&
                   i < actions.length &&
                   actions[i].coordinates!.row === row &&
                   actions[i].coordinates!.column === column + 1) {
                group.push(actions[i])
                column++
                i++
            }

            streamDeck.logger.info(`Display.update: found group of buttons at ${JSON.stringify(group.map(g => `${g.coordinates!.row}/${g.coordinates!.column}`))}`)

            // possible geometries
            // single display button:
            //    - 1 2 3 4
            //    5 6 7 8 9
            //    0 . - 1 2
            //
            // 2 horizontally adjacent buttons:
            //    - 1 2 3   4 5 6 7
            //    8 9 0 .   - 1 2
            //
            // 3 horizontally adjacent buttons:
            //    - 1 2 3 4   5 6 7 8 9   0 . - 1 2

            if (group.length === 1) {
                group[0].setImage(svgify(
                    s.substring(0, 5),
                    s.substring(5, 10),
                    s.substring(10, 15),
                ))
            }
            else if (group.length === 2) {
                group[0].setImage(svgify(
                    s.substring(0, 4),
                    s.substring(8, 12),
                ))
                group[1].setImage(svgify(
                    s.substring(4, 8),
                    s.substring(12, 15),
                ))
            }
            else { // group.length === 3
                group[0].setImage(svgify(
                    s.substring(0, 5),
                ))
                group[1].setImage(svgify(
                    s.substring(5, 10),
                ))
                group[2].setImage(svgify(
                    s.substring(10, 15),
                ))
            }
        }
    }
}

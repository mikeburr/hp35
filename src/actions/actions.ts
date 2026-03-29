import {
    default as streamDeck,
    action,
    type KeyAction,
    KeyDownEvent,
    SingletonAction,
    WillAppearEvent
} from "@elgato/streamdeck";
import { type Display as HP35Display, type HP35 } from '../hp35'
import { JsonObject } from "@elgato/utils";

function hp35Button(
    keyDown: keyof HP35,
) {
    return class HP35Button extends SingletonAction {
        constructor(private hp35: HP35) {
            super()
        }

        override async onKeyDown(ev: KeyDownEvent) {
            streamDeck.logger.info(`key ${keyDown}: onKeyDown()`)
            return (this.hp35[keyDown] as () => void)()
        }
    }
}

function hp35Digit(value: number) {
    return class Digit extends SingletonAction {
        constructor(private hp35: HP35) {
            super()
        }

        override async onKeyDown(ev: KeyDownEvent): Promise<void> {
            streamDeck.logger.info(`digit ${value}: onKeyDown()`)
            this.hp35.digit(value)
        }
    }
}

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

/**
 * 
 */
@action({ UUID: "org.mikeburr.hp35.display" })
export class Display extends SingletonAction {
    // state information to flash the display on error
    flashInterval?: ReturnType<typeof setInterval>
    showBlanks = false

    constructor(private hp35: HP35) {
        super()
        this.hp35.addDisplayListener(x => this.update(x))
    }

    svgify(...strings: string[]) {
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

        streamDeck.logger.info(`svgify: ${JSON.stringify(strings)} => ${svg}`)
		return `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`
    }

    override onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void> | void {
        ev.action.setTitle('')
        setTimeout(() => this.update({ error: false, sign: ' ', mantissa: '0.', exponentSign: ' ', exponent: '' }), 100)
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
                group[0].setImage(this.svgify(
                    s.substring(0, 5),
                    s.substring(5, 10),
                    s.substring(10, 15),
                ))
            }
            else if (group.length === 2) {
                group[0].setImage(this.svgify(
                    s.substring(0, 4),
                    s.substring(8, 12),
                ))
                group[1].setImage(this.svgify(
                    s.substring(4, 8),
                    s.substring(12, 15),
                ))
            }
            else { // group.length === 3
                group[0].setImage(this.svgify(
                    s.substring(0, 5),
                ))
                group[1].setImage(this.svgify(
                    s.substring(5, 10),
                ))
                group[2].setImage(this.svgify(
                    s.substring(10, 15),
                ))
            }
        }
    }
}

@action({ UUID: "org.mikeburr.hp35.power" })
export class XtoY extends hp35Button('xtoy') {}

@action({ UUID: "org.mikeburr.hp35.log" })
export class Log extends hp35Button('log') {}

@action({ UUID: "org.mikeburr.hp35.ln" })
export class Ln extends hp35Button('ln') {}

@action({ UUID: "org.mikeburr.hp35.exp" })
export class Exp extends hp35Button('exp') {}

@action({ UUID: "org.mikeburr.hp35.clr" })
export class CLR extends hp35Button('clr') {}

@action({ UUID: "org.mikeburr.hp35.root" })
export class Root extends hp35Button('root') {}

@action({ UUID: "org.mikeburr.hp35.arc" })
export class Arc extends hp35Button('arc') {}

@action({ UUID: "org.mikeburr.hp35.sin" })
export class Sin extends hp35Button('sin') {}

@action({ UUID: "org.mikeburr.hp35.cos" })
export class Cos extends hp35Button('cos') {}

@action({ UUID: "org.mikeburr.hp35.tan" })
export class Tan extends hp35Button('tan') {}

@action({ UUID: "org.mikeburr.hp35.invert" })
export class Invert extends hp35Button('invert') {}

@action({ UUID: "org.mikeburr.hp35.swapxy" })
export class SwapXY extends hp35Button('swapxy') {}

@action({ UUID: "org.mikeburr.hp35.roll" })
export class Roll extends hp35Button('roll') {}

@action({ UUID: "org.mikeburr.hp35.store" })
export class Store extends hp35Button('store') {}

@action({ UUID: "org.mikeburr.hp35.recall" })
export class Recall extends hp35Button('recall') {}

@action({ UUID: "org.mikeburr.hp35.enter" })
export class Enter extends hp35Button('enter') {}

@action({ UUID: "org.mikeburr.hp35.chs" })
export class CHS extends hp35Button('chs') {}

@action({ UUID: "org.mikeburr.hp35.eex" })
export class EEX extends hp35Button('eex') {}

@action({ UUID: "org.mikeburr.hp35.clx" })
export class CLX extends hp35Button('clx') {}

@action({ UUID: "org.mikeburr.hp35.subtract" })
export class Subtract extends hp35Button('subtract') {}

@action({ UUID: "org.mikeburr.hp35.7" })
export class Seven extends hp35Digit(7) {}

@action({ UUID: "org.mikeburr.hp35.8" })
export class Eight extends hp35Digit(8) {}

@action({ UUID: "org.mikeburr.hp35.9" })
export class Nine extends hp35Digit(9) {}

@action({ UUID: "org.mikeburr.hp35.add"})
export class Add extends hp35Button('add') {}

@action({ UUID: "org.mikeburr.hp35.4" })
export class Four extends hp35Digit(4) {}

@action({ UUID: "org.mikeburr.hp35.5" })
export class Five extends hp35Digit(5) {}

@action({ UUID: "org.mikeburr.hp35.6" })
export class Six extends hp35Digit(6) {}

@action({ UUID: "org.mikeburr.hp35.multiply"})
export class Multiply extends hp35Button('multiply') {}

@action({ UUID: "org.mikeburr.hp35.1" })
export class One extends hp35Digit(1) {}

@action({ UUID: "org.mikeburr.hp35.2" })
export class Two extends hp35Digit(2) {}

@action({ UUID: "org.mikeburr.hp35.3" })
export class Three extends hp35Digit(3) {}

@action({ UUID: "org.mikeburr.hp35.divide"})
export class Divide extends hp35Button('divide') {}

@action({ UUID: "org.mikeburr.hp35.0" })
export class Zero extends hp35Digit(0) {}

@action({ UUID: "org.mikeburr.hp35.decimal"})
export class Decimal extends hp35Button('decimal') {}

@action({ UUID: "org.mikeburr.hp35.pi"})
export class Pi extends hp35Button('pi') {}

import { default as streamDeck, action, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
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
            streamDeck.logger.debug(`key ${keyDown}: onKeyDown()`)
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
            streamDeck.logger.debug(`digit ${value}: onKeyDown()`)
            this.hp35.digit(value)
        }
    }
}

/**
 * 
 */
@action({ UUID: "org.mikeburr.hp35.display" })
export class Display extends SingletonAction {
    constructor(private hp35: HP35) {
        super()
        this.hp35.addDisplayListener(x => this.update(x))
    }

    stringify(d: HP35Display) {
        const result =
            (d.sign !== ' ' ? d.sign : '') +
            d.mantissa +
            (d.exponent !== '' ? d.exponentSign + d.exponent : '')
        streamDeck.logger.debug(`display: ${JSON.stringify(d)} => '${result}'`)
        return result
    }

    override onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void> | void {
        ev.action.setTitle(this.stringify(this.hp35.x))
    }

    update(display: HP35Display) {
        const me = this.actions.forEach(action => action.setTitle(this.stringify(display)))
    }
}

@action({ UUID: "org.mikeburr.hp35.power" })
export class Power extends hp35Button('power') {}

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

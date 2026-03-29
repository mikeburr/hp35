import {
    default as streamDeck,
    action,
    KeyDownEvent,
    SingletonAction,
} from "@elgato/streamdeck";
import { type HP35 } from '../hp35'

function hp35Key(
    keyDown: keyof HP35,
) {
    return class HP35Key extends SingletonAction {
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

// numeric entry actions
@action({ UUID: "org.mikeburr.hp35.0" })
export class Zero extends hp35Digit(0) {}

@action({ UUID: "org.mikeburr.hp35.1" })
export class One extends hp35Digit(1) {}

@action({ UUID: "org.mikeburr.hp35.2" })
export class Two extends hp35Digit(2) {}

@action({ UUID: "org.mikeburr.hp35.3" })
export class Three extends hp35Digit(3) {}

@action({ UUID: "org.mikeburr.hp35.4" })
export class Four extends hp35Digit(4) {}

@action({ UUID: "org.mikeburr.hp35.5" })
export class Five extends hp35Digit(5) {}

@action({ UUID: "org.mikeburr.hp35.6" })
export class Six extends hp35Digit(6) {}

@action({ UUID: "org.mikeburr.hp35.7" })
export class Seven extends hp35Digit(7) {}

@action({ UUID: "org.mikeburr.hp35.8" })
export class Eight extends hp35Digit(8) {}

@action({ UUID: "org.mikeburr.hp35.9" })
export class Nine extends hp35Digit(9) {}

@action({ UUID: "org.mikeburr.hp35.decimal"})
export class Decimal extends hp35Key('decimal') {}

@action({ UUID: "org.mikeburr.hp35.pi"})
export class Pi extends hp35Key('pi') {}

@action({ UUID: "org.mikeburr.hp35.chs" })
export class CHS extends hp35Key('chs') {}

@action({ UUID: "org.mikeburr.hp35.eex" })
export class EEX extends hp35Key('eex') {}

// stack operation actions
@action({ UUID: "org.mikeburr.hp35.enter" })
export class Enter extends hp35Key('enter') {}

@action({ UUID: "org.mikeburr.hp35.swapxy" })
export class SwapXY extends hp35Key('swapxy') {}

@action({ UUID: "org.mikeburr.hp35.roll" })
export class Roll extends hp35Key('roll') {}

@action({ UUID: "org.mikeburr.hp35.clx" })
export class CLX extends hp35Key('clx') {}

@action({ UUID: "org.mikeburr.hp35.clr" })
export class CLR extends hp35Key('clr') {}

// memory actions
@action({ UUID: "org.mikeburr.hp35.store" })
export class Store extends hp35Key('store') {}

@action({ UUID: "org.mikeburr.hp35.recall" })
export class Recall extends hp35Key('recall') {}

// arithmetic operation actions
@action({ UUID: "org.mikeburr.hp35.add"})
export class Add extends hp35Key('add') {}

@action({ UUID: "org.mikeburr.hp35.subtract" })
export class Subtract extends hp35Key('subtract') {}

@action({ UUID: "org.mikeburr.hp35.multiply"})
export class Multiply extends hp35Key('multiply') {}

@action({ UUID: "org.mikeburr.hp35.divide"})
export class Divide extends hp35Key('divide') {}

// algebraic operation actions
@action({ UUID: "org.mikeburr.hp35.invert" })
export class Invert extends hp35Key('invert') {}

@action({ UUID: "org.mikeburr.hp35.xtoy" })
export class XtoY extends hp35Key('xtoy') {}

@action({ UUID: "org.mikeburr.hp35.log" })
export class Log extends hp35Key('log') {}

@action({ UUID: "org.mikeburr.hp35.ln" })
export class Ln extends hp35Key('ln') {}

@action({ UUID: "org.mikeburr.hp35.exp" })
export class Exp extends hp35Key('exp') {}

@action({ UUID: "org.mikeburr.hp35.root" })
export class Root extends hp35Key('root') {}

// triginometric operation actions
@action({ UUID: "org.mikeburr.hp35.arc" })
export class Arc extends hp35Key('arc') {}

@action({ UUID: "org.mikeburr.hp35.sin" })
export class Sin extends hp35Key('sin') {}

@action({ UUID: "org.mikeburr.hp35.cos" })
export class Cos extends hp35Key('cos') {}

@action({ UUID: "org.mikeburr.hp35.tan" })
export class Tan extends hp35Key('tan') {}

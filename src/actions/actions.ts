import { default as streamDeck, action, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { type Display as HP35Display, type HP35 } from '../hp35'
import { JsonObject } from "@elgato/utils";

class Digit extends SingletonAction {
    constructor(private hp35: HP35, private digit: number) {
        super()
    }

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
        this.hp35.digit(this.digit)
	}
}

/**
 * 
 */
@action({ UUID: "org.mikeburr.hp35.0" })
export class Zero extends Digit {
    constructor(hp35: HP35) {
        super(hp35, 0)
    }
}

@action({ UUID: "org.mikeburr.hp35.1" })
export class One extends Digit {
    constructor(hp35: HP35) {
        super(hp35, 1)
    }
}

@action({ UUID: "org.mikeburr.hp35.2" })
export class Two extends Digit {
    constructor(hp35: HP35) {
        super(hp35, 2)
    }
}

@action({ UUID: "org.mikeburr.hp35.3" })
export class Three extends Digit {
    constructor(hp35: HP35) {
        super(hp35, 3)
    }
}

@action({ UUID: "org.mikeburr.hp35.4" })
export class Four extends Digit {
    constructor(hp35: HP35) {
        super(hp35, 4)
    }
}

@action({ UUID: "org.mikeburr.hp35.5" })
export class Five extends Digit {
    constructor(hp35: HP35) {
        super(hp35, 5)
    }
}

@action({ UUID: "org.mikeburr.hp35.6" })
export class Six extends Digit {
    constructor(hp35: HP35) {
        super(hp35, 6)
    }
}

@action({ UUID: "org.mikeburr.hp35.7" })
export class Seven extends Digit {
    constructor(hp35: HP35) {
        super(hp35, 7)
    }
}

@action({ UUID: "org.mikeburr.hp35.8" })
export class Eight extends Digit {
    constructor(hp35: HP35) {
        super(hp35, 8)
    }
}

@action({ UUID: "org.mikeburr.hp35.9" })
export class Nine extends Digit {
    constructor(hp35: HP35) {
        super(hp35, 9)
    }
}

@action({ UUID: "org.mikeburr.hp35.decimal"})
export class Decimal extends SingletonAction {
    constructor(private hp35: HP35) {
        super()
    }

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
        this.hp35.decimal()
	}
}

@action({ UUID: "org.mikeburr.hp35.clx"})
export class CLx extends SingletonAction {
    constructor(private hp35: HP35) {
        super()
    }

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
        this.hp35.clx()
	}
}

@action({ UUID: "org.mikeburr.hp35.display" })
export class Display extends SingletonAction {
    constructor(private hp35: HP35) {
        super()
        this.hp35.addDisplayListener(x => this.update(x))
    }

    override onWillAppear(ev: WillAppearEvent<JsonObject>): Promise<void> | void {
        ev.action.setTitle(this.hp35.display.mantissa)
    }

    update(display: HP35Display) {
        const me = this.actions.forEach(action => action.setTitle(display.mantissa))
    }
}

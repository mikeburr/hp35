import streamDeck from '@elgato/streamdeck'

type Sign = ' ' | '-'
type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.'

export type Display = {
    error: boolean,
    sign: Sign,
    // 10 digits plus a decimal point
    mantissa: string,
    exponent: `{Sign}{Digit}{Digit}` | '   ',
}

const IMPROPER_OPERATION = (): Display => ({
    error: true,
    sign: ' ',
    mantissa: '0.',
    exponent: '   ',
})

const ZERO = (): Display => ({
    error: false,
    sign: ' ',
    mantissa: '0.',
    exponent: '   ',
})

enum States {
    // operation completed, replace x if number entry occurs next
    REPLACE,
    // operation completed, raise the stack if number entry occurs next
    RAISE,
    // entering integer portion of number
    ENTERING_INTEGER,
    // entering fractional portion of number
    ENTERING_FRACTION,
    // entering exponent for number
    ENTERING_EXPONENT,
    // previous operation was not valid
    IMPROPER_OPERATION,
}

export class HP35 {
    state = States.REPLACE

    pendingChs = false

    displayListeners: Array<(display: Display) => void> = []
    display: Display = ZERO()

    x: number = 0
    y: number = 0
    z: number = 0
    t: number = 0


    // utility methods
    ifOperatorAllowed(fn: () => void) {
        switch (this.state) {
            case States.REPLACE:
            case States.RAISE:
            case States.ENTERING_FRACTION:
            case States.ENTERING_INTEGER:
                fn()
                break
        }

    }

    improperOperation() {
        this.display = IMPROPER_OPERATION()
        this.state = States.IMPROPER_OPERATION
    }

    pop1(fn: (x: number) => (number) = x => x) {
        this.x = fn(this.x)
        this.display = this.toDisplay(this.x)
    }

    pop2(fn: (x: number, y: number) => (number) = x => x) {
        [this.t, this.z, this.y, this.x] = [ this.t, this.t, this.z, fn(this.x, this.y)]
        this.display = this.toDisplay(this.x)
    }

    raise() {
        [this.t, this.z, this.y] = [this.z, this.y, this.pendingChs ? -this.x : this.x]
    }

    toDisplay(n: number): Display {
        if (! Number.isFinite(n)) {
            return IMPROPER_OPERATION()
        }

        if (n >= 1e100) {
            n = 9.999999999e99
        }
        else if (n < 1e-99) {
            n = 0
        }

        const sign = n < 0 ? '-': ' '

        n = Math.abs(n)
        let exp = 0

        if (n > 0 && n < 0.01) {
            while (n < 1) { n *= 10, exp -= 1 }
        }
        else if (n > 1e10) {
            while (n >= 10) { n /= 10, exp += 1 }
        }

        let mantissa =
            // make sure we have enough digits
            n.toFixed(10 - (n < 1 ? 0 : `${Math.floor(n)}`.length)).
            // replace trailing 0's after the decimal point
            replace(/(\..*?)0+$/, '$1').
            // replace trailing decimal point (will be added back below if needed)
            replace(/\.$/, '').
            // replace leading 0 when decimal is present
            replace(/^0\./, '.')

        if (mantissa.indexOf('.') < 0) {
            mantissa = `${mantissa}.`
        }
        const exponent = exp === 0
            ? '   '
            // sign plus exactly 2 digits
            : exp < 0 ? '-' : ' ' + `00${Math.abs(exp)}`.replace(/.*(..)/, '$1')
        
        return {
            error: false,
            sign: n < 0 ? '-' : ' ',
            mantissa,
            exponent: exponent as any,
        }
    }

    toNumber(d: Display): number {
        const value = Number.parseFloat(d.mantissa)
        return (d.exponent === '   ' ? value : value * Math.pow(10, Number.parseInt(d.exponent))) *
               (d.sign === '-' ? -1 : 1)
    }

    addDisplayListener(handler: (display: Display) => void): () => void {
        this.displayListeners.push(handler)
        return () => { this.displayListeners.filter(h => h !== handler) }
    }

    refreshDisplays() {
        this.displayListeners.forEach(dl => dl(this.display))
    }


    // number entry

    chs() {
        switch (this.state) {
            case States.RAISE:
            case States.REPLACE:
                this.pendingChs = ! this.pendingChs
                this.display.sign = this.display.sign === ' ' ? '-' : ' '
                this.x = this.toNumber(this.display)
                this.refreshDisplays()
                break

            case States.ENTERING_INTEGER:
            case States.ENTERING_FRACTION:
                this.display.sign = this.display.sign === ' ' ? '-' : ' '
                this. x = this.toNumber(this.display)
                this.refreshDisplays()
                break
        }
    }

    decimal() {
        switch (this.state) {
            case States.RAISE:
                this.raise()
                // fallthrough

            case States.REPLACE:
                this.state = States.ENTERING_FRACTION
                this.x = 0
                this.display = {
                    error: false,
                    sign: this.pendingChs ? '-' : ' ',
                    mantissa: '.',
                    exponent: '   ',
                }
                this.pendingChs = false

                this.refreshDisplays()
                break

            case States.ENTERING_INTEGER:
                if (this.display.mantissa.length < 11) {
                    this.state = States.ENTERING_FRACTION
                    // display already shows decimal point
                }
                break
        }
    }

    digit(digit: number) {
        let updated = false

        switch (this.state) {
            case States.RAISE:
                this.raise()
                // fallthrough

            case States.REPLACE:
                this.state = States.ENTERING_INTEGER

                this.display = {
                    error: false,
                    sign: this.pendingChs ? '-' : ' ',
                    mantissa: `${digit}.`,
                    exponent: '   ',
                }
                this.pendingChs = false
                updated = true
                break

            case States.ENTERING_INTEGER:
                if (this.display.mantissa.length < 11) {
                    this.display.mantissa = `${this.display.mantissa.replace('.', '')}${digit}.`
                    updated = true
                }
                break

            case States.ENTERING_FRACTION:
                if (this.display.mantissa.length < 11) {
                    this.display.mantissa = `${this.display.mantissa}${digit}`
                    updated = true
                }
                break
        }

        if (updated) {
            this.x = this.toNumber(this.display)
            this.refreshDisplays()
        }
    }

    eex() {
        // TODO - implement me
    }

    pi() {
        // TODO - implement me
    }


    // stack manipulation

    clr() {
        // TODO - implement me
    }

    clx() {
        this.state = States.REPLACE
        this.pendingChs = false
        this.display = ZERO()
        this.x = 0

        this.refreshDisplays()
    }

    enter() {
        if (this.state === States.REPLACE) {
            // todo: what?
        }
        else if (this.state === States.ENTERING_INTEGER || this.state === States.ENTERING_FRACTION) {
            this.raise()
            this.state = States.REPLACE
        }
    }

    rotate() {
        // TODO - implement me
    }

    swapxy() {
        // TODO - implement me
    }


    // memory functions

    store() {
        // TODO - implement me
    }

    recall() {
        // TODO - implement me
    }


    // mathematical operators

    add() {
        this.ifOperatorAllowed(() => {
            this.pop2((x, y) => y + x)
            this.refreshDisplays()
            this.state = States.RAISE
        })                
    }

    arc() {
        // TODO - implement me
    }

    cos() {
        // TODO - implement me
    }

    divide() {
        this.ifOperatorAllowed(() => {
            if (this.x === 0) {
                this.improperOperation()
            }
            else {
                this.pop2((x, y) => y / x)
                this.refreshDisplays()
                this.state = States.RAISE
            }
        })
    }

    exp() {
        this.ifOperatorAllowed(() => {
            this.pop2((x, y) => Math.pow(x, y))
            this.refreshDisplays()
            this.state = States.RAISE
        })
    }

    invert() {
        this.ifOperatorAllowed(() => {
            if (this.x === 0) {
                this.improperOperation()
            }
            else {
                this.pop1(x => 1 / x)
                this.refreshDisplays()
                this.state = States.RAISE
            }
        })
    }

    ln() {
        this.ifOperatorAllowed(() => {
            if (this.x === 0) {
                this.improperOperation()
            }
            else {
                this.pop1(x => Math.log(x))
                this.refreshDisplays()
                this.state = States.RAISE
            }
        })
    }

    log() {
        // TODO - implement me
    }

    multiply() {
        this.ifOperatorAllowed(() => {
            this.pop2((x, y) => y * x)
            this.refreshDisplays()
            this.state = States.RAISE
        })                
        // TODO - implement me
    }

    power() {
        // TODO - implement me
    }

    root() {
        // TODO - implement me
    }

    sin() {
        this.ifOperatorAllowed(() => {
            this.pop1(x => Math.sin(x / 180 * Math.PI))
            this.refreshDisplays()
            this.state = States.RAISE
        })
    }

    subtract() {
        this.ifOperatorAllowed(() => {
            this.pop2((x, y) => y - x)
            this.refreshDisplays()
            this.state = States.RAISE
        })
    }

    tan() {
        // TODO - implement me
    }
}
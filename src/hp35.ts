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

enum States {
    REPLACE_X,
    SHIFT_X,
    ENTERING_INTEGER,
    ENTERING_FRACTION,
    IMPROPER_OPERATION,
}

export class HP35 {
    state = States.REPLACE_X

    displayListeners: Array<(display: Display) => void> = []
    display: Display = {
        error: false,
        sign: ' ',
        mantissa: '0',
        exponent: '   ',
    }

    x: number = 0
    y: number = 0
    z: number = 0
    t: number = 0

    clx() {
        this.state = States.REPLACE_X
        this.display = {
            error: false,
            sign: ' ',
            mantissa: '0.',
            exponent: '   ',
        }
        this.x = 0

        this.refreshDisplays()
    }

    digit(digit: number) {
        let updated = false

        if (this.state === States.SHIFT_X) {
            this.push()
            this.state = States.REPLACE_X
        }

        if (this.state === States.REPLACE_X) {
            this.state = States.ENTERING_INTEGER

            this.display = {
                error: false,
                sign: ' ',
                mantissa: `${digit}.`,
                exponent: '   ',
            }
            updated = true
        }
        else if (this.state === States.ENTERING_INTEGER) {
            if (this.display.mantissa.length < 11) {
                this.display.mantissa = `${this.display.mantissa.replace('.', '')}${digit}.`
                updated = true
            }

        }
        else if (this.state === States.ENTERING_FRACTION) {
            if (this.display.mantissa.length < 11) {
                this.display.mantissa = `${this.display.mantissa}${digit}`
                updated = true
            }
        }

        if (updated) {
            this.x = this.toNumber(this.display)
            this.refreshDisplays()
        }
    }

    decimal() {
        if (this.state === States.SHIFT_X) {
            this.push()
            this.state = States.REPLACE_X
        }

        if (this.state === States.REPLACE_X) {
            this.state = States.ENTERING_FRACTION
            this.x = 0
            this.display = {
                error: false,
                sign: ' ',
                mantissa: '.',
                exponent: '   ',
            }

            this.refreshDisplays()
        }
        else if (this.state === States.ENTERING_INTEGER) {
            if (this.display.mantissa.length < 11) {
                this.state = States.ENTERING_FRACTION
                // display already shows decimal point
            }
        }
    }

    enter() {
        if (this.state === States.REPLACE_X) {
            // todo: what?
        }
        else if (this.state === States.ENTERING_INTEGER || this.state === States.ENTERING_FRACTION) {
            this.push()
            this.state = States.REPLACE_X
        }
    }

    plus() {

    }

    pop() {
        [this.z, this.y, this.x]
    }
    push() {
        [this.t, this.z, this.y] = [this.z, this.y, this.x]
    }

    toDisplay(n: number): Display {
        if (! Number.isFinite(n)) {
            return {
                error: true,
                sign: ' ',
                mantissa: '0',
                exponent: '   ',
            }
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
            while (n >= 10) { n /= 10; exp += 1 }
        }

        let mantissa =
            // make sure we have enough digits
            n.toFixed(10).
            // replace trailing 0's after the decimal point
            replace(/(\..*?)0+$/, '$1').
            // replace trailing decimal point (will be added back below if needed)
            replace(/\.$/, '').
            // replace leading 0 when decimal is present
            replace(/0\./, '.')

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
        return d.exponent === '   ' ? value : value * Math.pow(10, Number.parseInt(d.exponent))
    }

    refreshDisplays() {
        this.displayListeners.forEach(dl => dl(this.display))
    }

    addDisplayListener(handler: (display: Display) => void): () => void {
        this.displayListeners.push(handler)
        return () => { this.displayListeners.filter(h => h !== handler) }
    }
}
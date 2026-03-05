import streamDeck from '@elgato/streamdeck'

// https://veniamin-ilmer.github.io/hp35/

type Sign = ' ' | '-'
type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.'

export type Display = {
    error: boolean,

    // sign for entire value
    sign: Sign,
    // 10 digits plus a decimal point
    mantissa: string,

    // sign for exponent
    exponentSign: Sign,
    // 2 digits
    exponent: string,
}

export const toDegrees = (radians: number) => radians / Math.PI * 180

/**
 * Returns a Display that corresponds to the specified number. This function
 * is not suitable for recalculating the current display after numeric entry
 * as it will drop the exponent & exponent sign if they are not needed.
 * 
 * @param n number
 * @returns Display corresponding to n
 */
export function toDisplay(n: number): Display {
    if (! Number.isFinite(n)) {
        return IMPROPER_OPERATION()
    }

    if (n >= 1e100) {
        n = 9.999999999e99
    }
    else if (n <= -1e100) {
        n = -9.999999999e99
    }
    else if (Math.abs(n) < 1e-99) {
        n = 0
    }

    const sign = n < 0 ? '-': ' '

    n = Math.abs(n)
    let exp = 0

    if (n > 0 && n < 0.01) {
        // really n < 1, but account for display rounding
        while (n < 0.99999999995) { n *= 10, exp -= 1 }
    }
    else if (n > 1e10) {
        // really n >= 10, but account for display rounding
        while (n >= 9.9999999995) { n /= 10, exp += 1 }
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
    
    return {
        error: false,
        sign,
        mantissa,
        exponentSign: exp < 0 ? '-' : ' ',
        exponent: exp !== 0 ? `00${Math.abs(exp)}`.replace(/.*(..)/, '$1') : '',
    }
}

/**
 * Returns the Javascript number corresponding to a Display.
 * 
 * @param d Display
 * @returns numeric value of d
 */
export function toNumber(d: Display): number {
    if (d.mantissa === '.') {
        return 0
    }

    let value = Number.parseFloat(d.mantissa)

    if (d.exponent !== '') {
        value = value * Math.pow(10, Number.parseInt(`${d.exponentSign}${d.exponent}`))
    }

    if (d.sign === '-') {
        value = -value
    }

    return value
}

export const toRadians = (degrees: number) => degrees / 180 * Math.PI

const IMPROPER_OPERATION = (): Display => ({
    error: true,
    sign: ' ',
    mantissa: '0.',
    exponentSign: ' ',
    exponent: '',
})

const ONE = (): Display => ({
    error: false,
    sign: ' ',
    mantissa: '1.',
    exponentSign: ' ',
    exponent: '',
})

const PI = (): Display => ({
    error: false,
    sign: ' ',
    mantissa: '3.141592654',
    exponentSign: ' ',
    exponent: '',
})

const ZERO = (): Display => ({
    error: false,
    sign: ' ',
    mantissa: '0.',
    exponentSign: ' ',
    exponent: '',
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

    pendingArc = false
    pendingChs = false

    displayListeners: Array<(display: Display) => void> = []

    x: Display = ZERO()
    y: Display = ZERO()
    z: Display = ZERO()
    t: Display = ZERO()
    s: Display = ZERO()

    // utility methods
    ifOperatorAllowed(fn: () => void) {
        switch (this.state) {
            case States.REPLACE:
            case States.RAISE:
            case States.ENTERING_FRACTION:
            case States.ENTERING_INTEGER:
            case States.ENTERING_EXPONENT:
                fn()
                break
        }
    }

    improperOperation() {
        this.x = IMPROPER_OPERATION()
        this.state = States.IMPROPER_OPERATION
    }

    invertSign(display: Display): Display {
        return {
            ...display,
            sign: display.sign === ' ' ? '-' : ' ',
        }
    }

    /**
     * Replaces x with the result of performing the specified operation
     * on the current value of x.
     * 
     * @param fn function to perform
     * @param options 
     *    trig - if true z is copied to t after the operation completes
     */
    pop1(fn: (x: number) => (number), options: {
        trig: boolean,
    } = { trig: false }) {
        this.x = toDisplay(fn(toNumber(this.x)))
        if (options.trig) {
            this.t = this.z
        }
    }

    /**
     * Replaces x with the result of performing the specified operation
     * on the current values of x and y.
     * 
     * @param fn function to perform
     */
    pop2(fn: (x: number, y: number) => (number)) {
        [this.t, this.z, this.y, this.x] = [
            this.t,
            this.t,
            this.z,
            toDisplay(fn(toNumber(this.x), toNumber(this.y)))
        ]
    }

    raise() {
        [this.t, this.z, this.y] = [
            this.z,
            this.y,
            this.pendingChs ? this.invertSign(this.x) : this.x,
        ]
    }

    addDisplayListener(handler: (display: Display) => void): () => void {
        this.displayListeners.push(handler)
        return () => { this.displayListeners = this.displayListeners.filter(h => h !== handler) }
    }

    refreshDisplays() {
        this.displayListeners.forEach(dl => dl(this.x))
    }


    // number entry

    chs() {
        switch (this.state) {
            case States.RAISE:
            case States.REPLACE:
                this.pendingChs = ! this.pendingChs
                // fallthrough

            case States.ENTERING_INTEGER:
            case States.ENTERING_FRACTION:
                this.x = this.invertSign(this.x)
                this.refreshDisplays()
                break

            case States.ENTERING_EXPONENT:
                this.x.exponentSign = this.x.exponentSign === ' ' ? '-' : ' '
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
                this.x = { 
                    error: false,
                    sign: this.pendingChs ? '-' : ' ',
                    mantissa: '.',
                    exponentSign: ' ',
                    exponent: '',
                }
                this.pendingChs = false

                this.refreshDisplays()
                break

            case States.ENTERING_INTEGER:
                if (this.x.mantissa.length < 11) {
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

                this.x = {
                    error: false,
                    sign: this.pendingChs ? '-' : ' ',
                    mantissa: `${digit}.`,
                    exponentSign: ' ',
                    exponent: '',
                }
                this.pendingChs = false

                updated = true
                break

            case States.ENTERING_INTEGER:
                if (this.x.mantissa.length < 11) {
                    this.x.mantissa = `${this.x.mantissa.replace('.', '')}${digit}.`
                    updated = true
                }
                break

            case States.ENTERING_FRACTION:
                if (this.x.mantissa.length < 11) {
                    this.x.mantissa = `${this.x.mantissa}${digit}`
                    updated = true
                }
                break

            case States.ENTERING_EXPONENT:
                this.x.exponent = `${this.x.exponent[1]}${digit}`
                updated = true
                break
        }

        if (updated) {
            this.refreshDisplays()
        }
    }

    digits(digits: string) {
        for (const digit of digits) {
            if (digit === '.') {
                this.decimal()
            }
            else if (Number.isNaN(+digit)) {
                throw new Error(`digit '${digit}' not recognized`)
            }
            else {
                this.digit(+digit)
            }
        }
    }

    eex() {
        switch (this.state) {
            case States.RAISE:
                this.raise()
                // fallthrough

            case States.REPLACE:
                this.x = ONE()
                // fallthrough

            case States.ENTERING_INTEGER:
            case States.ENTERING_FRACTION:
                this.state = States.ENTERING_EXPONENT
                this.x.exponentSign = ' '
                this.x.exponent = '00'
                this.refreshDisplays()
                break
        }
    }

    pi() {
        switch (this.state) {
            case States.RAISE:
            case States.ENTERING_INTEGER:
            case States.ENTERING_FRACTION:
            case States.ENTERING_EXPONENT:
                this.raise()
                // fallthrough

            case States.REPLACE:
                this.x = PI()
                this.state = States.RAISE
                this.refreshDisplays()
                break
        }
    }


    // stack manipulation

    clr() {
        this.state = States.REPLACE
        this.pendingChs = false
        this.pendingArc = false

        this.x = ZERO()
        this.y = ZERO()
        this.z = ZERO()
        this.t = ZERO()
        this.s = ZERO()

        this.refreshDisplays()
    }

    clx() {
        this.state = States.REPLACE
        this.pendingChs = false
        this.pendingArc = false
        this.x = ZERO()

        this.refreshDisplays()
    }

    enter() {
        switch (this.state) {
            case States.REPLACE:
            case States.ENTERING_INTEGER:
            case States.ENTERING_FRACTION:
            case States.ENTERING_EXPONENT:
                this.raise()
                this.state = States.REPLACE
                break
        }
    }

    roll() {
        [ this.t, this.z, this.y, this.x ] = [ this.x, this.t, this.z, this.y ]

        this.refreshDisplays()
    }

    swapxy() {
        [ this.y, this.x ] = [ this.x, this.y ]

        this.refreshDisplays()
    }


    // memory functions

    store() {
        this.s = this.x
        this.state = States.REPLACE
    }

    recall() {
        switch (this.state) {
            case States.RAISE:
            case States.REPLACE:
            case States.ENTERING_EXPONENT:
            case States.ENTERING_FRACTION:
            case States.ENTERING_INTEGER:
                this.raise()
                this.x = this.s
                this.state = States.RAISE

                this.refreshDisplays()
                break
        }
    }


    // mathematical operators

    add() {
        this.ifOperatorAllowed(() => {
            this.pop2((x, y) => y + x)
            this.state = States.RAISE

            this.refreshDisplays()
        })                
    }

    arc() {
        switch (this.state) {
            case States.RAISE:
            case States.REPLACE:
            case States.ENTERING_INTEGER:
            case States.ENTERING_FRACTION:
            case States.ENTERING_EXPONENT:
                this.pendingArc = true
                break
        }
    }

    cos() {
        this.ifOperatorAllowed(() => {
            if (this.pendingArc) {
                if (Math.abs(toNumber(this.x)) > 1) {
                    this.improperOperation()
                }
                else {
                    this.pop1(x => toDegrees(Math.acos(x)), { trig: true})
                }

                this.pendingArc = false
            }
            else {
                this.pop1(x => Math.cos(toRadians(x)), { trig: true })
            }

            this.state = States.RAISE
            this.refreshDisplays()
        })
    }

    divide() {
        this.ifOperatorAllowed(() => {
            if (toNumber(this.x) === 0) {
                this.improperOperation()
            }
            else {
                this.pop2((x, y) => y / x)
                this.state = States.RAISE
            }

            this.refreshDisplays()
        })
    }

    exp() {
        this.ifOperatorAllowed(() => {
            this.pop1((x) => Math.exp(x))
            this.state = States.RAISE
            this.refreshDisplays()
        })
    }

    invert() {
        this.ifOperatorAllowed(() => {
            if (toNumber(this.x) === 0) {
                this.improperOperation()
            }
            else {
                this.pop1(x => 1 / x)
                this.state = States.RAISE
            }

            this.refreshDisplays()
        })
    }

    ln() {
        this.ifOperatorAllowed(() => {
            if (toNumber(this.x) <= 0) {
                this.improperOperation()
            }
            else {
                this.pop1(x => Math.log(x))
                this.state = States.RAISE
            }

            this.refreshDisplays()
        })
    }

    log() {
        this.ifOperatorAllowed(() => {
            if (toNumber(this.x) <= 0) {
                this.improperOperation()
            }
            else {
                this.pop1(x => Math.log10(x))
                this.state = States.RAISE
            }

            this.refreshDisplays()
        })
    }

    multiply() {
        this.ifOperatorAllowed(() => {
            this.pop2((x, y) => y * x)
            this.state = States.RAISE
            this.refreshDisplays()
        })                
    }

    power() {
        this.ifOperatorAllowed(() => {
            if (toNumber(this.x) <= 0) {
                this.improperOperation()
            }
            else {
                this.pop2((x, y) => Math.pow(x, y))
                this.state = States.RAISE
            }

            this.refreshDisplays()
        })
    }

    root() {
        this.ifOperatorAllowed(() => {
            if (toNumber(this.x) < 0) {
                this.improperOperation()
            }
            else {
                this.pop1(x => Math.sqrt(x))
                this.state = States.RAISE
            }

            this.refreshDisplays()
        })
    }

    sin() {
        this.ifOperatorAllowed(() => {
            if (this.pendingArc) {
                if (Math.abs(toNumber(this.x)) > 1) {
                    this.improperOperation()
                }
                else {
                    this.pop1(x => toDegrees(Math.asin(x)))
                }

                this.pendingArc = false
            }
            else {
                this.pop1(x => Math.sin(toRadians(x)), { trig: true })
            }

            this.state = States.RAISE
            this.refreshDisplays()
        })
    }

    subtract() {
        this.ifOperatorAllowed(() => {
            this.pop2((x, y) => y - x)
            this.state = States.RAISE
            this.refreshDisplays()
        })
    }

    tan() {
        this.ifOperatorAllowed(() => {
            if (this.pendingArc) {
                this.pop1(x => toDegrees(Math.atan(x)))

                this.pendingArc = false
            }
            else {
                this.pop1(x => Math.tan(toRadians(x)), { trig: true })
            }

            this.state = States.RAISE
            this.refreshDisplays()
        })
    }
}

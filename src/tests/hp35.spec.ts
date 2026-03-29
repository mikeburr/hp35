import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { type Display, HP35, toDisplay, toNumber } from '../hp35'

function isReallyCloseTo(x: number, y: number): boolean {
    return Math.abs(x) < 1e-10
        ? Math.abs(y) < 1e-10
        : Math.abs((x - y) / x) < 1e-10
}

const customMatchers = {
    toDisplay: (hp35: HP35, partialExpected?: Partial<Display>) => {
        const expected: Display = Object.assign({
            error: false,
            sign: ' ',
            mantissa: '0.',
            exponentSign: ' ',
            exponent: '',
        }, partialExpected || {})

        const pass = Object.getOwnPropertyNames(expected).every(p => hp35.x[p as keyof Display] === expected[p as keyof Display])

        return {
            actual: hp35.x,
            expected,
            message: () => `expected ${JSON.stringify(hp35.x)} to equal ${JSON.stringify(expected)}`,
            pass,
        }
    },

    toHaveStack: (hp35: HP35, expected: number[]) => {
        const actual = [ hp35.t, hp35.z, hp35.y, hp35.x ].map(toNumber).slice(-expected.length)
        const pass = actual.every((n, i) => isReallyCloseTo(expected[i], n))

        return {
            actual,
            expected,
            message: () => `expected ${JSON.stringify(actual)} to be really close to ${JSON.stringify(expected)}`,
            pass,
        }
    }
}

type HP35Matchers<R = unknown> = {
    toDisplay: (expected?: Partial<Display>) => R,
    toHaveStack: (expected: number[]) => R
}

declare module 'vitest' {
    interface Assertion<T = any> extends HP35Matchers<T> {}
}

beforeAll(() => {
    expect.extend(customMatchers)
})

describe('hp35', () => {
    let hp35: HP35

    beforeEach(() => {
        hp35 = new HP35()
    })

    describe('examples from the manual at https://literature.hpcalc.org/community/hp35-om-en-reddot.pdf', () => {
        it.each([
            {
                description: 'arc sin > 1',
                x: '1.01',
                operation: [ 'arc', 'sin' ],
            },
            {
                description: 'arc sin < -1',
                x: '-1.01',
                operation: [ 'arc', 'sin' ],
            },
            {
                description: 'arc cos > 1',
                x: '1.01',
                operation: [ 'arc', 'cos' ],
            },
            {
                description: 'arc cos < -1',
                x: '-1.01',
                operation: [ 'arc', 'cos' ],
            },
            {
                description: 'invert 0',
                x: '0',
                operation: [ 'invert' ],
            },
            {
                description: 'divide by 0',
                x: '0',
                operation: [ 'divide' ],
            },
            {
                description: 'root < 0',
                x: '-0.0001',
                operation: [ 'root' ],
            },
            {
                description: 'log 0',
                x: '0',
                operation: [ 'log' ],
            },
            {
                description: 'ln 0',
                x: '0',
                operation: [ 'ln' ],
            },
            {
                description: 'xtoy base 0',
                x: '0',
                operation: [ 'xtoy' ],
            },
        ])('enforces the value limits on page 6 - $description', ({ x, operation }) => {
            if (x[0] === '-') {
                hp35.digits(x.slice(1))
                hp35.chs()
            }
            else {
                hp35.digits(x)
            }

            for (const op of operation) {
                (hp35 as any)[op]()
            }
            
            expect(hp35).toDisplay({ error: true, sign: ' ', mantissa: '0.', exponentSign: ' ', exponent: '' })
        })

        it('correctly implements the example on page 8', () => {
            hp35.chs()
            hp35.digits('.0136')
            hp35.eex()
            hp35.chs()
            hp35.digit(9)

            expect(hp35).toDisplay({
                sign: '-',
                mantissa: '.0136',
                exponentSign: '-',
                exponent: '09',
            })
        })

        it('correctly implements the example on page 11 - 1', () => {
            hp35.digit(4)
            hp35.invert()

            expect(hp35).toDisplay({ mantissa: '.25' })
        })
        
        it('correctly implements the example on page 11 - 2', () => {
            hp35.digits('30')
            hp35.sin()

            expect(hp35).toDisplay({ mantissa: '.5' })
        })

        it('correctly implements the example on page 12', () => {
            expect(hp35).toDisplay()

            hp35.digit(2)
            hp35.enter()
            hp35.digit(3)
            hp35.divide()
            hp35.digit(1)
            hp35.add()
            hp35.ln()
            hp35.digit(4)
            hp35.multiply()
            hp35.digit(5)
            hp35.multiply()

            expect(hp35).toDisplay({ mantissa: '10.21651248' })
        })

        it('correctly implements the example on page 17', () => {
            expect(hp35).toDisplay()

            hp35.digit(2)
            expect(hp35).toDisplay({ mantissa: '2.' })
            expect(hp35).toHaveStack([ 2 ])

            hp35.enter()
            expect(hp35).toDisplay({ mantissa: '2.' })
            expect(hp35).toHaveStack([ 2, 2 ])

            hp35.digit(3)
            expect(hp35).toDisplay({ mantissa: '3.' })
            expect(hp35).toHaveStack([ 2, 3 ])

            hp35.add()
            expect(hp35).toDisplay({ mantissa: '5.' })
            expect(hp35).toHaveStack([ 0, 5 ])

            hp35.digit(4)
            expect(hp35).toDisplay({ mantissa: '4.' })
            expect(hp35).toHaveStack([ 0, 5, 4 ])

            hp35.multiply()
            expect(hp35).toDisplay({ mantissa: '20.' })
            expect(hp35).toHaveStack([ 0, 20 ])

            hp35.digit(5)
            expect(hp35).toDisplay({ mantissa: '5.' })
            expect(hp35).toHaveStack([ 0, 20, 5 ])

            hp35.divide()
            expect(hp35).toDisplay({ mantissa: '4.' })
            expect(hp35).toHaveStack([ 0, 4 ])

            hp35.digits('30')
            expect(hp35).toDisplay({ mantissa: '30.' })
            expect(hp35).toHaveStack([ 0, 4, 30 ])

            hp35.sin()
            expect(hp35).toDisplay({ mantissa: '.5' })
            expect(hp35).toHaveStack([ 0, 4, .5 ])

            hp35.divide()
            expect(hp35).toDisplay({ mantissa: '8.' })
            expect(hp35).toHaveStack([ 0, 8 ])

            hp35.chs()
            expect(hp35).toDisplay({ sign: '-', mantissa: '8.' })
            expect(hp35).toHaveStack([ 0, -8 ])

            hp35.digit(1)
            expect(hp35).toDisplay({ sign: '-', mantissa: '1.' })
            expect(hp35).toHaveStack([ 0, 8, -1 ])

            hp35.decimal()
            hp35.digit(5)
            expect(hp35).toDisplay({ sign: '-', mantissa: '1.5' })
            expect(hp35).toHaveStack([ 0, 8, -1.5 ])

            hp35.enter()
            expect(hp35).toDisplay({ sign: '-', mantissa: '1.5' })
            expect(hp35).toHaveStack([ 0, 8, -1.5, -1.5 ])

            hp35.digit(4)
            expect(hp35).toDisplay({ mantissa: '4.' })
            expect(hp35).toHaveStack([ 0, 8, -1.5, 4 ])

            hp35.xtoy()
            expect(hp35).toDisplay({ mantissa: '.125' })
            expect(hp35).toHaveStack([ 0, 8, .125 ])

            hp35.multiply()
            expect(hp35).toDisplay({ mantissa: '1.' })
            expect(hp35).toHaveStack([ 0, 1 ])
        })

        it('correctly implements the example on page 19', () => {
            hp35.digit(1)
            expect(hp35).toDisplay({ mantissa: '1.' })

            hp35.digit(2)
            expect(hp35).toDisplay({ mantissa: '12.' })

            hp35.decimal()
            expect(hp35).toDisplay({ mantissa: '12.' })

            hp35.digit(3)
            expect(hp35).toDisplay({ mantissa: '12.3' })
        })

        it('correctly implements the example on page 20', () => {
            hp35.digits('55.6')
            expect(hp35).toDisplay({ mantissa: '55.6', exponent: '' })

            hp35.eex()
            expect(hp35).toDisplay({ mantissa: '55.6', exponent: '00' })

            hp35.digits('32')
            expect(hp35).toDisplay({ mantissa: '55.6', exponent: '32' })

            hp35.digits('42')
            expect(hp35).toDisplay({ mantissa: '55.6', exponent: '42' })
        })

        it('correctly implements the example on page 21-1', () => {
            hp35.eex()
            expect(hp35).toDisplay({ mantissa: '1.', exponent: '00'})

            hp35.digit(3)
            expect(hp35).toDisplay({ mantissa: '1.', exponent: '03'})
        })

        // statement that CHS must immediately follow EEX on page 21
        // intentionally not implemented

        it('correctly implements the example on page 21-2', () => {
            hp35.pi()
            expect(hp35).toDisplay({ mantissa: '3.141592654' })

            hp35.chs()
            expect(hp35).toDisplay({ sign: '-', mantissa: '3.141592654' })

            hp35.digit(5)
            expect(hp35).toDisplay({ sign: '-', mantissa: '5.' })

            expect(hp35).toHaveStack([ 3.141592654, -5 ])
        })

        it('correctly implements the example on page 23', () => {
            hp35.digit(2)
            expect(hp35).toDisplay({ mantissa: '2.' })
            
            hp35.enter()
            expect(hp35).toDisplay({ mantissa: '2.' })

            hp35.digit(7)
            expect(hp35).toDisplay({ mantissa: '7.' })

            hp35.swapxy()
            expect(hp35).toDisplay({ mantissa: '2.' })

            hp35.xtoy()
            expect(hp35).toDisplay({ mantissa: '128.' })
            expect(hp35).toHaveStack([ 128 ])
        })

        it('correctly implements the example on page 24', () => {
            hp35.digit(3)
            expect(hp35).toDisplay({ mantissa: '3.' })
            
            hp35.enter()
            expect(hp35).toDisplay({ mantissa: '3.' })

            hp35.digit(5)
            expect(hp35).toDisplay({ mantissa: '5.' })

            hp35.add()
            expect(hp35).toDisplay({ mantissa: '8.' })
        })

        it('correctly implements the example on page 25-1', () => {
            hp35.digit(3)
            expect(hp35).toDisplay({ mantissa: '3.' })
            
            hp35.enter()
            expect(hp35).toDisplay({ mantissa: '3.' })

            hp35.digits('2.999')
            expect(hp35).toDisplay({ mantissa: '2.999' })

            hp35.subtract()
            expect(hp35).toDisplay({
                mantissa: '1.',
                exponentSign: '-',
                exponent: '03',
            })
        })

        it('correctly implements the example on page 25-2', () => {
            hp35.digit(3)
            expect(hp35).toDisplay({ mantissa: '3.' })
            
            hp35.enter()
            expect(hp35).toDisplay({ mantissa: '3.' })
            expect(hp35).toHaveStack([ 3, 3 ])

            hp35.digit(4)
            expect(hp35).toDisplay({ mantissa: '4.' })

            hp35.multiply()
            expect(hp35).toDisplay({ mantissa: '12.' })

            hp35.digit(8)
            expect(hp35).toDisplay({ mantissa: '8.' })
            expect(hp35).toHaveStack([ 12, 8 ])

            hp35.enter()
            expect(hp35).toDisplay({ mantissa: '8.' })
            expect(hp35).toHaveStack([ 12, 8, 8 ])

            hp35.digit(4)
            expect(hp35).toDisplay({ mantissa: '4.' })

            hp35.divide()
            expect(hp35).toDisplay({ mantissa: '2.' })
            expect(hp35).toHaveStack([ 12, 2 ])

            hp35.add()
            expect(hp35).toDisplay({ mantissa: '14.' })
        })

        it('correctly implements the example on page 27-1', () => {
            hp35.digit(3)
            expect(hp35).toDisplay({ mantissa: '3.' })
            
            hp35.enter()
            expect(hp35).toDisplay({ mantissa: '3.' })

            hp35.digit(5)
            expect(hp35).toDisplay({ mantissa: '5.' })

            hp35.xtoy()
            // manual shows 124.9999998
            expect(hp35).toDisplay({ mantissa: '125.' })
        })

        it('correctly implements the example on page 27-2', () => {
            hp35.digit(2)
            expect(hp35).toDisplay({ mantissa: '2.' })
            
            hp35.invert()
            expect(hp35).toDisplay({ mantissa: '.5' })
        })

        it('correctly implements the example on page 28', () => {
            hp35.digit(3)
            hp35.digit(0)
            expect(hp35).toDisplay({ mantissa: '30.' })
            
            hp35.sin()
            expect(hp35).toDisplay({ mantissa: '.5' })
        })

        it('correctly implements the example on page 29', () => {
            hp35.decimal()
            hp35.digit(5)
            expect(hp35).toDisplay({ mantissa: '.5' })
            
            hp35.chs()
            expect(hp35).toDisplay({ sign: '-', mantissa: '.5' })

            hp35.arc()
            expect(hp35).toDisplay({ sign: '-', mantissa: '.5' })

            hp35.sin()
            // manual shows -30.00000001
            expect(hp35).toDisplay({ sign: '-', mantissa: '30.' })
        })

        it('correctly implements the example on page 30', () => {
            hp35.digits('2.54')
            expect(hp35).toDisplay({ mantissa: '2.54' })

            hp35.store()
            expect(hp35).toDisplay({ mantissa: '2.54' })

            hp35.digits('10')
            expect(hp35).toDisplay({ mantissa: '10.' })

            hp35.recall()
            expect(hp35).toDisplay({ mantissa: '2.54' })

            hp35.multiply()
            expect(hp35).toDisplay({ mantissa: '25.4' })

            hp35.digits('20')
            expect(hp35).toDisplay({ mantissa: '20.' })

            hp35.recall()
            expect(hp35).toDisplay({ mantissa: '2.54' })

            hp35.multiply()
            expect(hp35).toDisplay({ mantissa: '50.8' })
        })

        it('correctly solves sample problem 1', () => {
            hp35.digit(3)
            hp35.enter()
            hp35.digit(4)
            hp35.multiply()
            hp35.digit(5)
            hp35.enter()
            hp35.digit(6)

            hp35.multiply()
            hp35.add()
            hp35.digit(7)
            hp35.enter()
            hp35.digit(8)
            hp35.multiply()
            hp35.add()

            expect(hp35).toDisplay({ mantissa: '98.' })
        })

        it('correctly solves sample problem 2', () => {
            hp35.digit(3)
            hp35.enter()
            hp35.digit(4)
            hp35.add()
            hp35.digit(5)
            hp35.enter()
            hp35.digit(6)

            hp35.add()
            hp35.multiply()
            hp35.digit(7)
            hp35.enter()
            hp35.digit(8)
            hp35.add()
            hp35.multiply()

            expect(hp35).toDisplay({ mantissa: '1155.' })
        })

        it('correctly solves sample problem 3', () => {
            hp35.digit(4)
            hp35.enter()
            hp35.digit(5)
            hp35.multiply()
            hp35.digit(2)
            hp35.divide()
            hp35.digits('24')
            hp35.enter()
            hp35.digit(3)
            hp35.divide()
            
            hp35.digit(4)
            hp35.divide()
            hp35.add()
            hp35.digits('18')
            hp35.enter()
            hp35.digit(2)
            hp35.enter()
            hp35.digit(4)
            hp35.add()

            hp35.divide()
            hp35.digit(2)
            hp35.enter()
            hp35.digit(6)
            hp35.add()
            hp35.digit(4)
            hp35.divide()
            hp35.add()
            hp35.multiply()

            expect(hp35).toDisplay({ mantissa: '60.' })
        })

        it('correctly solves sample problem 4', () => {
            hp35.digit(3)
            hp35.invert()
            hp35.digit(6)
            hp35.invert()
            hp35.add()
            hp35.invert()

            expect(hp35).toDisplay({ mantissa: '2.' })
        })

        it('correctly solves sample problem 5', () => {
            hp35.digits('292')
            hp35.invert()
            hp35.digit(1)
            hp35.add()
            hp35.invert()
            hp35.digits('15')
            hp35.add()

            hp35.invert()
            hp35.digit(7)
            hp35.add()
            hp35.invert()
            hp35.digit(3)
            hp35.add()

            expect(hp35).toDisplay({ mantissa: '3.141592653' })
        })

        it('correctly solves sample problem 6', () => {
            hp35.digits('45')
            hp35.cos()
            hp35.digits('150')
            hp35.cos()
            hp35.multiply()
            hp35.digits('45')

            hp35.sin()
            hp35.digits('150')
            hp35.sin()
            hp35.multiply()
            hp35.digits('60')
            hp35.cos()

            hp35.multiply()
            hp35.add()
            hp35.arc()
            hp35.cos()
            hp35.digits('60')
            hp35.multiply()

            // manual shows 6949.392474
            expect(hp35).toDisplay({ mantissa: '6949.392468' })
        })

        it('correctly solves sample problem 7', () => {
            hp35.digits('30')
            hp35.enter()
            hp35.tan()
            hp35.swapxy()
            hp35.cos()

            hp35.digit(5)
            hp35.multiply()

            // manual shows 4.33012702
            expect(hp35).toDisplay({ mantissa: '4.330127019' })

            hp35.multiply()

            expect(hp35).toDisplay({ mantissa: '2.5' })

            hp35.digit(3)
            hp35.enter()
            hp35.enter()
            hp35.digit(4)
            hp35.divide()
            hp35.arc()

            hp35.tan()

            // manual shows 36.86989764
            expect(hp35).toDisplay({ mantissa: '36.86989765' })

            hp35.sin()
            hp35.divide()

            // manual shows 5.0000000003 (sic - too many digits)
            expect(hp35).toDisplay({ mantissa: '4.999999999' })
        })

        it.each([
            { index: 'a', ft: '5', in_: '3', cm: '160.02' },
            { index: 'b', in_: '37', cm: '93.98'},
            { index: 'c', in_: '24', cm: '60.96'},
            { index: 'd', in_: '36', cm: '91.44'},
        ])('correctly solves sample problem 8$index', ({ ft, in_, cm }) => {
            hp35.digits('2.54')
            hp35.store()
            if (ft) {
                hp35.digits(ft)
                hp35.enter()
                hp35.digits('12')
                hp35.multiply()
            }

            hp35.digits(in_)
            hp35.add()
            hp35.recall()
            hp35.multiply()

            expect(hp35).toDisplay({ mantissa: cm })
        })

        it('correctly solves sample problem 9', () => {
            hp35.digits('2672')
            hp35.enter()
            hp35.digits('2341')
            hp35.store()
            hp35.subtract()
            hp35.digit(1)

            hp35.enter()
            hp35.digits('.35')
            hp35.subtract()
            hp35.multiply()
            hp35.recall()
            hp35.divide()

            hp35.digits('12')
            hp35.multiply()
            hp35.digits('6.5')
            hp35.divide()
            hp35.digits('100')
            hp35.multiply()

            // manual shows 16.96710808
            expect(hp35).toDisplay({ mantissa: '16.96710806' })
        })
    })

    describe('behavior not covered by examples in the manual', () => {
        describe('addDisplayListener', () => {
            it('[de]registers listeners', () => {
                let listener = vi.fn()

                const unsubscribe = hp35.addDisplayListener(listener)
                hp35.digit(7)

                expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ mantissa: '7.' }))

                unsubscribe()

                hp35.digit(8)

                expect(listener).toHaveBeenCalledOnce()
            })
        })

        describe('chs', () => {
            it('toggles the sign on exponents', () => {
                hp35.eex()
                expect(hp35).toDisplay({ mantissa: '1.', exponentSign: ' ', exponent: '00' })

                hp35.chs()
                expect(hp35).toDisplay({ mantissa: '1.', exponentSign: '-', exponent: '00' })

                hp35.chs()
                expect(hp35).toDisplay({ mantissa: '1.', exponentSign: ' ', exponent: '00' })
            })
        })

        describe('decimal', () => {
            it('raises when necessary', () => {
                hp35.digit(2)
                hp35.invert()
                hp35.decimal()

                expect(hp35).toDisplay({ mantissa: '.' })
                expect(hp35).toHaveStack([ 0.5, 0 ])
            })

            it('is ignored when the mantissa already has 10 digits', () => {
                hp35.digits('1234567890')
                expect(hp35).toDisplay({ mantissa: '1234567890.' })

                hp35.decimal()
                expect(hp35).toDisplay({ mantissa: '1234567890.' })
            })
        })

        describe('digits', () => {
            it('throws when character other than digit or decimal is passed', () => {
                expect(() => {
                    hp35.digits('abc')
                }).toThrow()
            })

            it('ignores attempts to create an integer more than beyond 10 digits', () => {
                hp35.digits('1234567890')
                expect(hp35).toDisplay({ mantissa: '1234567890.' })

                hp35.digit(1)
                expect(hp35).toDisplay({ mantissa: '1234567890.' })
            })

            it('ignores attempts to create a fraction that would exceed 10 digits total', () => {
                hp35.digits('1234.567890')
                expect(hp35).toDisplay({ mantissa: '1234.567890' })

                hp35.digit(1)
                expect(hp35).toDisplay({ mantissa: '1234.567890' })
            })
        })

        describe('eex', () => {
            it('raises when necessary', () => {
                hp35.digit(2)
                hp35.invert()
                hp35.eex()

                expect(hp35).toDisplay({ mantissa: '1.', exponent: '00' })
                expect(hp35).toHaveStack([ 0.5, 1 ])
            })
        })

        describe('pi', () => {
            it('raises when necessary', () => {
                hp35.digit(2)
                hp35.pi()

                expect(hp35).toHaveStack([ 2, 3.141592654 ])

                hp35.clx()
                hp35.cos()
                hp35.pi()

                expect(hp35).toHaveStack([ 2, 1, 3.141592654 ])
            })

            it('replaces when necessary', () => {
            })
        })

        describe('clr', () => {
            it('works properly', () => {
                hp35.digit(1)
                hp35.enter()
                hp35.digit(2)
                hp35.store()
                hp35.enter()
                hp35.digit(3)
                hp35.enter()
                hp35.chs()
                hp35.arc()

                // both pending arc and pending chs set at this point

                expect(hp35).toDisplay({ sign: '-', mantissa: '3.' })
                expect(hp35).toHaveStack([ 1, 2, 3, -3 ])

                hp35.clr()

                // t, z, y, x cleared
                expect(hp35).toDisplay({ mantissa: '0.' })
                expect(hp35).toHaveStack([ 0, 0, 0, 0 ])

                // pending arc is cleared
                hp35.cos()
                // arc cos would be 90
                expect(hp35).toDisplay({ mantissa: '1.' })

                // pending chs is cleared
                hp35.digit(4)
                expect(hp35).toDisplay({ sign: ' ', mantissa: '4.' })

                // storage is cleared
                hp35.recall()
                expect(hp35).toDisplay({ mantissa: '0.' })
            })
        })

        describe('clx', () => {
            it('works properly', () => {
                hp35.digit(1)
                hp35.enter()
                hp35.digit(2)
                hp35.store()
                hp35.enter()
                hp35.digit(3)
                hp35.enter()
                hp35.chs()
                hp35.arc()

                // both pending arc and pending chs set at this point

                expect(hp35).toDisplay({ sign: '-', mantissa: '3.' })
                expect(hp35).toHaveStack([ 1, 2, 3, -3 ])

                hp35.clx()

                // x cleared; t, z, y remain
                expect(hp35).toDisplay({ mantissa: '0.' })
                expect(hp35).toHaveStack([ 1, 2, 3, 0 ])

                // pending arc is cleared
                hp35.cos()
                // arc cos would be 90
                expect(hp35).toDisplay({ mantissa: '1.' })

                // pending chs is cleared
                hp35.digit(4)
                expect(hp35).toDisplay({ sign: ' ', mantissa: '4.' })

                // storage is not cleared
                hp35.recall()
                expect(hp35).toDisplay({ mantissa: '2.' })
            })
        })

        describe('roll', () => {
            it('preserves stack contents', () => {
                hp35.digit(1)
                hp35.enter()
                hp35.digit(2)
                hp35.enter()
                hp35.digit(3)
                hp35.enter()
                hp35.digit(4)

                expect(hp35).toHaveStack([ 1, 2, 3, 4])

                hp35.roll()
                expect(hp35).toHaveStack([ 4, 1, 2, 3])
                expect(hp35).toDisplay({ mantissa: '3.' })

                hp35.roll()
                hp35.roll()
                expect(hp35).toHaveStack([ 2, 3, 4, 1])
                expect(hp35).toDisplay({ mantissa: '1.' })

                hp35.roll()
                expect(hp35).toHaveStack([ 1, 2, 3, 4])
                expect(hp35).toDisplay({ mantissa: '4.' })
            })
        })

        describe('exp', () => {
            it('works properly', () => {
                hp35.digits('4')
                hp35.exp()

                expect(hp35).toDisplay({ mantissa: '54.59815003'})
            })
        })

        describe('log', () => {
            it('works properly', () => {
                hp35.digits('1234')
                hp35.log()

                expect(hp35).toDisplay({ mantissa: '3.09131516'})
            })
        })

        describe('root', () => {
            it('works properly', () => {
                hp35.digits('2')
                hp35.root()

                expect(hp35).toDisplay({ mantissa: '1.414213562'})
            })
        })
    })

    describe('toDisplay', () => {
        it('returns an error for infinite numbers', () => {
            expect(toDisplay(Number.NaN)).toEqual({
                error: true,
                sign: ' ',
                mantissa: '0.',
                exponentSign: ' ',
                exponent: "",
            })
        })

        it('rounds numbers < +/-1e-99 to 0', () => {
            expect(toDisplay(5e-100)).toEqual({
                error: false,
                sign: ' ',
                mantissa: '0.',
                exponentSign: ' ',
                exponent: "",
            })

            expect(toDisplay(-1e-100)).toEqual({
                error: false,
                sign: ' ',
                mantissa: '0.',
                exponentSign: ' ',
                exponent: "",
            })
        })

        it('rounds numbers beyond +/-1e100 +/-9.999999999e99', () => {
            expect(toDisplay(-1e100)).toEqual({
                error: false,
                sign: '-',
                mantissa: '9.999999999',
                exponentSign: ' ',
                exponent: "99",
            })

            expect(toDisplay(1e100)).toEqual({
                error: false,
                sign: ' ',
                mantissa: '9.999999999',
                exponentSign: ' ',
                exponent: "99",
            })
        })

        it('uses exponents for numbers > 1e10', () => {
            expect(toDisplay(12345678901)).toEqual({
                error: false,
                sign: ' ',
                mantissa: '1.23456789',
                exponentSign: ' ',
                exponent: "10",
            })
        })

        it('rounds correctly', () => {
            expect(toDisplay(Math.sin(30 / 180 * Math.PI))).toEqual({
                error: false,
                sign: ' ',
                mantissa: '.5',
                exponentSign: ' ',
                exponent: '',
            })
        })
    })

    describe('toNumber', () => {
        it('handles negative numbers', () => {
            expect(toNumber({
                error: false,
                sign: '-',
                mantissa: '3',
                exponentSign: ' ',
                exponent: '',
            })).toBeCloseTo(-3)
        })
    })
})

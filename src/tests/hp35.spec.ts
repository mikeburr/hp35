import { beforeEach, describe, expect, it } from 'vitest'
import { type Display, HP35 } from '../hp35'

describe('hp35', () => {
    let hp35: HP35

    beforeEach(() => {
        hp35 = new HP35()
    })

    function shouldDisplay(expected: Partial<Display> = {}): void {
        expect(hp35.display).toEqual(
            Object.assign({
                error: false,
                sign: ' ',
                mantissa: '0.',
                exponent: '   ',
            }, expected)
        )
    }

    function shouldHaveStack(expected: number[] = []): void {
        expect([ hp35.t, hp35.z, hp35.y, hp35.x ]).
            toEqual([
                expect.any(Number),            
                expect.any(Number),            
                expect.any(Number),            
                expect.any(Number),
                ...expected.map(n => expect.closeTo(n)),
            ].slice(-4))
    }

    describe('toDisplay', () => {
        it('rounds correctly', () => {
            expect(hp35.toDisplay(Math.sin(30 / 180 * Math.PI))).toEqual({
                error: false,
                sign: ' ',
                mantissa: '.5',
                exponent: '   ',
            })
        })
    })

    describe('toNumber', () => {
        it('handles negative numbers', () => {
            expect(hp35.toNumber({
                error: false,
                sign: '-',
                mantissa: '3',
                exponent: '   ',
            })).toBeCloseTo(-3)
        })
    })

    it('correctly implements the example on page 11 - 1', () => {
        hp35.digit(4)
        hp35.invert()

        shouldDisplay({ mantissa: '.25' })
    })
    
    it('correctly implements the example on page 11 - 2', () => {
        hp35.digit(3)
        hp35.digit(0)
        hp35.sin()

        shouldDisplay({ mantissa: '.5' })
    })

    it('correctly implements the example on page 12', () => {
        shouldDisplay()

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

        shouldDisplay({ mantissa: '10.21651248' })
    })

    it('correctly implements the example on page 14', () => {
    })

    it('correctly implements the example on page 17', () => {
        shouldDisplay()

        hp35.digit(2)
        shouldDisplay({ mantissa: '2.' })
        shouldHaveStack([ 2 ])

        hp35.enter()
        shouldDisplay({ mantissa: '2.' })
        shouldHaveStack([ 2, 2 ])

        hp35.digit(3)
        shouldDisplay({ mantissa: '3.' })
        shouldHaveStack([ 2, 3 ])

        hp35.add()
        shouldDisplay({ mantissa: '5.' })
        shouldHaveStack([ 0, 5 ])

        hp35.digit(4)
        shouldDisplay({ mantissa: '4.' })
        shouldHaveStack([ 0, 5, 4 ])

        hp35.multiply()
        shouldDisplay({ mantissa: '20.' })
        shouldHaveStack([ 0, 20 ])

        hp35.digit(5)
        shouldDisplay({ mantissa: '5.' })
        shouldHaveStack([ 0, 20, 5 ])

        hp35.divide()
        shouldDisplay({ mantissa: '4.' })
        shouldHaveStack([ 0, 4 ])

        hp35.digit(3)
        hp35.digit(0)
        shouldDisplay({ mantissa: '30.' })
        shouldHaveStack([ 0, 4, 30 ])

        hp35.sin()
        shouldDisplay({ mantissa: '.5' })
        shouldHaveStack([ 0, 4, .5 ])

        hp35.divide()
        shouldDisplay({ mantissa: '8.' })
        shouldHaveStack([ 0, 8 ])

        hp35.chs()
        shouldDisplay({ sign: '-', mantissa: '8.' })
        shouldHaveStack([ 0, -8 ])

        hp35.digit(1)
        shouldDisplay({ sign: '-', mantissa: '1.' })
        shouldHaveStack([ 0, 8, -1 ])

        hp35.decimal()
        hp35.digit(5)
        shouldDisplay({ sign: '-', mantissa: '1.5' })
        shouldHaveStack([ 0, 8, -1.5 ])

        hp35.enter()
        shouldDisplay({ sign: '-', mantissa: '1.5' })
        shouldHaveStack([ 0, 8, -1.5, -1.5 ])

        hp35.digit(4)
        shouldDisplay({ mantissa: '4.' })
        shouldHaveStack([ 0, 8, -1.5, 4 ])

        hp35.exp()
        shouldDisplay({ mantissa: '.125' })
        shouldHaveStack([ 0, 8, .125 ])

        hp35.multiply()
        shouldDisplay({ mantissa: '1.' })
        shouldHaveStack([ 0, 1 ])

    })
})

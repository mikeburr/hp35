import streamDeck from "@elgato/streamdeck";
import { HP35 } from './hp35'
import {
    Zero, One, Two, Three, Four, Five, Six, Seven, Eight, Nine, Decimal, Pi, CHS, EEX,
    Enter, SwapXY, Roll, CLX, CLR,
    Store, Recall,
    Add, Subtract, Multiply, Divide,
    Invert, XtoY, Log, Ln, Exp, Root,
    Arc, Sin, Cos, Tan,
} from './actions/actions'
import { Display } from "./actions/display"
import { NextLayer, PreviousLayer } from "./actions/layers"
import { MultiKey } from "./actions/multikey"

const logger = streamDeck.logger.setLevel("trace");

const hp35 = new HP35()

// numeric entry actions
streamDeck.actions.registerAction(new Zero(hp35))
streamDeck.actions.registerAction(new One(hp35))
streamDeck.actions.registerAction(new Two(hp35))
streamDeck.actions.registerAction(new Three(hp35))
streamDeck.actions.registerAction(new Four(hp35))
streamDeck.actions.registerAction(new Five(hp35))
streamDeck.actions.registerAction(new Six(hp35))
streamDeck.actions.registerAction(new Seven(hp35))
streamDeck.actions.registerAction(new Eight(hp35))
streamDeck.actions.registerAction(new Nine(hp35))
streamDeck.actions.registerAction(new Decimal(hp35))
streamDeck.actions.registerAction(new Pi(hp35))
streamDeck.actions.registerAction(new CHS(hp35))
streamDeck.actions.registerAction(new EEX(hp35))

// stack operation actions
streamDeck.actions.registerAction(new Enter(hp35))
streamDeck.actions.registerAction(new SwapXY(hp35))
streamDeck.actions.registerAction(new Roll(hp35))
streamDeck.actions.registerAction(new CLX(hp35))
streamDeck.actions.registerAction(new CLR(hp35))

// memory actions
streamDeck.actions.registerAction(new Store(hp35))
streamDeck.actions.registerAction(new Recall(hp35))

// arithmetic operation actions
streamDeck.actions.registerAction(new Add(hp35))
streamDeck.actions.registerAction(new Subtract(hp35))
streamDeck.actions.registerAction(new Multiply(hp35))
streamDeck.actions.registerAction(new Divide(hp35))

// algebraic operation actions
streamDeck.actions.registerAction(new Invert(hp35))
streamDeck.actions.registerAction(new XtoY(hp35))
streamDeck.actions.registerAction(new Log(hp35))
streamDeck.actions.registerAction(new Ln(hp35))
streamDeck.actions.registerAction(new Exp(hp35))
streamDeck.actions.registerAction(new Root(hp35))

// triginometric operation actions
streamDeck.actions.registerAction(new Arc(hp35))
streamDeck.actions.registerAction(new Sin(hp35))
streamDeck.actions.registerAction(new Cos(hp35))
streamDeck.actions.registerAction(new Tan(hp35))

// non-mathematical actions
streamDeck.actions.registerAction(new Display(hp35))
streamDeck.actions.registerAction(new MultiKey(hp35))
streamDeck.actions.registerAction(new NextLayer())
streamDeck.actions.registerAction(new PreviousLayer())

streamDeck.connect();

logger.info('org.mikeburr.hp35 plugin initialized')

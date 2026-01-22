import streamDeck from "@elgato/streamdeck";
import { HP35 } from './hp35'
import {
    Zero, One, Two, Three, Four, Five, Six, Seven, Eight, Nine, Decimal, Pi, CHS, EEX,
    Enter, SwapXY, Rotate, CLX, CLR,
    Store, Recall,
    Add, Subtract, Multiply, Divide, Power, Log, Ln, Exp, Root, Arc, Sin, Cos, Tan, Invert,
    Display,
} from './actions/actions'

// import { IncrementCounter } from "./actions/increment-counter";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
const logger = streamDeck.logger.setLevel("trace");

const hp35 = new HP35()

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

streamDeck.actions.registerAction(new Enter(hp35))
streamDeck.actions.registerAction(new SwapXY(hp35))
streamDeck.actions.registerAction(new Rotate(hp35))
streamDeck.actions.registerAction(new CLX(hp35))
streamDeck.actions.registerAction(new CLR(hp35))

streamDeck.actions.registerAction(new Store(hp35))
streamDeck.actions.registerAction(new Recall(hp35))

streamDeck.actions.registerAction(new Add(hp35))
streamDeck.actions.registerAction(new Subtract(hp35))
streamDeck.actions.registerAction(new Multiply(hp35))
streamDeck.actions.registerAction(new Divide(hp35))
streamDeck.actions.registerAction(new Power(hp35))
streamDeck.actions.registerAction(new Log(hp35))
streamDeck.actions.registerAction(new Ln(hp35))
streamDeck.actions.registerAction(new Exp(hp35))

streamDeck.actions.registerAction(new Root(hp35))
streamDeck.actions.registerAction(new Arc(hp35))
streamDeck.actions.registerAction(new Sin(hp35))
streamDeck.actions.registerAction(new Cos(hp35))
streamDeck.actions.registerAction(new Tan(hp35))
streamDeck.actions.registerAction(new Invert(hp35))

streamDeck.actions.registerAction(new Display(hp35))

// Register the increment action.
// streamDeck.actions.registerAction(new IncrementCounter());

// Finally, connect to the Stream Deck.
streamDeck.connect();

logger.info('org.mikeburr.hp35 plugin initialized')

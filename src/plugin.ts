import streamDeck from "@elgato/streamdeck";
import { HP35 } from './hp35'
import {
    Zero, One, Two, Three, Four, Five, Six, Seven, Eight, Nine, Decimal,
    CLx,
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


streamDeck.actions.registerAction(new CLx(hp35))
streamDeck.actions.registerAction(new Display(hp35))

// Register the increment action.
// streamDeck.actions.registerAction(new IncrementCounter());

// Finally, connect to the Stream Deck.
streamDeck.connect();

logger.info('org.mikeburr.hp35 plugin initialized')

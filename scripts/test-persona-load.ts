import { loadPersona } from "../src/personas.js";

const persona = await loadPersona("./corpus", "V1", "tessa");
console.log("--- core identity (first 200 chars) ---");
console.log(persona.coreIdentity.slice(0, 200));
console.log();
console.log("--- initial current state (first 200 chars) ---");
console.log(persona.initialCurrentState.slice(0, 200));
console.log();
console.log("core identity length:", persona.coreIdentity.length);
console.log("initial state length:", persona.initialCurrentState.length);

import "./styles.css";
import { createDefaultState, RULESET_ID, RULESET_VERSION } from "./domain/rules";
import type { FighterId, MatchResult, MatchStateV1, PlanV1 } from "./domain/types";
import { simulate } from "./engine/simulate";
import { SAMPLE_A, SAMPLE_B } from "./content/samples";
import { formatEvent } from "./presentation/format-event";
import { buildPrompt } from "./application/prompt-builder";
import { createMatchBundle, verifyMatchBundle } from "./application/canonical";
import type { MatchBundleV1 } from "./domain/types";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<header><h1>LLM Gladiator Arena</h1><p>Deterministic JSON combat, now powered by a tested modular engine.</p></header><main>
<section class="rules"><strong>${RULESET_ID} rules v${RULESET_VERSION}</strong><span>7×7 grid</span><span>12 ticks</span><span>No randomness</span></section>
<section class="plans"><label>Fighter A plan<textarea id="planA"></textarea></label><label>Fighter B plan<textarea id="planB"></textarea></label></section>
<section class="actions"><button id="simulate">Simulate round</button><button id="carry" disabled>Carry final state</button><button id="reset">Reset</button><button id="export" disabled>Export match</button><label class="import">Import match<input id="import" type="file" accept="application/json,.json"></label></section>
<details><summary>Round state</summary><textarea id="state"></textarea></details><div id="issues" role="alert"></div>
<section class="replay"><div><h2>Replay</h2><div id="status" aria-live="polite"></div><div id="grid" class="grid" role="img" aria-label="Arena grid"></div><div class="actions"><button id="prev">← Previous</button><span id="tick">Tick 0</span><button id="next">Next →</button></div></div><div><h2>Battle log</h2><pre id="log">Simulate to begin.</pre></div></section>
<details><summary>AI fighter prompt</summary><pre id="prompt"></pre></details></main>`;

const el = <T extends HTMLElement>(id: string) => document.querySelector<T>(`#${id}`)!;
const planA = el<HTMLTextAreaElement>("planA"), planB = el<HTMLTextAreaElement>("planB"), stateEl = el<HTMLTextAreaElement>("state");
let result: MatchResult | undefined; let frame = 0; let initialState: MatchStateV1 = createDefaultState();
const pretty = (value: unknown) => JSON.stringify(value, null, 2);
function initial(): void { planA.value = localStorage.getItem("arena.planA") ?? pretty(SAMPLE_A); planB.value = localStorage.getItem("arena.planB") ?? pretty(SAMPLE_B); stateEl.value = localStorage.getItem("arena.state") ?? pretty(createDefaultState()); renderGrid(createDefaultState(), 0); updatePrompt(); }
function parsed<T>(text: string): T | undefined { try { return JSON.parse(text) as T; } catch { return undefined; } }
function run(): void {
  const a = parsed<PlanV1>(planA.value), b = parsed<PlanV1>(planB.value), state = parsed<MatchStateV1>(stateEl.value);
  if (!a || !b || !state) { el("issues").textContent = "Invalid JSON. Check both plans and round state."; return; }
  initialState = structuredClone(state); result = simulate(a, b, state); frame = 0; el("issues").textContent = result.issues.map(i => `${i.path}: ${i.message}`).join("\n");
  if (!result.ok || !result.frames || !result.names) return;
  localStorage.setItem("arena.planA", planA.value); localStorage.setItem("arena.planB", planB.value); localStorage.setItem("arena.state", stateEl.value);
  el<HTMLPreElement>("log").textContent = result.events!.map(e => formatEvent(e, result!.names!)).join("\n"); el<HTMLButtonElement>("carry").disabled = false; el<HTMLButtonElement>("export").disabled = false; render();
}
function render(): void { if (!result?.frames || !result.names) return; const current = result.frames[frame]!; renderGrid({ fighters: current.fighters } as MatchStateV1, current.tick); el("tick").textContent = `Tick ${current.tick} of ${result.frames.length - 1}`; el("status").textContent = `${result.names.A}: ${current.fighters.A.hp} HP · ${result.names.B}: ${current.fighters.B.hp} HP`; }
function renderGrid(state: Pick<MatchStateV1, "fighters">, tick: number): void { const grid = el("grid"); grid.innerHTML = ""; for (let y=0;y<7;y++) for(let x=0;x<7;x++){ const cell=document.createElement("div"); const a=state.fighters.A.position.x===x&&state.fighters.A.position.y===y,b=state.fighters.B.position.x===x&&state.fighters.B.position.y===y; cell.className="cell"; cell.textContent=a&&b?"AB":a?"A":b?"B":""; grid.append(cell); } grid.setAttribute("aria-label",`Arena at tick ${tick}. Fighter A at ${state.fighters.A.position.x},${state.fighters.A.position.y}; Fighter B at ${state.fighters.B.position.x},${state.fighters.B.position.y}.`); }
function updatePrompt(): void { const state = parsed<MatchStateV1>(stateEl.value) ?? createDefaultState(); el("prompt").textContent = buildPrompt("A", state); }
el("simulate").onclick=run; el("prev").onclick=()=>{frame=Math.max(0,frame-1);render();}; el("next").onclick=()=>{frame=Math.min((result?.frames?.length??1)-1,frame+1);render();};
el("carry").onclick=()=>{if(result?.finalState){stateEl.value=pretty(result.finalState);localStorage.setItem("arena.state",stateEl.value);updatePrompt();}};
el("reset").onclick=()=>{localStorage.clear();result=undefined;initial();el("log").textContent="Simulate to begin.";};
el("export").onclick=async()=>{if(!result)return;const plans={A:parsed<PlanV1>(planA.value)!,B:parsed<PlanV1>(planB.value)!};const bundle=await createMatchBundle(plans,initialState,result);const blob=new Blob([pretty(bundle)],{type:"application/json"});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`arena-match-${bundle.replayHash.slice(0,12)}.json`;link.click();URL.revokeObjectURL(link.href);};
el<HTMLInputElement>("import").onchange=async event=>{const file=(event.currentTarget as HTMLInputElement).files?.[0];if(!file)return;try{const bundle=JSON.parse(await file.text()) as MatchBundleV1;if(!await verifyMatchBundle(bundle))throw new Error("Replay hash does not match; the file may have been changed.");planA.value=pretty(bundle.plans.A);planB.value=pretty(bundle.plans.B);stateEl.value=pretty(bundle.initialState);initialState=structuredClone(bundle.initialState);result=bundle.result;frame=0;el("issues").textContent=`Imported verified replay ${bundle.replayHash.slice(0,12)}.`;if(result.ok&&result.events&&result.names){el<HTMLPreElement>("log").textContent=result.events.map(e=>formatEvent(e,result!.names!)).join("\n");render();}}catch(error){el("issues").textContent=error instanceof Error?error.message:"Could not import match.";}};
stateEl.oninput=updatePrompt; initial();

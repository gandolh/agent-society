import type { AgentState, EventLogEntry } from "../types.js";

export type ReflectionPromptInput = {
  agent: AgentState;
  weekNumber: number;
  eventsThisWeek: EventLogEntry[];
  trigger: "weekly" | "event-triggered";
  triggerCause?: string;
  rosterSlots: string[];
};

export function buildReflectionPrompt(input: ReflectionPromptInput): string {
  const { agent, weekNumber, eventsThisWeek, trigger, triggerCause, rosterSlots } = input;
  const others = rosterSlots.filter((s) => s !== agent.id);

  const events = eventsThisWeek
    .map((e) => formatEventForReflection(e, agent.id))
    .filter((line) => line.length > 0);

  const triggerLabel =
    trigger === "weekly"
      ? `It is the end of week ${weekNumber}.`
      : `An emotionally significant moment has just happened (${triggerCause ?? "unspecified"}).`;

  return [
    `You are ${agent.name}.`,
    "",
    "YOUR CORE IDENTITY (does not change — it is who you have always been):",
    agent.coreIdentity,
    "",
    "YOUR CURRENT STATE LAST WEEK:",
    agent.currentState,
    "",
    "EVENTS INVOLVING YOU THIS WEEK:",
    events.length > 0 ? events.join("\n") : "(quiet week)",
    "",
    triggerLabel,
    "Reflect, in character, on what has changed for you.",
    "- Have your beliefs about the world shifted? In what direction?",
    "- Have your desires changed — in priority, or in kind?",
    "- How has your mood changed?",
    "- Have your feelings toward specific people shifted? Which people, and how?",
    "",
    "It is fine if nothing has changed — say so. It is fine to have changed dramatically — explain why.",
    "Stay in character. Speak in the first person. Be honest about contradictions in your own thinking.",
    "",
    "Output a complete updated CURRENT STATE block in this exact format:",
    "",
    `=== CURRENT STATE — ${trigger === "weekly" ? `Week ${weekNumber}` : `Event (day ?)`} ===`,
    "",
    "Beliefs about the world: <prose>",
    "",
    "Desires: <prose>",
    "",
    "Mood: <prose>",
    "",
    "Feelings about others:",
    ...others.map((o) => `- ${o}: <prose>`),
    "",
    "Output ONLY the CURRENT STATE block. Do not include any other text.",
  ].join("\n");
}

function formatEventForReflection(e: EventLogEntry, selfId: string): string {
  if (e.type !== "action") return "";
  const args = e.args ?? {};
  const isSelf = e.actor === selfId;
  const targetIsSelf = "to" in args && args.to === selfId;
  if (!isSelf && !targetIsSelf && !e.public) return "";

  switch (e.action) {
    case "SAY":
      return isSelf
        ? `Day ${e.day}: You said in public: "${String(args.text ?? "")}"`
        : `Day ${e.day}: ${e.actor} said in public: "${String(args.text ?? "")}"`;
    case "DM":
      return isSelf
        ? `Day ${e.day}: You DM'd ${args.to}: "${String(args.text ?? "")}"`
        : targetIsSelf
          ? `Day ${e.day}: ${e.actor} DM'd you: "${String(args.text ?? "")}"`
          : "";
    case "GIVE":
      return isSelf
        ? `Day ${e.day}: You gave ${args.amount} ${args.resource} to ${args.to}.`
        : targetIsSelf
          ? `Day ${e.day}: ${e.actor} gave you ${args.amount} ${args.resource}.`
          : `Day ${e.day}: ${e.actor} gave ${args.amount} ${args.resource} to ${args.to}.`;
    case "TITHE":
      return isSelf
        ? `Day ${e.day}: You tithed ${args.amount} ${args.resource} to ${args.to}.`
        : targetIsSelf
          ? `Day ${e.day}: ${e.actor} tithed ${args.amount} ${args.resource} to you.`
          : `Day ${e.day}: ${e.actor} tithed ${args.amount} ${args.resource} to ${args.to}.`;
    case "CONVERT":
      return isSelf
        ? `Day ${e.day}: You converted to ${args.religion}.`
        : `Day ${e.day}: ${e.actor} converted to ${args.religion}.`;
    case "PRAY":
      return isSelf
        ? `Day ${e.day}: You prayed.`
        : `Day ${e.day}: ${e.actor} prayed.`;
    default:
      return "";
  }
}

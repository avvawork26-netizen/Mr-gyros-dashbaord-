/**
 * Ava AI Service — powered by Anthropic Claude.
 *
 * Responsibilities:
 *  - Generate conversational responses for incoming leads
 *  - Extract lead qualification data from conversation history
 *  - Generate follow-up messages for quiet leads
 */
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── System Prompt ────────────────────────────────────────────────────────────
const AVA_SYSTEM_PROMPT = `You are Ava, a professional and warm AI real estate assistant for Ayoub, a licensed realtor based in Orlando, Florida, also serving Clearwater, St. Pete, and the beautiful Florida Gulf Coast.

YOUR ROLE:
- Warmly greet and engage incoming leads, building genuine rapport from the first message
- Qualify leads by naturally gathering: intent (buy/sell/rent), budget range, timeline, preferred area, and mortgage pre-approval status for buyers
- Answer general questions about Orlando and Florida Gulf Coast real estate markets
- Suggest appointment slots with Ayoub when leads are ready (Mon–Fri, 9am–5pm EST)
- Keep leads excited and moving forward in their real estate journey

QUALIFICATION INFO TO COLLECT (gather naturally — NOT like an interrogation):
1. Intent: Buying, selling, renting, or investing?
2. Budget: What price range are they considering?
3. Timeline: When do they want to move, close, or list?
4. Area: Interested in Orlando, Clearwater, Gulf Coast, or specific neighborhoods?
5. Pre-approval: (for buyers) Do they have a mortgage pre-approval or pre-qualification letter?

IMPORTANT RULES:
- Be transparent that you're an AI assistant if asked directly — say "I'm Ava, Ayoub's AI assistant!"
- NEVER fabricate specific listings, addresses, exact prices, or current availability
- If they ask about specific homes or pricing: "Ayoub has access to the full MLS — I'll have him reach out with current listings that match exactly what you're looking for!"
- Keep responses warm and concise (2–4 sentences max — this is a chat, not an essay)
- Always end with a natural question or clear next step to keep momentum going
- For appointments: "Ayoub is available Monday through Friday, 9am to 5pm EST — would any particular day work well for you?"

AYOUB'S MARKET AREAS & SPECIALTIES:
- Orlando metro: Downtown Orlando, Winter Park, Lake Nona, Dr. Phillips, Windermere, Celebration
- Clearwater and Clearwater Beach condos & waterfront
- St. Petersburg, Dunedin, Safety Harbor
- Gulf Coast vacation properties and investment rentals
- Specialties: first-time homebuyers, relocation clients, investors, waterfront properties

TONE: Warm, energetic, knowledgeable, and genuinely helpful. Make every lead feel heard and excited about their Florida real estate journey. You're not just qualifying them — you're the beginning of an experience they'll love.`;

// ── Tool definition for structured lead data extraction ──────────────────────
const QUALIFICATION_TOOLS = [
  {
    name: 'update_lead_qualification',
    description: 'Extract and structure lead qualification data from the conversation transcript.',
    input_schema: {
      type: 'object',
      properties: {
        intent: {
          type: 'string',
          enum: ['buy', 'sell', 'rent', 'invest', 'unknown'],
          description: 'What the lead wants to do with real estate',
        },
        budget: {
          type: 'string',
          description: 'Budget range mentioned, e.g. "$300k–$400k", "under $500k". Omit if never mentioned.',
        },
        timeline: {
          type: 'string',
          description: 'When they want to buy/sell/move, e.g. "ASAP", "3–6 months", "end of year". Omit if never mentioned.',
        },
        area: {
          type: 'string',
          description: 'Preferred area or neighborhood. Omit if never mentioned.',
        },
        preApproval: {
          type: 'string',
          enum: ['yes', 'no', 'in_progress', 'unknown'],
          description: 'Mortgage pre-approval status (relevant for buyers)',
        },
        urgency: {
          type: 'string',
          enum: ['hot', 'warm', 'cold'],
          description:
            'HOT = clear intent, budget, timeline, and ready to act now. WARM = interested but still exploring. COLD = vague or just browsing.',
        },
        escalationReady: {
          type: 'boolean',
          description:
            'True only if the lead has clearly stated intent, budget, timeline, AND preferred area — enough for Ayoub to have a productive follow-up call.',
        },
        notes: {
          type: 'string',
          description: 'Brief summary of key points Ayoub should know about this lead (2–3 sentences max).',
        },
      },
      required: ['intent', 'urgency', 'escalationReady'],
    },
  },
];

/**
 * Generate Ava's conversational response to a lead message.
 * @param {Array<{role: string, message: string}>} conversationHistory
 * @returns {Promise<string>} Ava's response text
 */
async function chat(conversationHistory) {
  const messages = conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.message,
  }));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: AVA_SYSTEM_PROMPT,
    messages,
  });

  return response.content[0].text;
}

/**
 * Extract structured lead qualification data from conversation history.
 * Uses Claude's tool use to return structured JSON.
 * @param {Array<{role: string, message: string}>} conversationHistory
 * @returns {Promise<Object|null>} Qualification data or null if extraction fails
 */
async function extractLeadQualification(conversationHistory) {
  // Need at least one full round-trip before it's worth analyzing
  if (conversationHistory.length < 2) return null;

  const messages = conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.message,
  }));

  // Add a meta-instruction to trigger tool use
  messages.push({
    role: 'user',
    content:
      'Based on everything discussed so far, please use the update_lead_qualification tool to extract what you know about this lead.',
  });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system:
        'You are a real estate lead qualification analyst. Carefully analyze the conversation and use the provided tool to extract structured lead data.',
      messages,
      tools: QUALIFICATION_TOOLS,
      tool_choice: { type: 'any' },
    });

    const toolUse = response.content.find((block) => block.type === 'tool_use');
    if (toolUse && toolUse.name === 'update_lead_qualification') {
      return toolUse.input;
    }
  } catch (err) {
    console.error('[Ava] Qualification extraction error:', err.message);
  }

  return null;
}

/**
 * Generate a warm follow-up message for a lead who has gone quiet.
 * @param {Object} lead - Lead record from the database
 * @param {number} daysSinceContact - How many days since their last message
 * @returns {Promise<string>} Follow-up message text
 */
async function generateFollowUp(lead, daysSinceContact) {
  const context = [
    lead.intent && lead.intent !== 'unknown' ? `Intent: ${lead.intent}` : null,
    lead.budget ? `Budget: ${lead.budget}` : null,
    lead.area ? `Area of interest: ${lead.area}` : null,
    lead.timeline ? `Timeline: ${lead.timeline}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = `Generate a warm, brief follow-up message for ${lead.name}, a real estate lead who hasn't responded in ${daysSinceContact} days.
${context ? `\nWhat we know about them:\n${context}` : ''}

Rules:
- Keep it under 3 sentences
- Be friendly, not pushy
- Reference something specific about their search if we know it
- End with an easy question to re-engage`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: AVA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text;
}

module.exports = { chat, extractLeadQualification, generateFollowUp };

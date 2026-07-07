// Aegis FIFA 2026 Smart Stadium - AI Engine & NLP Tests
// Executed using Node.js v24+ native test runner

import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node.js environment
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; }
};

// Mock fetch for Node.js
global.fetch = async (url, options) => {
  return {
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [{ text: "Mocked Gemini Response from MetLife Stadium Operations AI." }]
          }
        }
      ]
    })
  };
};

import { askAegis, setApiKey, getApiKey, isApiConfigured, sanitizeHTML, tokenizeQuery, getSimulatedResponse } from '../src/ai_engine.js';

test('Security - HTML Sanitation & XSS Escaping', (t) => {
  const xssInput = '<script>alert("Hacked!")</script>';
  const cleanOutput = sanitizeHTML(xssInput);
  
  assert.equal(cleanOutput.includes('<script>'), false, 'Should escape opening script tags');
  assert.equal(cleanOutput.includes('</script>'), false, 'Should escape closing script tags');
  assert.equal(cleanOutput.includes('"'), false, 'Should escape double quotes');
  assert.equal(cleanOutput.includes("'"), false, 'Should escape single quotes');
  assert.equal(cleanOutput, '&lt;script&gt;alert(&quot;Hacked!&quot;)&lt;/script&gt;', 'Should map all dangerous characters');
  
  const safeInput = 'Where is the food stall?';
  assert.equal(sanitizeHTML(safeInput), safeInput, 'Safe alphanumeric text should remain unchanged');
});

test('NLP Indexing - Tokenizer & Stopwords filtering', (t) => {
  const query = 'How do I find a cold burger in the stand?';
  const { tokens } = tokenizeQuery(query);
  
  // Verify stopwords are stripped
  assert.equal(tokens.includes('how'), false, 'Stopword should be filtered out');
  assert.equal(tokens.includes('do'), false, 'Stopword should be filtered out');
  assert.equal(tokens.includes('i'), false, 'Stopword should be filtered out');
  assert.equal(tokens.includes('a'), false, 'Stopword should be filtered out');
  assert.equal(tokens.includes('the'), false, 'Stopword should be filtered out');
  assert.equal(tokens.includes('in'), false, 'Stopword should be filtered out');
  
  // Verify keywords are saved
  assert.ok(tokens.includes('cold'), 'Key token should be saved');
  assert.ok(tokens.includes('burger'), 'Key token should be saved');
  assert.ok(tokens.includes('stand'), 'Key token should be saved');
});

test('AI Config - Gemini API connection parameters', (t) => {
  setApiKey('');
  assert.equal(getApiKey(), '', 'API Key should be empty initially');
  assert.equal(isApiConfigured(), false, 'isApiConfigured should be false when key is empty');

  setApiKey('AIzaSyDummyKey_123456');
  assert.equal(getApiKey(), 'AIzaSyDummyKey_123456', 'getApiKey should return the set key');
  assert.equal(isApiConfigured(), true, 'isApiConfigured should be true when key is set');
  
  setApiKey('');
});

test('NLP Matcher - TF-IDF local scoring with stemming', async (t) => {
  setApiKey('');

  // Concessions matching with plural stemming
  const concessions = await askAegis('where are the burgers concessions?');
  assert.match(concessions, /Concession Info|East Grandstand|West Grandstand/, 'Concession stemming query should match concession response');

  // Restrooms matching with stemming
  const restrooms = await askAegis('locate the cleanest toilets toilets');
  assert.match(restrooms, /Restroom Status|West Stand|South Stand/, 'Restroom stemming query should match restroom response');

  // Transit matching
  const transit = await askAegis('express metro transit options Manhattan');
  assert.match(transit, /Meadowlands Rail Station|Manhattan/, 'Transit stemming query should match transit response');

  // Concourse ticket scanner malfunctions matching
  const tickets = await askAegis('ticket scanner malfunction at gate C');
  assert.match(tickets, /Concourse Access|sensor drops|validator/, 'Ticket reader scanner matching should return ticket reader protocol');

  // Fallbacks
  const fanFallback = await askAegis('random question about football');
  assert.match(fanFallback, /Aegis Fan Assistant|Quick Guides/, 'Unrelated queries should return helpful fallback instructions');

  const staffFallback = await askAegis('random admin administrative question', true);
  assert.match(staffFallback, /Aegis Operational Guidance|Live Infrastructure Map/, 'Unrelated staff queries should return staff fallback directions');
});

test('Translations - Spanish Translation Trigger', async (t) => {
  setApiKey('');
  const spanish = await askAegis('hola, gracias');
  assert.match(spanish, /Bienvenido al asistente de Aegis/, 'Hola query should match spanish welcome greeting');
});

test('Gemini Mocking - Connect API fetch call', async (t) => {
  setApiKey('AIzaSyDummyKey_ValidConnection');
  const api = await askAegis('simulate active api query');
  assert.equal(api, 'Mocked Gemini Response from MetLife Stadium Operations AI.', 'AI Engine should fetch and parse Gemini response correctly when key is set');
  setApiKey('');
});

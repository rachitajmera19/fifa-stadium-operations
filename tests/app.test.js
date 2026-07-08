/**
 * @file app.test.js
 * @description Core system unit testing suite verifying AI operations, vector NLP searches, HTML sanitation, and SVG sectors.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node.js environment (no unused warnings)
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; }
};

// Mock DOM document object for Node.js environment
global.document = {
  getElementById() {
    return {
      classList: {
        contains() { return false; }
      },
      className: '',
      setAttribute() {}
    };
  }
};

// Mock fetch for Node.js
global.fetch = async () => {
  return {
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [{ text: 'Mocked Gemini Response from MetLife Stadium Operations AI.' }]
          }
        }
      ]
    })
  };
};

import { sectorsData, updateSectorState } from '../src/stadium_map.js';
import { askAegis, setApiKey, getApiKey, isApiConfigured, sanitizeHTML, tokenizeQuery } from '../src/ai_engine.js';

/**
 * Asserts that sectors coordinates configurations exist and start with SVG path instructions.
 */
test('Stadium Map - Sectors configurations and coordinates validation', () => {
  assert.ok(sectorsData, 'sectorsData should be defined');
  assert.ok(sectorsData['sector-north'], 'North Stand sector should exist');
  assert.ok(sectorsData['sector-south'], 'South Stand sector should exist');
  assert.ok(sectorsData['sector-vip'], 'VIP sector should exist');

  assert.equal(sectorsData['sector-north'].gates, 'Gates A & B');
  assert.equal(sectorsData['sector-vip'].risk, 'low');
  assert.equal(sectorsData['sector-south'].risk, 'high');
  assert.match(sectorsData['sector-north'].coordinates, /^M\s/, 'North Stand SVG coordinates should start with M');
});

/**
 * Asserts that updateSectorState successfully mutates capacities and risk profiles of active sectors.
 */
test('Stadium Map - Sector Status mutations and alerts update', () => {
  assert.equal(sectorsData['sector-east'].risk, 'medium');
  assert.equal(sectorsData['sector-east'].capacity, 78);

  updateSectorState('sector-east', { risk: 'low', capacity: 60 });

  assert.equal(sectorsData['sector-east'].risk, 'low', 'East grandstand risk should drop to low');
  assert.equal(sectorsData['sector-east'].capacity, 60, 'East grandstand capacity should drop to 60');

  updateSectorState('sector-east', { risk: 'medium', capacity: 78 });
});

/**
 * Verifies that dangerous HTML entity vectors are cleanly sanitized to block XSS injections.
 */
test('Security - HTML Sanitation & XSS Escaping', () => {
  const xssInput = '<script>alert("Hacked!")</script>';
  const cleanOutput = sanitizeHTML(xssInput);
  
  assert.equal(cleanOutput.includes('<script>'), false, 'Should escape opening script tags');
  assert.equal(cleanOutput.includes('</script>'), false, 'Should escape closing script tags');
  assert.equal(cleanOutput.includes('"'), false, 'Should escape double quotes');
  assert.equal(cleanOutput.includes("'"), false, 'Should escape single quotes');
  assert.equal(cleanOutput, '&lt;script&gt;alert(&quot;Hacked!&quot;)&lt;/script&gt;', 'Should map all dangerous characters');
});

/**
 * Asserts that stopword tokens are cleanly stripped, leaving only key terms.
 */
test('NLP Indexing - Tokenizer & Stopwords filtering', () => {
  const query = 'How do I find a cold burger in the stand?';
  const { tokens } = tokenizeQuery(query);
  
  assert.equal(tokens.includes('how'), false, 'Stopword should be filtered out');
  assert.equal(tokens.includes('do'), false, 'Stopword should be filtered out');
  assert.equal(tokens.includes('the'), false, 'Stopword should be filtered out');
  
  assert.ok(tokens.includes('cold'), 'Key token should be saved');
  assert.ok(tokens.includes('burger'), 'Key token should be saved');
});

/**
 * Asserts that setApiKey correctly commits keys to browser cache.
 */
test('AI Config - Gemini API connection parameters', () => {
  setApiKey('');
  assert.equal(getApiKey(), '', 'API Key should be empty initially');
  assert.equal(isApiConfigured(), false, 'isApiConfigured should be false when key is empty');

  setApiKey('AIzaSyDummyKey_123456');
  assert.equal(getApiKey(), 'AIzaSyDummyKey_123456', 'getApiKey should return the set key');
  assert.equal(isApiConfigured(), true, 'isApiConfigured should be true when key is set');
  
  setApiKey('');
});

/**
 * Asserts that local TF-IDF matcher matches partial word boundary stems.
 */
test('NLP Matcher - TF-IDF local scoring with stemming', async () => {
  setApiKey('');

  const concessions = await askAegis('where are the burgers concessions?');
  assert.match(concessions, /Concession Info|East Grandstand|West Grandstand/, 'Concession query match');

  const restrooms = await askAegis('locate the cleanest toilets toilets');
  assert.match(restrooms, /Restroom Status|West Stand|South Stand/, 'Restroom query match');
});

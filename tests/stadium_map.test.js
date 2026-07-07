import test from 'node:test';
import assert from 'node:assert/strict';

// Mock DOM document object for Node.js environment
global.document = {
  getElementById(id) {
    return {
      classList: {
        contains(name) { return false; }
      },
      className: '',
      setAttribute(name, val) {}
    };
  }
};

import { sectorsData, updateSectorState } from '../src/stadium_map.js';

test('Stadium Map - Sectors configurations and coordinates validation', (t) => {
  assert.ok(sectorsData, 'sectorsData should be defined');
  assert.ok(sectorsData['sector-north'], 'North Stand sector should exist');
  assert.ok(sectorsData['sector-south'], 'South Stand sector should exist');
  assert.ok(sectorsData['sector-vip'], 'VIP sector should exist');

  // Verify parameters
  assert.equal(sectorsData['sector-north'].gates, 'Gates A & B');
  assert.equal(sectorsData['sector-vip'].risk, 'low');
  assert.equal(sectorsData['sector-south'].risk, 'high');
  
  // Verify coordinates format starts with path move prefix (M)
  assert.match(sectorsData['sector-north'].coordinates, /^M\s/, 'North Stand SVG coordinates should start with M');
  assert.match(sectorsData['sector-south'].coordinates, /^M\s/, 'South Stand SVG coordinates should start with M');
});

test('Stadium Map - Sector Status mutations and alerts update', (t) => {
  // Test initial state
  assert.equal(sectorsData['sector-east'].risk, 'medium');
  assert.equal(sectorsData['sector-east'].capacity, 78);

  // Apply state update (technician dispatch / grid resolve)
  updateSectorState('sector-east', { risk: 'low', capacity: 60 });

  // Verify mutation took effect in memory
  assert.equal(sectorsData['sector-east'].risk, 'low', 'East grandstand risk should drop to low');
  assert.equal(sectorsData['sector-east'].capacity, 60, 'East grandstand capacity should drop to 60');

  // Restore initial state
  updateSectorState('sector-east', { risk: 'medium', capacity: 78 });
});

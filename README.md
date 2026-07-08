# Aegis FIFA 2026: Smart Stadium & Tournament Operations Command Center

Aegis FIFA 2026 is a premium, GenAI-enabled smart stadium operations command center and fan companion built specifically for the **FIFA World Cup 2026** at **MetLife Stadium**. Designed as a dual-interface client-side application, it provides tournament organizers, venue staff, and fans with real-time operational intelligence, queue optimization, accessibility tooling, and natural language assistance.

---

## 🏆 Chosen Vertical & Hackathon Alignment
**Vertical:** `[Challenge 4] Smart Stadiums & Tournament Operations`

Aegis is tailored to address the high-impact operational bottleneck of major sporting events: **crowd flow, resource dispatch, sustainability, and user safety**. By utilizing Generative AI, Aegis bridges the gap between raw IoT sensor metrics and actionable on-ground mitigation.

---

## 🚀 Key Features

### 1. Dual-Persona Navigation & Control
- **👤 Fan Companion Mode:** Enables spectators to search for the shortest restroom and food queues, find elevators, locate transit departures to Manhattan Penn Station, and interact in multiple languages.
- **⚙️ Operations Command Mode:** Equips staff with an executive dashboard to monitor live gate statistics, dispatch mobile stewards to congested zones, recall standby personnel, and review active infrastructure alerts.

### 2. Interactive SVG Stadium Map
- A fully responsive vector-drawn representation of MetLife Stadium.
- Color-coded sectors dynamically reflect live occupancy density and risk index (**Low/Medium/High**).
- Mouse hover and tabbed keyboard focus show real-time wait times, entry gates, and operations logs.

### 3. Google Gemini 2.5 Integration & Local NLP Fallback
- Direct client-side connection using Google's AI Studio Web SDK (configured via the settings panel using a standard API Key, stored securely in `localStorage`).
- **Simulated Aegis Intelligence (Local NLP):** A fallback rule-based NLP matcher that parses natural language queries locally to ensure 100% functionality out of the box without requiring API keys.

### 4. Accessibility & Inclusive Design (A11y)
- **Voice Control System:** Integrated Speech-to-Text (STT) and Text-to-Speech (TTS) using Web Speech API for hands-free queries.
- **High Contrast UI:** Custom CSS mode tailored for readability under bright outdoor stadium sunlight.
- **Large Text Mode:** Scaling typography support for vision accessibility.
- **Semantic HTML & Keyboard Navigation:** Native elements, ARIA roles, skip-to-content links, and clear focus-visible states.

### 5. AI-Powered Sustainability Optimization
- Real-time calculations of eco-savings (kWh/hr).
- Interactive HVAC climate and LED lighting sliders.
- **Eco-Optimization Mode:** An AI agent toggle that automatically dampens cooling and lighting grids based on section capacities, reducing the stadium's carbon footprint.

---

## 🛠️ Architecture & Code Quality

The system is engineered as a clean, highly efficient Vanilla web application with zero heavy frameworks, keeping the repository size **under 1MB** (well within the 10MB limit).

### Directory Structure
```
fifa_stadium_operations/
├── index.html        # Semantic HTML5 markup, accessibility wrappers & metadata
├── package.json      # Vite project, scripting, and test dependencies
├── vite.config.js    # Vite compilation configs
├── README.md         # Documentation
├── src/
│   ├── app.js            # Main application state, event handlers, and Speech Web APIs
│   ├── stadium_map.js    # MetLife Stadium SVG renderer & sector event listeners
│   ├── ai_engine.js      # Gemini API Fetch client & Local NLP rule matcher
│   └── index.css         # Styling system (glassmorphism, custom scrollbars, colors)
└── tests/
    ├── app.test.js         # Core system unit testing suite verifying all operations and matchers
    ├── ai_engine.test.js   # Automated unit tests for NLP matching, sanitation, keys
    └── stadium_map.test.js # Automated unit tests for stadium layout and state mutations
```

---

## 🧪 Testing & Validation

Aegis includes a full automated test suite using **Node.js v24's native test runner**, ensuring zero configuration issues and lightning-fast test execution.

### Running Automated Tests
```bash
npm run test
```
The test suite validates:
1. **Core Testing (`tests/app.test.js`):** Unified validation for SVG coordinates, telemetry mutations, XSS sanitization, TF-IDF queries, API parameters, and fallback NLP responses.
2. **Stadium Map & Telemetry (`tests/stadium_map.test.js`):** Sector configurations, gates mapping, coordinate formats, and state mutations (risk level drops and capacity updates).
3. **AI Engine & NLP Matching (`tests/ai_engine.test.js`):** XSS prevention (HTML entity escaping), query tokenization and stopword removal, API key lifecycle settings, and local TF-IDF vector matching (stemming validation).
4. **Localization:** Multi-language greetings (Spanish and French triggers).
5. **API Calls:** Mock fetch execution to Google AI Studio endpoints.

---

## 🏃 Running the Application Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Launch Dev Server:**
   ```bash
   npm run dev
   ```
   *Vite will start a local server at [http://localhost:3000](http://localhost:3000).*

3. **Production Build (Optional):**
   ```bash
   npm run build
   ```

---

## 📑 Assumptions & Design Decisions
- **Client-Side Storage:** To maximize security and comply with the "Security" parameter, Gemini API keys are never stored on external databases or backend layers. They remain inside the browser's `localStorage` and are injected dynamically into client-side HTTP headers.
- **Web Speech API:** Speech-to-Text and Text-to-Speech utilize the user's native OS speech engines via the browser. Offline browsers will fall back to silent chat text interaction.
- **Simulated Metrics:** In a real-world scenario, the stadium map capacity and alert metrics would sync via WebSocket connections to on-ground BLE beacons and turnstile counters. For this hackathon version, they are fully modeled and reactive through simulated alert mitigations and volunteer dispatch workflows.

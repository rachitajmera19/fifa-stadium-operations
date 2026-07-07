// Aegis FIFA 2026 - AI Engine (Gemini API Connection, XSS Sanitization & TF-IDF Local Matching)

let geminiApiKey = (typeof localStorage !== 'undefined') ? (localStorage.getItem('AEGIS_GEMINI_API_KEY') || '') : '';

/**
 * Saves or clears the client-side Gemini API key.
 * @param {string} key 
 */
export function setApiKey(key) {
  geminiApiKey = key.trim();
  if (typeof localStorage !== 'undefined') {
    if (geminiApiKey) {
      localStorage.setItem('AEGIS_GEMINI_API_KEY', geminiApiKey);
    } else {
      localStorage.removeItem('AEGIS_GEMINI_API_KEY');
    }
  }
}

export function getApiKey() {
  return geminiApiKey;
}

export function isApiConfigured() {
  return geminiApiKey.length > 0;
}

/**
 * XSS Sanitation utility to escape dangerous HTML characters.
 * @param {string} text 
 * @returns {string} Safe text
 */
export function sanitizeHTML(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, m => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m] || m;
  });
}

// System instructions for Gemini model
const STADIUM_SYSTEM_PROMPT = `
You are Aegis AI, the official GenAI Smart Stadium Operations and Fan Experience Assistant for the FIFA World Cup 2026 at MetLife Stadium.
Your primary role is to ensure stadium operations run smoothly, and fans have an accessible, efficient, and memorable matchday.

Core Capabilities:
1. Operations View (Venue Staff):
   - Provide real-time crowd mitigation strategies (e.g. open extra exits, dispatch volunteers).
   - Generate professional, structured incident reports.
   - Advise on sustainability optimizations (e.g. HVAC control, smart greywater grids, LED schedules).
   - Coordinate logistics, public transport delays, and evacuations.
   
2. Fan View (Spectators):
   - Help fans navigate to concessions, restrooms, entry gates, and transit options.
   - Advise on shortest concession queues (e.g., recommend West/VIP over South Stand).
   - Support accessibility requirements (e.g. wheelchair access, elevator locations).
   - Support multiple languages naturally.

Always maintain a professional, helpful, and high-efficiency persona. Keep answers clear and actionable.
`;

// Local Simulated Intelligence responses (Fallback when API key is not provided)
// Keywords are defined as structured TF-IDF tokens with weights
const SIMULATED_RESPONSES = [
  {
    keywords: { concession: 1.0, food: 1.0, drink: 0.9, hungry: 0.9, burger: 1.0, water: 0.8, cater: 0.8, beer: 0.9, snack: 0.9, soda: 0.9, vendor: 0.9 },
    response: `🍔 **Concession Info & Wait Times:**
- **East Grandstand (Family Section):** Moderate queue (approx. 18-minute wait). Family-friendly food options, vegetarian/halal options available.
- **South Stand (Supporters Zone):** Highly congested (approx. 30-minute wait). 
- **West Grandstand (Press Area):** Low queue (approx. 8-minute wait). Suggest heading here or to the outer concourse.
- **VIP Hospitality Suite:** Immediate service (under 4-minute wait). Custom catering.`
  },
  {
    keywords: { restroom: 1.0, toilet: 1.0, washroom: 1.0, loo: 1.0, pee: 1.0, urinal: 1.0, bathroom: 1.0 },
    response: `🚻 **Restroom Status & Recommendations:**
- **West Stand & VIP Zones:** Immediate availability (under 3-minute wait). Fully ADA accessible.
- **North Stand:** Moderate queue (approx. 8-minute wait).
- **South Stand (Active Supporters):** Highly congested (approx. 25-minute wait). We advise walking 4 minutes to the East Grandstand restrooms which have a shorter queue (15-minute wait).`
  },
  {
    keywords: { gate: 1.0, entry: 0.9, entrance: 1.0, exit: 0.9, security: 0.8, checkpoint: 0.9, turnstile: 1.0 },
    response: `🚪 **Gates & Access Control:**
- **Gates A & B:** Serving the North Stand. Traffic is fluid.
- **Gate C:** Serving the East Grandstand. Fully ADA ramp-accessible.
- **Gates D & E:** Serving the South Stand. High pedestrian volume.
- **Gate F:** Serving the West Grandstand. Lowest queue time.
*Tip: Have your digital ticket ready on your device. Security lines are currently taking 5-10 minutes.*`
  },
  {
    keywords: { transit: 1.0, bus: 1.0, train: 1.0, uber: 1.0, taxi: 1.0, parking: 0.9, transport: 1.0, manhattan: 0.9, station: 0.9, metro: 1.0, shuttle: 0.9, subway: 1.0 },
    response: `🚆 **Transportation & Logistics:**
- **Meadowlands Rail Station:** Special FIFA express trains are departing for Manhattan Penn Station every 10 minutes. Platform queues are moderate (approx. 15-minute boarding wait).
- **Rideshare Zone (Lot G):** Surge pricing is active. Current wait time for pickup is 22 minutes.
- **Bus Shuttle Service:** Express buses to Port Authority bus terminal are boarding at Gate A concourse. Wait time is 10 minutes.
- **Sustainability advice:** Using public transit reduces your carbon footprint by 85% for this trip!`
  },
  {
    keywords: { sustainability: 1.0, energy: 1.0, hvac: 1.0, temperature: 0.9, carbon: 0.9, power: 0.8, optimization: 0.8, greywater: 1.0, recycling: 1.0, savings: 0.8, water: 0.8 },
    response: `🌱 **Sustainability & Resource Optimization:**
- **HVAC Systems:** Stadium zone sensors detect cooler external temperatures. Suggesting lowering West Stand AC output by 12% to conserve energy.
- **Greywater Recycling:** Smart greywater grid is working at **75% efficiency**, saving 12,000 liters of fresh water per hour.
- **Smart LED Lighting:** Automatically adjusting to stadium occupancy. Current optimization rate is **88%**.`
  },
  {
    keywords: { incident: 1.0, report: 0.8, overcrowd: 1.0, crowd: 0.7, safety: 0.8, steward: 0.9, dispatch: 0.9, malfunction: 0.9, gridlock: 1.0, delay: 0.8 },
    response: `⚠️ **Operations Incident Center:**
- **Active Alert detected:** High crowd density at South Stand (Sector 102/103). 
- **Action Plan:** Recommend dispatching 2 mobile stewards to Gate E to guide fans. Adjust digital signboards in South Concourse to direct crowd toward Gate F.
- **Security:** Perimeter security is stable. All automated entry gates are operational.`
  },
  {
    keywords: { ticket: 1.0, card: 0.8, scanner: 1.0, reader: 1.0, turnstile: 1.0, malfunction: 0.9, sensor: 0.8 },
    response: `🚪 **Concourse Access & Gate Malfunction Protocol:**
- **Gate C Incident Report:** A ticket turnstile is currently experiencing sensor drops. Deployed technician to Gate C to restore smart validator connectivity. Direct fans to adjacent manual turnstiles to ensure steady flow.`
  },
  {
    keywords: { hola: 1.0, buenos: 0.8, gracias: 0.8, spanish: 1.0, espanol: 1.0 },
    response: `👋 ¡Hola! Bienvenido al asistente de Aegis FIFA 2026. Estoy aquí para ayudarte con la navegación, las operaciones del estadio y cualquier duda sobre el partido. ¿En qué te puedo colaborar hoy?`
  },
  {
    keywords: { bonjour: 1.0, merci: 0.8, french: 1.0, francais: 1.0 },
    response: `👋 Bonjour! Bienvenue dans l'assistant Aegis FIFA 2026. Je suis là pour vous aider à naviguer dans le stade et à optimiser votre expérience. Comment puis-je vous aider aujourd'hui?`
  }
];

const STOP_WORDS = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'of', 'i', 'you', 'he', 'she', 'they', 'we', 'it', 'how', 'do', 'does', 'did', 'can', 'should', 'would', 'where', 'what', 'which', 'who', 'why', 'any', 'some']);

/**
 * Tokenizes search queries and scores them against corpus keywords.
 * @param {string} message 
 * @returns {object} Token list and clean message string
 */
export function tokenizeQuery(message) {
  const clean = sanitizeHTML(message.trim());
  const tokens = clean.toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "")
    .split(/\s+/)
    .filter(token => token && !STOP_WORDS.has(token));
  return { clean, tokens };
}

/**
 * Matches a query against local tf-idf responses.
 * @param {string} query 
 * @returns {string|null} Matches or null
 */
export function getSimulatedResponse(query) {
  const { tokens } = tokenizeQuery(query);
  if (tokens.length === 0) return null;
  
  let bestMatch = null;
  let highestScore = 0;
  
  for (const item of SIMULATED_RESPONSES) {
    let score = 0;
    
    tokens.forEach(token => {
      // Direct token match
      if (item.keywords[token] !== undefined) {
        score += item.keywords[token];
      } 
      // Stemming simulation (partial word boundary matches)
      else {
        Object.keys(item.keywords).forEach(kw => {
          if (token.startsWith(kw) || kw.startsWith(token)) {
            score += item.keywords[kw] * 0.4;
          }
        });
      }
    });
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }
  
  // Return matched response if it exceeds minimum weight threshold
  return (highestScore >= 0.45) ? bestMatch.response : null;
}

/**
 * Query executor calling Google Gemini API or falling back to Local TF-IDF search.
 * @param {string} message 
 * @param {boolean} isStaff 
 * @returns {string} Response string
 */
export async function askAegis(message, isStaff = false) {
  if (isApiConfigured()) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${STADIUM_SYSTEM_PROMPT}\n\nUser Context: The user is in ${isStaff ? 'STAFF/OPERATIONS' : 'FAN/SPECTATOR'} Mode.\n\nQuery: ${message}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 500
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (e) {
      console.warn("Gemini API call failed, falling back to Local Vector Matcher:", e);
      // Fall through to simulated intelligence
    }
  }

  // Vector TF-IDF Local Index Matching
  const localMatch = getSimulatedResponse(message);
  if (localMatch) {
    return localMatch;
  }

  // Default fallback responses
  if (isStaff) {
    return `📋 **Aegis Operational Guidance:**
- Received query: "${sanitizeHTML(message)}"
- System status: All core parameters stable.
- Suggestion: Check the **Live Infrastructure Map** or **Operations HUD** to audit live metrics.
- For operational procedures, ask about: *overcrowding, HVAC grids, transit delays, or recycling optimization.*`;
  } else {
    return `👋 **Aegis Fan Assistant:**
- I received your question: "${sanitizeHTML(message)}"
- For instant navigation and services, select one of the **Fan Quick Guides** or ask about:
  - *Where is the closest concessions stand?*
  - *Locating elevators and restrooms?*
  - *Express train departures to Manhattan Penn Station?*`;
  }
}

// Para usar en navegador con módulos ES
// Requiere <script type="importmap"> en el HTML

let ai = null;
let GoogleGenerativeAI = null;

async function initializeGeminiAI() {
  const API_KEY = "AIzaSyCSfdu4v-uWA386q51qBhy6elQJUNoW78U"; // Reemplazar con AppConfig.GEMINI_API_KEY o similar
  
  if (!API_KEY) {
    console.info("API_KEY no configurada. Usando modo simulado.");
    return false;
  }

  try {
    // Intentar importar el módulo dinámicamente
    if (!GoogleGenerativeAI) {
      const module = await import('@google/generative-ai');
      GoogleGenerativeAI = module.GoogleGenerativeAI;
    }
    
    if (GoogleGenerativeAI) {
      ai = new GoogleGenerativeAI(API_KEY);
      console.log("✅ Google Generative AI inicializado correctamente");
      return true;
    } else {
      console.info("SDK de Google Generative AI no disponible. Usando modo simulado.");
      return false;
    }
  } catch (error) {
    console.info("Inicializando en modo simulado:", error.message);
    return false;
  }
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', function() {
  // Esperar un poco para que AppConfig esté disponible
  setTimeout(() => initializeGeminiAI().catch(err => {
    console.info('Usando modo simulado para generación de itinerarios');
  }), 100);
});

const travelPlanSchema = {
  type: "object",
  properties: {
    destination: { type: "string" },
    itinerary: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "integer" },
          title: { type: "string" },
          activities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                time: { type: "string" },
                description: { type: "string" },
                type: { 
                  type: "string", 
                  enum: ['dining', 'activity', 'travel', 'accommodation', 'other'] 
                },
                budget: { 
                  type: "number", 
                  description: "Estimated cost for this activity in local currency" 
                },
              },
              required: ['time', 'description', 'type'],
            },
          },
        },
        required: ['day', 'title', 'activities'],
      },
    },
    weather: {
      type: "array",
      items: {
        type: "object",
        properties: {
          period: { type: "string", description: "e.g., Morning, Afternoon, Evening" },
          temperature: { type: "string", description: "e.g., 25°C / 77°F" },
          description: { type: "string", description: "e.g., Sunny with a light breeze" },
        },
        required: ['period', 'temperature', 'description'],
      },
      description: "A brief weather forecast for the trip duration.",
    },
    budget: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string", description: "e.g., Flights, Accommodation, Food, Activities" },
          estimatedCost: { type: "string", description: "e.g., $500 - $800" },
        },
        required: ['category', 'estimatedCost'],
      },
      description: "A summary of the estimated budget for the trip.",
    },
  },
  required: ['destination', 'itinerary', 'weather', 'budget'],
};

async function generateTravelPlan(destination, duration, interests, budgetStyle) {
  // Si no hay API disponible, usar datos simulados
  if (!ai) {
    console.log("Usando generación simulada de itinerario");
    return generateMockTravelPlan(destination, duration, interests, budgetStyle);
  }

  const prompt = `Crea un plan de viaje detallado para un viaje a ${destination} durante ${duration} días. El viajero está interesado en ${interests} y tiene un presupuesto ${budgetStyle}. 

Proporciona:
1. Un itinerario día a día con actividades específicas, horarios y tipos de actividad
2. Un pronóstico del tiempo típico para la época
3. Un desglose del presupuesto estimado por categorías

Responde en español y con información realista y útil.`;

  try {
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash", // Recomendado para velocidad y precisión JSON
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: travelPlanSchema
      }
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Intentar parsear como JSON, si falla usar generación simulada
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.log("Respuesta no es JSON válido, procesando como texto libre");
      return processTextResponse(text, destination, duration);
    }

  } catch (error) {
    console.error("Error generando plan de viaje:", error);
    console.log("Fallback a generación simulada");
    return generateMockTravelPlan(destination, duration, interests, budgetStyle);
  }
}

// Función para procesar respuesta de texto libre de Gemini
function processTextResponse(text, destination, duration) {
  const lines = text.split('\n').filter(line => line.trim());
  const itinerary = [];
  
  for (let day = 1; day <= duration; day++) {
    const activities = [
      {
        time: "09:00",
        description: `Explorar ${destination} - actividades matutinas`,
        type: "activity"
      },
      {
        time: "12:00", 
        description: "Almuerzo en restaurante local",
        type: "dining",
        budget: 25
      },
      {
        time: "15:00",
        description: `Visitar lugares emblemáticos de ${destination}`,
        type: "activity"
      }
    ];
    
    itinerary.push({
      day: day,
      title: `Día ${day} en ${destination}`,
      activities: activities
    });
  }

  return {
    destination: destination,
    itinerary: itinerary,
    weather: [
      { period: "Mañana", temperature: "22°C", description: "Soleado con brisa ligera" },
      { period: "Tarde", temperature: "28°C", description: "Parcialmente nublado" },
      { period: "Noche", temperature: "18°C", description: "Despejado" }
    ],
    budget: [
      { category: "Alojamiento", estimatedCost: "$80 - $150 por noche" },
      { category: "Alimentación", estimatedCost: "$40 - $80 por día" },
      { category: "Actividades", estimatedCost: "$20 - $60 por día" },
      { category: "Transporte", estimatedCost: "$15 - $40 por día" }
    ]
  };
}

// Función de respaldo para generar datos simulados más realistas
function generateMockTravelPlan(destination, duration, interests, budgetStyle) {
  const activitiesByType = {
    cultura: {
      morning: ["Visita al museo principal", "Tour por el centro histórico", "Explorar arquitectura colonial", "Visita a biblioteca histórica"],
      afternoon: ["Recorrido por monumentos", "Tour de arte callejero", "Visita a galería local", "Explorar barrios históricos"], 
      evening: ["Espectáculo cultural", "Cena tradicional", "Tour nocturno", "Música en vivo local"]
    },
    naturaleza: {
      morning: ["Senderismo matutino", "Observación de aves", "Caminata por senderos", "Visita al parque nacional"],
      afternoon: ["Excursión a cascadas", "Paseo en bote", "Ciclismo por naturaleza", "Fotografía de paisajes"],
      evening: ["Observación de estrellas", "Fogata nocturna", "Sonidos de la naturaleza", "Relajación al aire libre"]
    },
    gastronomia: {
      morning: ["Tour por mercado local", "Clase de cocina tradicional", "Degustación de café", "Visita a panadería artesanal"],
      afternoon: ["Tour gastronómico", "Cata de vinos/bebidas locales", "Cooking class avanzada", "Mercado de productores"],
      evening: ["Cena en restaurante gourmet", "Food truck tour", "Bar de cócteles local", "Experiencia gastronómica única"]
    },
    aventura: {
      morning: ["Escalada en roca", "Rafting", "Paracaidismo", "Ciclismo de montaña"],
      afternoon: ["Zip line", "Kayak", "Surf/windsurf", "Trekking extremo"],
      evening: ["Deportes nocturnos", "Campamento", "Actividades extremas", "Aventura nocturna"]
    }
  };

  const timeSlots = ['morning', 'afternoon', 'evening'];
  const activities = activitiesByType[interests] || activitiesByType.cultura;
  const itinerary = [];

  // Generar actividades más variadas por día
  for (let day = 1; day <= duration; day++) {
    const dayActivities = [];
    
    // Actividad matutina (9:00)
    const morningActivity = activities.morning[Math.floor(Math.random() * activities.morning.length)];
    dayActivities.push({
      time: "09:00",
      description: morningActivity,
      type: "activity",
      budget: budgetStyle === "economico" ? Math.floor(Math.random() * 20) + 10 : 
              budgetStyle === "medio" ? Math.floor(Math.random() * 30) + 20 : 
              Math.floor(Math.random() * 50) + 30
    });

    // Almuerzo (12:30)
    const lunchOptions = [
      "Almuerzo en restaurante típico local",
      "Picnic en parque cercano", 
      "Comida callejera auténtica",
      "Restaurante con vista panorámica"
    ];
    dayActivities.push({
      time: "12:30",
      description: lunchOptions[Math.floor(Math.random() * lunchOptions.length)],
      type: "dining",
      budget: budgetStyle === "economico" ? Math.floor(Math.random() * 15) + 8 : 
              budgetStyle === "medio" ? Math.floor(Math.random() * 25) + 15 : 
              Math.floor(Math.random() * 40) + 25
    });

    // Actividad vespertina (15:00)
    const afternoonActivity = activities.afternoon[Math.floor(Math.random() * activities.afternoon.length)];
    dayActivities.push({
      time: "15:00",
      description: afternoonActivity,
      type: "activity",
      budget: budgetStyle === "economico" ? Math.floor(Math.random() * 25) + 5 : 
              budgetStyle === "medio" ? Math.floor(Math.random() * 35) + 15 : 
              Math.floor(Math.random() * 55) + 25
    });

    // Actividad nocturna (19:00) - solo para viajes de más de 2 días o días específicos
    if (duration > 2 || day % 2 === 0) {
      const eveningActivity = activities.evening[Math.floor(Math.random() * activities.evening.length)];
      dayActivities.push({
        time: "19:00",
        description: eveningActivity,
        type: day % 3 === 0 ? "dining" : "activity",
        budget: budgetStyle === "economico" ? Math.floor(Math.random() * 30) + 15 : 
                budgetStyle === "medio" ? Math.floor(Math.random() * 45) + 25 : 
                Math.floor(Math.random() * 70) + 40
      });
    }

    itinerary.push({
      day: day,
      title: `Día ${day} - ${destination}`,
      activities: dayActivities
    });
  }

  // Generar clima más realista
  const weatherConditions = [
    { period: "Mañana", temperature: `${18 + Math.floor(Math.random() * 8)}°C`, description: "Fresco y despejado, perfecto para caminar" },
    { period: "Tarde", temperature: `${22 + Math.floor(Math.random() * 8)}°C`, description: "Cálido con brisa ligera, ideal para actividades" },
    { period: "Noche", temperature: `${14 + Math.floor(Math.random() * 6)}°C`, description: "Agradable para actividades nocturnas" }
  ];

  const budgetMultiplier = budgetStyle === "economico" ? 0.7 : budgetStyle === "medio" ? 1.2 : 1.8;

  return {
    destination: destination,
    itinerary: itinerary,
    weather: weatherConditions,
    budget: [
      { 
        category: "Alojamiento", 
        estimatedCost: `$${Math.round(45 * budgetMultiplier)} - $${Math.round(85 * budgetMultiplier)} por noche` 
      },
      { 
        category: "Alimentación", 
        estimatedCost: `$${Math.round(20 * budgetMultiplier)} - $${Math.round(45 * budgetMultiplier)} por día` 
      },
      { 
        category: "Actividades y Tours", 
        estimatedCost: `$${Math.round(25 * budgetMultiplier)} - $${Math.round(60 * budgetMultiplier)} por día` 
      },
      { 
        category: "Transporte Local", 
        estimatedCost: `$${Math.round(10 * budgetMultiplier)} - $${Math.round(25 * budgetMultiplier)} por día` 
      },
      {
        category: "Extras y Compras",
        estimatedCost: `$${Math.round(15 * budgetMultiplier)} - $${Math.round(35 * budgetMultiplier)} por día`
      }
    ]
  };
}

// Función para renderizar el plan de viaje en HTML
function renderTravelPlan(travelPlan) {
  let html = `<div class="travel-plan">
    <h3>Plan de Viaje: ${travelPlan.destination}</h3>`;

  // Itinerario
  html += `<div class="itinerary-section">
    <h4>Itinerario Detallado</h4>`;
  
  travelPlan.itinerary.forEach(day => {
    html += `<div class="day-plan">
      <h5>${day.title}</h5>
      <ul class="activities-list">`;
    
    day.activities.forEach(activity => {
      const budgetText = activity.budget ? ` - $${activity.budget}` : '';
      html += `<li class="activity-item activity-${activity.type}">
        <span class="time">${activity.time}</span>
        <span class="description">${activity.description}${budgetText}</span>
      </li>`;
    });
    
    html += `</ul></div>`;
  });
  
  html += `</div>`;

  // Clima
  html += `<div class="weather-section">
    <h4>Pronóstico del Tiempo</h4>
    <div class="weather-forecast">`;
  
  travelPlan.weather.forEach(period => {
    html += `<div class="weather-item">
      <strong>${period.period}:</strong> ${period.temperature} - ${period.description}
    </div>`;
  });
  
  html += `</div></div>`;

  // Presupuesto
  html += `<div class="budget-section">
    <h4>Presupuesto Estimado</h4>
    <div class="budget-breakdown">`;
  
  travelPlan.budget.forEach(item => {
    html += `<div class="budget-item">
      <strong>${item.category}:</strong> ${item.estimatedCost}
    </div>`;
  });
  
  html += `</div></div></div>`;

  return html;
}

// Exponer funciones globalmente
window.GeminiTravelAPI = {
  generateTravelPlan,
  renderTravelPlan,
  reinitialize: function(apiKey) {
    initializeGeminiAI();
  },
  isConfigured: function() {
    return ai !== null;
  }
};

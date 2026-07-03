import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // API - Live Personalization Endpoint (AI Neurowriting + Theme Transformation)
  app.post('/api/personalize', async (req, res) => {
    try {
      const { destination, dates, preferences, trendKeyword } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Return a mock-fallback structured object if API Key is not set, so the app NEVER crashes
        console.warn('GEMINI_API_KEY not configured. Using high-converting fallback.');
        return res.json(getFallbackPersonalization(destination, preferences));
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const cleanDestination = destination || 'México';
      const cleanPreferences = preferences || 'Relajación y confort';
      const cleanDates = dates || 'Verano 2026';

      const prompt = `
        Eres un experto en Neuromarketing Turístico (Neurowriting) y director creativo para 'Hoteles Reales MX', una agencia de viajes premium y DMC de alta gama.
        Tu misión es crear una experiencia de landing page ultra-persuasiva y adaptativa para un viajero interesado en:
        - Destino: ${cleanDestination}
        - Fechas: ${cleanDates}
        - Preferencias del usuario: ${cleanPreferences}
        - Palabra clave/Tendencia activa: ${trendKeyword || 'Escapada exclusiva de verano'}

        Queremos que tu texto contenga disparadores mentales poderosos (Poder de la exclusividad, urgencia sutil, curaduría de experto, confort absoluto).
        Escribe exclusivamente en español, con un tono elegante, sofisticado pero cercano, que despierte el deseo inmediato de reservar.

        Debes retornar un objeto JSON estricto con las siguientes propiedades:
        1. "headline": Un encabezado hipnótico (de 6 a 12 palabras) que use neurowriting visual (por ejemplo, "Cancún bajo tus propios términos: Despierta frente al azul infinito").
        2. "pitch": Un subtítulo emocional (de 15 a 25 palabras) que justifique la reserva inmediata y eleve el estatus del viaje.
        3. "categories": Un arreglo de exactamente 3 micro-categorías o intereses hiper-segmentados para este viaje (por ejemplo, "A pie de playa", "Curaduría Boutique", "Cenas de Autor"). Cada uno con un nombre, una línea descriptiva tentadora (tagline) y un emoji apropiado.
        4. "hotDeal": Un objeto con una recomendación estrella de hotel de la zona con:
           - "title": Nombre tentador de la experiencia de alojamiento (ej: "Refugio Wellness en Acantilado").
           - "description": Por qué este lugar se alinea mágicamente con sus preferencias de "${cleanPreferences}".
           - "discountLabel": Una oferta que despierte escasez (ej: "Tarifas Privadas DMC: -30% reservando hoy").
        5. "advertising": Una propuesta de up-selling para tu DMC con:
           - "title": Un servicio VIP complementario para este viaje (ej: "Traslado en Tesla Privado + Champagne de bienvenida").
           - "tagline": "Diseñado exclusivamente por nuestro DMC local".
           - "description": Un texto corto que invite a agregar este servicio para un viaje sin fricciones.
           - "buttonText": Botón persuasivo (ej: "Reservar Traslado VIP").
        6. "theme": Configuración visual personalizada que transformará la interfaz del usuario:
           - "primary": Un color hexadecimal elegante (como #0f172a slate, #0284c7 sky, #b45309 amber, o #15803d emerald) que sintonice con el destino y las preferencias del usuario (por ejemplo, tonos tierra/vinos para Oaxaca, turquesas para Cancún, esmeraldas para naturaleza, azul profundo para lujo).
           - "secondary": Un color hexadecimal para degradados o bordes.
           - "accent": Color para botones llamativos que destaque.
           - "moodName": Un nombre poético para este tema visual (ej: "Verde Esmeralda Selvático", "Azul Caribe Privado", "Ocre del Desierto").

        Es vital que el formato JSON sea perfecto y no contenga caracteres extraños.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              pitch: { type: Type.STRING },
              categories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    tagline: { type: Type.STRING },
                    emoji: { type: Type.STRING }
                  },
                  required: ['name', 'tagline', 'emoji']
                }
              },
              hotDeal: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  discountLabel: { type: Type.STRING }
                },
                required: ['title', 'description', 'discountLabel']
              },
              advertising: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  tagline: { type: Type.STRING },
                  description: { type: Type.STRING },
                  buttonText: { type: Type.STRING }
                },
                required: ['title', 'tagline', 'description', 'buttonText']
              },
              theme: {
                type: Type.OBJECT,
                properties: {
                  primary: { type: Type.STRING },
                  secondary: { type: Type.STRING },
                  accent: { type: Type.STRING },
                  moodName: { type: Type.STRING }
                },
                required: ['primary', 'secondary', 'accent', 'moodName']
              }
            },
            required: ['headline', 'pitch', 'categories', 'hotDeal', 'advertising', 'theme']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      res.json(data);
    } catch (err: any) {
      console.error('Error in /api/personalize:', err);
      res.status(500).json({ error: err.message, fallback: getFallbackPersonalization(req.body.destination, req.body.preferences) });
    }
  });

  // API - Active Seasonal Trends & Flow Keywords (Mex/LATAM Summer 2026 Focus)
  app.get('/api/trends', (req, res) => {
    const trends = [
      {
        keyword: 'Cancún y Riviera Maya',
        tag: 'Caribe Turquesa',
        headline: 'Escape Veraniego al Paraíso',
        description: 'La joya del Caribe registra ocupación estelar. Filtramos opciones con acceso a playas exclusivas y tarifas negociadas Stay22.',
        popularity: 97,
        discount: 'Garantía del Mejor Precio en Línea',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
        defaultPreferences: 'Boutique frente al mar, Todo Incluido de lujo'
      },
      {
        keyword: 'Oaxaca de Juárez',
        tag: 'Cultura & Alta Cocina',
        headline: 'Tradiciones y Sabores Ancestrales',
        description: 'Anticipate a las Fiestas de la Guelaguetza. Encuentra hoteles históricos en el andador turístico con patios coloniales y diseño oaxaqueño.',
        popularity: 94,
        discount: 'Bebida de Bienvenida + Desayuno Gratis',
        image: 'https://images.unsplash.com/photo-1465256410760-10485d5be681?auto=format&fit=crop&w=400&q=80',
        defaultPreferences: 'Cerca del Templo de Santo Domingo, Terraza panorámica'
      },
      {
        keyword: 'Los Cabos',
        tag: 'Donde el Desierto se une al Mar',
        headline: 'Atardeceres Dorados en el Pacífico',
        description: 'Vistas dramáticas del Arco, spas de clase mundial y campos de golf galardonados. Encuentra tu oasis de relajación pura.',
        popularity: 91,
        discount: 'Cancelación Gratuita Disponible',
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
        defaultPreferences: 'Resort de bienestar, Spa frente al mar'
      },
      {
        keyword: 'Valle de Guadalupe',
        tag: 'Baja Glamping & Vino',
        headline: 'Ruta del Vino bajo las Estrellas',
        description: 'Temporada de vendimias en Baja California. Escapa a viñedos rústico-elegantes, degustaciones privadas y arquitectura sustentable.',
        popularity: 88,
        discount: 'Hasta 15% de descuento en estancias de +3 noches',
        image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=400&q=80',
        defaultPreferences: 'Hotel de diseño en viñedo, Gastronomía de huerto'
      }
    ];
    res.json(trends);
  });

  // API - General configurations and referral token verification
  app.get('/api/config', (req, res) => {
    res.json({
      affiliateToken: 'stay22_c7ab2bf0-8b8c-47c0-bbe1-2d4cb9ba2bb2',
      projectName: 'Hoteles Reales MX',
      dmcBrand: 'Destinos Reales DMC',
      description: 'Herramienta de búsqueda e inteligencia de viajes ultra-personalizada para agencias y viajeros independientes.'
    });
  });

  // Lead capture webhook mock - Flywheel outreach simulator (Proyecto 2 integrations)
  app.post('/api/price-alert', (req, res) => {
    const { email, phone, destination, budget, checkin, checkout } = req.body;
    
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Falta correo electrónico o WhatsApp' });
    }

    console.log(`[Flywheel Intent Triggered] Alert registered for ${destination}: ${email || phone}`);
    
    // Simulating n8n / Make.com trigger and auto-nurturing workflow
    res.json({
      success: true,
      message: '¡Alerta Inteligente Registrada!',
      details: 'Hemos activado el Intent Signal Flywheel de nuestro DMC. El motor buscará caídas de precios y enviará recomendaciones 100% curadas en menos de 10 minutos por el canal seleccionado.',
      leadData: {
        destination,
        userContact: email || phone,
        intentLevel: 'HIGH_INTEREST',
        flowStatus: 'NURTURING_ACTIVE'
      }
    });
  });

  // Serve static files / Vite middleware
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

// Structured mock fallback for instant high-quality loading when API keys aren't configured or fail
function getFallbackPersonalization(destination: string = '', preferences: string = '') {
  const dest = destination || 'México';
  const pref = preferences || 'Relajación y Confort';
  
  return {
    headline: `Tu estancia perfecta en ${dest} seleccionada a mano`,
    pitch: `Curaduría exclusiva adaptada a tus deseos de "${pref}". Reserva en tiempo real con las mejores tarifas garantizadas del mercado.`,
    categories: [
      {
        name: 'Ubicación Premium',
        tagline: 'Hoteles con la mejor puntuación de accesibilidad y vistas.',
        emoji: '📍'
      },
      {
        name: 'Curaduría Exclusiva',
        tagline: 'Selección boutique que garantiza confort y servicio personalizado.',
        emoji: '✨'
      },
      {
        name: 'Tarifas del Día',
        tagline: 'Precios competitivos actualizados al segundo directamente de Stay22.',
        emoji: '💵'
      }
    ],
    hotDeal: {
      title: 'Alojamiento Destacado de Temporada',
      description: `Propiedad boutique altamente recomendada en ${dest} con comodidades premium y excelente reputación para tu perfil.`,
      discountLabel: 'Tarifa Negociada Stay22: Cancelación gratuita disponible'
    },
    advertising: {
      title: 'Servicio de Concierge y Traslado VIP',
      tagline: 'Diseñado por nuestro DMC Destinos Reales',
      description: 'Evita filas y viaja con total tranquilidad. Traslado privado desde el aeropuerto directo a tu hotel con chofer bilingüe y amenidades premium.',
      buttonText: 'Añadir Traslado Terrestre VIP'
    },
    theme: {
      primary: '#0f172a', // Slate
      secondary: '#1e293b',
      accent: '#0284c7', // Sky blue
      moodName: 'Oasis Elegante Nocturno'
    }
  };
}

startServer();

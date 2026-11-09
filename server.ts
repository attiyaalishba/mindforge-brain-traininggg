import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CognitiveTip {
  title: string;
  category: string;
  tip: string;
  scientificBasis: string;
}

const FALLBACK_TIPS: CognitiveTip[] = [
  {
    title: "Chunking Technique",
    category: "Working Memory",
    tip: "Group cards into spatial clusters (e.g. 2x2 quadrants) instead of scanning randomly. Your working memory holds roughly 4 items at once.",
    scientificBasis: "George A. Miller (1956) & Nelson Cowan (2001) Working Memory Capacity."
  },
  {
    title: "Dual Coding Strategy",
    category: "Visual Retention",
    tip: "Subvocalize the card's name while visualizing its exact grid position. Encoding both verbal and visual cues doubles memory retention pathways.",
    scientificBasis: "Allan Paivio (1971) Dual-Coding Theory."
  },
  {
    title: "The Testing Effect",
    category: "Recall Speed",
    tip: "Before turning a second card, pause for half a second and actively test yourself on where you last saw the match. Active retrieval strengthens neural synapses faster than passive browsing.",
    scientificBasis: "Roediger & Karpicke (2006) Test-Enhanced Learning."
  },
  {
    title: "Method of Loci (Spatial Anchoring)",
    category: "Spatial Mapping",
    tip: "Mentally anchor the card grid to familiar spots in your room (top-left is door, center is desk) to leverage your brain's spatial navigation system.",
    scientificBasis: "Maguire et al. (2003) & O'Keefe (1978) Hippocampal Place Cells."
  },
  {
    title: "Inhibition of Return",
    category: "Attention Control",
    tip: "Suppress the impulse to re-check recently flipped cards unless you have a verified match. Eliminating redundant checks preserves cognitive bandwidth.",
    scientificBasis: "Posner & Cohen (1984) Visual Attention & Saccadic Inhibition."
  },
  {
    title: "Visual Imagery Elaboration",
    category: "Pattern Recognition",
    tip: "Connect the card symbol to its row and column with a bizarre mental association. High-novelty associations trigger rapid hippocampal consolidation.",
    scientificBasis: "Bower (1970) Imagery in Learning and Memory."
  },
  {
    title: "Spaced Eye Movements",
    category: "Cognitive Endurance",
    tip: "Scan cards rhythmically in systematic rows rather than darting your gaze. Structured saccades reduce oculomotor fatigue and improve visual working memory.",
    scientificBasis: "Rayner (1998) Eye Movements in Reading and Information Processing."
  }
];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Initialize Google GenAI with recommended telemetry header
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API endpoint for evidence-based cognitive training tips
  app.get('/api/cognitive-tip', async (_req: Request, res: Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        const randomTip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
        return res.json({ tip: randomTip, source: 'curated' });
      }

      const prompt = `You are a cognitive neuroscientist specializing in working memory, visual attention, and memory training games.
Generate exactly ONE practical, evidence-based memory training tip for a player about to start a visual memory card matching game.
The tip must be scientifically grounded, realistic, and directly actionable while playing on a grid of memory cards.

Return a JSON object with:
- "title": A short punchy title (max 5 words).
- "category": One of "Working Memory", "Spatial Mapping", "Visual Attention", "Recall Speed", "Cognitive Strategy", or "Pattern Recognition".
- "tip": 1 to 2 clear sentences describing how to use this technique right now on the board.
- "scientificBasis": 1 brief sentence citing the scientific study, theory, or cognitive psychology principle (e.g. "Baddeley's Visuospatial Sketchpad", "Miller's Chunking Limit (1956)", "Dual-Coding Theory (Paivio)").`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              tip: { type: Type.STRING },
              scientificBasis: { type: Type.STRING },
            },
            required: ['title', 'category', 'tip', 'scientificBasis'],
          },
          temperature: 0.85,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('No response text returned from Gemini API');
      }

      const parsed = JSON.parse(responseText) as CognitiveTip;
      return res.json({ tip: parsed, source: 'gemini' });
    } catch (error) {
      console.warn('Gemini tip generation fallback triggered:', error);
      const randomTip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
      return res.json({ tip: randomTip, source: 'fallback' });
    }
  });

  // Setup Vite in development or static serving in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

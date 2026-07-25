import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const BRAIN_DIR = 'C:/Users/LENOVO/.gemini/antigravity-ide/brain/8f833c99-6cb9-4242-bf79-642d79bb33a2/';

const IMAGE_MAP = {
  '/hero_doctors.png': BRAIN_DIR + 'hero_doctors_1783823187621.png',
  '/doctors_team.png': BRAIN_DIR + 'doctors_team_1783823200333.png',
  '/doctor_sarah.png': BRAIN_DIR + 'doctor_sarah_1783823213613.png',
  '/doctor_marcus.png': BRAIN_DIR + 'doctor_marcus_1783823225567.png',
  '/doctor_emily.png': BRAIN_DIR + 'doctor_emily_1783823237547.png',
};

function serveGeneratedImages() {
  return {
    name: 'serve-generated-images',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = req.url.split('?')[0];
        const filePath = IMAGE_MAP[urlPath];
        if (filePath && fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Cache-Control', 'no-cache');
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveGeneratedImages()],
  server: { port: 5173 },
});


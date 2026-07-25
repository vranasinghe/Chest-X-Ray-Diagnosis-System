const fs = require('fs');
const path = require('path');

const src = 'C:/Users/LENOVO/.gemini/antigravity-ide/brain/8f833c99-6cb9-4242-bf79-642d79bb33a2/';
const dst = path.join(__dirname, 'radiology-platform/radiology-platform/frontend/public/');

if (!fs.existsSync(dst)) {
  fs.mkdirSync(dst, { recursive: true });
}

const files = [
  ['hero_doctors_1783823187621.png', 'hero_doctors.png'],
  ['doctors_team_1783823200333.png', 'doctors_team.png'],
  ['doctor_sarah_1783823213613.png', 'doctor_sarah.png'],
  ['doctor_marcus_1783823225567.png', 'doctor_marcus.png'],
  ['doctor_emily_1783823237547.png', 'doctor_emily.png'],
];

files.forEach(([s, d]) => {
  try {
    const srcFile = path.join(src, s);
    const dstFile = path.join(dst, d);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, dstFile);
      console.log('[SUCCESS] Copied: ' + d);
    } else {
      console.warn('[WARNING] Source file not found: ' + srcFile);
    }
  } catch (e) {
    console.error('[ERROR] Failed copying ' + d + ': ' + e.message);
  }
});

console.log('Finished copying images to frontend/public.');

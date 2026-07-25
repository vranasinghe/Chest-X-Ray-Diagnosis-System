const fs = require('fs');
const path = require('path');

const src = 'C:/Users/LENOVO/.gemini/antigravity-ide/brain/8f833c99-6cb9-4242-bf79-642d79bb33a2/';
const dst = 'C:/Users/LENOVO/OneDrive/Desktop/AI Powered Diagnosis System/radiology-platform/radiology-platform/frontend/public/';

const files = [
  ['hero_doctors_1783823187621.png', 'hero_doctors.png'],
  ['doctors_team_1783823200333.png', 'doctors_team.png'],
  ['doctor_sarah_1783823213613.png', 'doctor_sarah.png'],
  ['doctor_marcus_1783823225567.png', 'doctor_marcus.png'],
  ['doctor_emily_1783823237547.png', 'doctor_emily.png'],
];

files.forEach(([s, d]) => {
  try {
    fs.copyFileSync(src + s, dst + d);
    console.log('Copied: ' + d);
  } catch (e) {
    console.error('FAIL ' + d + ': ' + e.message);
  }
});

console.log('Done.');

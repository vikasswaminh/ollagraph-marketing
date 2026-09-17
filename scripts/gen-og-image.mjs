import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const svgPath = path.resolve('public/og-image.svg');
const outPngPath = path.resolve('public/og-image.png');
const tempHtmlPath = path.resolve('public/og-image-temp.html');

const svgContent = fs.readFileSync(svgPath, 'utf8');

// HTML wrapper ensures 0 margins, exact 1200x630 viewport, no scrollbars
const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 1200px;
    height: 630px;
    overflow: hidden;
    background: #080C14;
  }
  svg {
    display: block;
    width: 1200px;
    height: 630px;
  }
</style>
</head>
<body>
${svgContent}
</body>
</html>`;

fs.writeFileSync(tempHtmlPath, html, 'utf8');

// Find Chrome or Edge executable on Windows
const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

const browserExe = chromeCandidates.find(c => fs.existsSync(c));

if (!browserExe) {
  console.error('Neither Google Chrome nor Microsoft Edge was found.');
  process.exit(1);
}

console.log(`Rendering OG image using Chrome engine: ${browserExe}`);

const fileUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;

// Run Chrome headless to take a 1:1 pixel-perfect screenshot at 1200x630
const cmd = `"${browserExe}" --headless=new --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot="${outPngPath}" "${fileUrl}"`;

execSync(cmd, { stdio: 'inherit' });

// Clean up temporary HTML wrapper
if (fs.existsSync(tempHtmlPath)) {
  fs.unlinkSync(tempHtmlPath);
}

console.log('Successfully wrote pixel-perfect public/og-image.png using Chrome!');

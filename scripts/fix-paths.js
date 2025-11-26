#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASE_PATH = '/Conquien';
const DIST_DIR = path.join(__dirname, '..', 'dist');

function fixPathsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const isHTML = filePath.endsWith('.html');
  const isJS = filePath.endsWith('.js');

  // Fix absolute paths in src and href attributes
  // Replace /_expo/ with /Conquien/_expo/
  // Replace /favicon.ico with /Conquien/favicon.ico
  // But don't replace if it already starts with the base path or is a protocol-relative URL
  const patterns = [
    // HTML attributes with double quotes - match paths that start with / but not /Conquien/ or http(s)://
    { from: /src="\/(?!Conquien\/|https?:\/\/)([^"]+)"/g, to: `src="${BASE_PATH}/$1"` },
    { from: /href="\/(?!Conquien\/|https?:\/\/)([^"]+)"/g, to: `href="${BASE_PATH}/$1"` },
    // HTML attributes with single quotes
    { from: /src='\/(?!Conquien\/|https?:\/\/)([^']+)'/g, to: `src='${BASE_PATH}/$1'` },
    { from: /href='\/(?!Conquien\/|https?:\/\/)([^']+)'/g, to: `href='${BASE_PATH}/$1'` },
  ];

  // For HTML files, also add/update base tag
  if (isHTML && !content.includes('<base')) {
    // Add base tag right after <head>
    content = content.replace(/<head[^>]*>/, `$&<base href="${BASE_PATH}/">`);
  } else if (isHTML && content.includes('<base')) {
    // Update existing base tag
    content = content.replace(/<base[^>]*>/, `<base href="${BASE_PATH}/">`);
  }

  // For HTML files, disable hydration to prevent mismatch errors
  // Replace __EXPO_ROUTER_HYDRATE__=true with false
  if (isHTML) {
    content = content.replace(/__EXPO_ROUTER_HYDRATE__=true/g, '__EXPO_ROUTER_HYDRATE__=false');
    // Clear the root div content to force client-side rendering
    // This prevents hydration mismatches by ensuring React renders everything client-side
    // Match: <div id="root">...any content...</div> and replace with empty div
    content = content.replace(/<div id="root">[\s\S]*?<\/div>/, '<div id="root"></div>');
  }

  // For JavaScript files, fix common path patterns
  if (isJS) {
    // Fix paths in string literals that look like routes or assets
    // Match: "/_expo/", "/favicon.ico", "/lobby/", "/game/", "/win/"
    content = content.replace(/(['"])\/(_expo\/|favicon\.ico|lobby\/|game\/|win\/|)([^'"]*)\1/g, (match, quote, prefix, rest) => {
      if (!prefix.startsWith('Conquien/')) {
        return `${quote}${BASE_PATH}/${prefix}${rest}${quote}`;
      }
      return match;
    });
  }

  patterns.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed paths in ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  return false;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.html') || file.endsWith('.js')) {
      fixPathsInFile(filePath);
    }
  });
}

console.log('Fixing absolute paths for GitHub Pages...');
walkDir(DIST_DIR);
console.log('Done!');


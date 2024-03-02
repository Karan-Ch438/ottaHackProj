import { defineManifest } from '@crxjs/vite-plugin';
import packageData from '../package.json' assert { type: 'json' };

const isDev = process.env.NODE_ENV == 'development';

// Your existing manifest object
const existingManifest = {
  name: `${packageData.displayName || packageData.name}${isDev ? ` ➡️ Dev` : ''}`,
  description: packageData.description,
  version: packageData.version,
  manifest_version: 3,
  icons: {
    16: 'img/logo-16.png',
    32: 'img/logo-34.png',
    48: 'img/logo-48.png',
    128: 'img/logo-128.png',
  },
  action: {
    default_popup: 'popup.html',
    default_icon: 'img/logo-48.png',
  },
  options_page: 'options.html',
  devtools_page: 'devtools.html',
  background: {
    service_worker: 'src/background/index.js',
    type: 'module',
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'"
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/contentScript/index.js'],
    }, {
      matches: ['https://meet.google.com/*-'],
      exclude_matches: ["https://meet.google.com/"],
      js: ['src/contentScript/content.js'],
      run_at: "document_end",
    }
  ],
  side_panel: {
    default_path: 'sidepanel.html',
  },
  web_accessible_resources: [
    {
      resources: ['img/logo-16.png', 'img/logo-34.png', 'img/logo-48.png', 'img/logo-128.png'],
      matches: [],
    },
  ],
  permissions: ['sidePanel', 'storage', 'downloads'],
  host_permissions: [
    "https://meet.google.com/*"
  ],
  chrome_url_overrides: {
    newtab: 'newtab.html',
  },
};

// Your new manifest JSON
const newManifest = {
  manifest_version: 3,
  name: "Reading time",
  version: "1.0",
  description: "Add the reading time to Chrome Extension documentation articles",
};

// Merge the two manifests
const mergedManifest = { ...existingManifest, ...newManifest };

// Define the manifest using defineManifest function
export default defineManifest(mergedManifest);

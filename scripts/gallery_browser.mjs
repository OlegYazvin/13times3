import {access,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {chromium} from 'playwright';

export async function enterExhibit(page){
 await page.waitForFunction(()=>Boolean(window.__galleryDebug));
 if(await page.locator('#welcome').isVisible())throw Error('The exhibit must open directly, without an instructions overlay');
 await page.locator('#scene canvas').click({position:{x:35,y:220}});
}

export async function galleryBrowserExecutable(){
  if(process.env.GALLERY_BROWSER_EXECUTABLE){await access(process.env.GALLERY_BROWSER_EXECUTABLE);return process.env.GALLERY_BROWSER_EXECUTABLE;}
  const expected=chromium.executablePath();
  // The gallery tools all render headlessly. Prefer the matching Playwright
  // shell when installed; the full desktop Chromium runtime has intermittently
  // closed during software-WebGL readbacks in this local review environment.
  const revision=expected.match(/chromium-(\d+)[/\\]/);
  if(process.platform==='linux'&&revision){
    const shell=join(expected.slice(0,revision.index),`chromium_headless_shell-${revision[1]}`,'chrome-headless-shell-linux64','chrome-headless-shell');
    try{await access(shell);return shell;}catch{}
  }
  try{await access(expected);return expected;}catch{}
  // Local Linux fallback when the package revision is newer than an already
  // installed headless runtime. An explicit override always takes priority.
  const cache=process.env.PLAYWRIGHT_BROWSERS_PATH||join(homedir(),'.cache','ms-playwright');
  let entries=[];try{entries=await readdir(cache);}catch{}
  for(const name of entries.filter(x=>/^chromium_headless_shell-\d+$/.test(x)).sort((a,b)=>Number(b.split('-').at(-1))-Number(a.split('-').at(-1)))){
    const candidate=join(cache,name,'chrome-headless-shell-linux64','chrome-headless-shell');
    try{await access(candidate);return candidate;}catch{}
  }
  throw Error('No Chromium runtime found. Install the Playwright browser or set GALLERY_BROWSER_EXECUTABLE.');
}

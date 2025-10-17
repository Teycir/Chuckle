import { performCleanup } from './cleanup';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Chuckle] Extension installed, creating context menu');
  chrome.contextMenus.create({
    id: "remixAsMeme",
    title: "Remix as a Meme",
    contexts: ["selection"]
  });
  
  // Schedule weekly cleanup
  chrome.alarms.create('weeklyCleanup', { periodInMinutes: 10080 }); // 7 days
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'weeklyCleanup') {
    performCleanup().then(result => {
      if (result.removed > 0) {
        console.log(`[Chuckle] Cleaned ${result.removed} old memes, freed ${(result.freedBytes / 1024).toFixed(1)}KB`);
      }
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "remixAsMeme" && info.selectionText && tab?.id) {
    console.log('[Chuckle] Context menu clicked, text:', info.selectionText.slice(0, 50));
    chrome.tabs.sendMessage(tab.id, {
      action: "generateMeme",
      text: info.selectionText
    });
  }
});

chrome.commands.onCommand.addListener((command) => {
  console.log('[Chuckle] Keyboard shortcut triggered:', command);
  if (command === "generate-meme") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "generateMemeFromSelection" });
      }
    });
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'openPopup') {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  }
});

import { performCleanup } from './cleanup';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Chuckle] Background script loaded ✅');
  
  try {
    chrome.contextMenus.create({
      id: "remixAsMeme",
      title: "Remix as a Meme",
      contexts: ["selection"]
    });
    console.log('[Chuckle] Context menu created ✅');
    
    // Schedule weekly cleanup
    chrome.alarms.create('weeklyCleanup', { periodInMinutes: 10080 }); // 7 days
    console.log('[Chuckle] Cleanup alarm scheduled ✅');
  } catch (error) {
    console.log('[Chuckle] Setup error:', error instanceof Error ? error.message : String(error));
  }
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
    }).catch((error) => {
      console.log('[Chuckle] Message send failed (tab may be closed):', error instanceof Error ? error.message : String(error));
    });
  }
});

chrome.commands.onCommand.addListener((command) => {
  console.log('[Chuckle] Keyboard shortcut triggered:', command);
  if (command === "generate-meme") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "generateMemeFromSelection" }).catch((error) => {
          console.log('[Chuckle] Message send failed (content script may not be ready):', error instanceof Error ? error.message : String(error));
        });
      }
    });
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === 'openPopup') {
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
      sendResponse({ success: true });
    } else if (message.action === 'openTab') {
      chrome.tabs.create({ url: message.url });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log('[Chuckle] Background message error:', errorMsg);
    sendResponse({ success: false, error: errorMsg });
  }
  return true;
});

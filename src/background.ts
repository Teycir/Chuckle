import { performCleanup } from './cleanup';

chrome.runtime.onInstalled.addListener(() => {
  
  try {
    chrome.contextMenus.create({
      id: "remixAsMeme",
      title: "Remix as a Meme",
      contexts: ["selection"]
    });
    
    // Schedule weekly cleanup
    chrome.alarms.create('weeklyCleanup', { periodInMinutes: 10080 }); // 7 days
  } catch (error) {
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'weeklyCleanup') {
    performCleanup().then(result => {
      if (result.removed > 0) {
      }
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "remixAsMeme" && info.selectionText && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: "generateMeme",
      text: info.selectionText
    }).catch((error) => {
    });
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "generate-meme") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "generateMemeFromSelection" }).catch((error) => {
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
    sendResponse({ success: false, error: errorMsg });
  }
  return true;
});

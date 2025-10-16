chrome.runtime.onInstalled.addListener(() => {
  console.log('[Chuckle] Extension installed, creating context menu');
  chrome.contextMenus.create({
    id: "remixAsMeme",
    title: "Remix as a Meme",
    contexts: ["selection"]
  });
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

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "remixAsMeme",
    title: "Remix as a Meme",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "remixAsMeme" && info.selectionText && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: "generateMeme",
      text: info.selectionText
    });
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "generate-meme") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "generateMemeFromSelection" });
      }
    });
  }
});

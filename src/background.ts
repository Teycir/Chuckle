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

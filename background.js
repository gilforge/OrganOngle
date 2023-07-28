// Listen for when a Tab is updated
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
      handleUpdated(tabId, changeInfo, tab);
    }
  });
  
  const handleUpdated = (tabId, changeInfo, tab) => {
    const url = new URL(tab.url);
    const domain = url.hostname;
  
    // Group tabs by domain
    browser.tabs.query({}).then((tabs) => {
      const tabsByDomain = tabs.reduce((groups, tab) => {
        const url = new URL(tab.url);
        const domain = url.hostname;
        if (!groups[domain]) {
          groups[domain] = [];
        }
        groups[domain].push(tab);
        return groups;
      }, {});
  
      // If the updated tab is the active tab, capture an image of it
      if (tab.active) {
        browser.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 10 }).then((dataUrl) => {
          // Store the thumbnail data URL
          tab.thumbnail = dataUrl;
        });
      }
  
      // Do something with the grouped tabs
    });
  };
      
  // Listen for when the extension's browser action is clicked
  browser.browserAction.onClicked.addListener(() => {
    // When the browser action is clicked, open the popup
    // The popup should handle displaying the grouped tabs and their thumbnails
    browser.browserAction.setPopup({ popup: 'popup/popup.html' });
  });
  
  // Listen for messages from the popup
browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'openTab') {
      // Open the tab
      browser.tabs.update(message.tabId, { active: true });
    } else if (message.action === 'closeTab') {
      // Close the tab
      browser.tabs.remove(message.tabId).then(() => {
        // Send a message to the popup to refresh the tabs
        browser.runtime.sendMessage({ action: 'refreshTabs' });
      });
    }
  });
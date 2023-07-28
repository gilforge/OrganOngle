// When the popup is loaded, get the grouped tabs
document.addEventListener('DOMContentLoaded', () => {
    browser.tabs.query({}).then((tabs) => {
        const groupedTabs = groupTabs(tabs);
        displayGroupedTabs(groupedTabs);
    });
});

// Group tabs by domain
const groupTabs = (tabs) => {
    return tabs.reduce((groups, tab) => {
        const url = new URL(tab.url);
        const domain = url.hostname;
        if (!groups[domain]) {
            groups[domain] = [];
        }
        groups[domain].push(tab);
        return groups;
    }, {});
};

// Display the grouped tabs in the popup
const displayGroupedTabs = (groupedTabs) => {
    const container = document.getElementById('grouped-tabs');
    for (const domain in groupedTabs) {
        const domainElement = document.createElement('h2');
        domainElement.textContent = domain;
        container.appendChild(domainElement);

        // Add an event listener to each domain name
        domainElement.addEventListener('click', () => {
            const tabList = domainElement.nextElementSibling;
            tabList.style.display = tabList.style.display === 'none' ? 'grid' : 'none';
        });

        const tabList = document.createElement('ul');
        groupedTabs[domain].forEach((tab) => {
            const tabElement = document.createElement('li');
            const favicon = document.createElement('img');
            favicon.src = tab.favIconUrl;
            tabElement.appendChild(favicon);

            // Make the tab title clickable
            const title = document.createElement('span');
            title.textContent = tab.title;
            title.style.cursor = 'pointer';
            title.addEventListener('click', () => {
                // Send a message to the background script to open the tab
                browser.runtime.sendMessage({ action: 'openTab', tabId: tab.id });
            });
            tabElement.appendChild(title);

            // Add a close button to each tab
            const closeButton = document.createElement('span');
            closeButton.textContent = 'x';
            closeButton.className = 'closeButton';
            closeButton.addEventListener('click', (event) => {
                // Prevent the tab title click event from firing
                event.stopPropagation();
                // Send a message to the background script to close the tab
                browser.runtime.sendMessage({ action: 'closeTab', tabId: tab.id });
            });
            tabElement.appendChild(closeButton);

            tabList.appendChild(tabElement);
        });
        container.appendChild(tabList);
    }
};

// Listen for messages from the background script
browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'refreshTabs') {
      // Refresh the tabs
      const container = document.getElementById('grouped-tabs');
      // Save the current scroll position
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      container.innerHTML = '';
      browser.tabs.query({}).then((tabs) => {
        const groupedTabs = groupTabs(tabs);
        displayGroupedTabs(groupedTabs);
        // Restore the scroll position
        document.documentElement.scrollTop = document.body.scrollTop = scrollTop;
      });
    }
  });
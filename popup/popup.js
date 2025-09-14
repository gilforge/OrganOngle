// Popup simplifié mais fonctionnel avec les nouvelles fonctionnalités
console.log('=== POPUP ORGANONGLE V2 CHARGÉ ===');

let currentTab = 'domain';

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    initializeTabs();
    loadDomainTabs();
});

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            console.log('Switching to tab:', tabName);
            
            // Update button states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update content visibility
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            currentTab = tabName;
            loadTabContent(tabName);
        });
    });
}

function loadTabContent(tabName) {
    switch(tabName) {
        case 'domain':
            loadDomainTabs();
            break;
        case 'subject':
            loadSubjectTabs();
            break;
        case 'duplicates':
            loadDuplicateTabs();
            break;
        case 'stopwords':
            loadStopwordsTab();
            break;
    }
}

function loadDomainTabs() {
    console.log('Loading domain tabs...');
    const container = document.getElementById('grouped-tabs');
    
    if (!container) {
        console.error('Container not found');
        return;
    }
    
    // Clear container
    container.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">Chargement des onglets...</p>';
    
    if (!browser || !browser.tabs) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: red;">Erreur: API browser non disponible</p>';
        return;
    }
    
    browser.tabs.query({}).then((tabs) => {
        console.log('Got tabs:', tabs.length);
        displayDomainTabs(tabs);
    }).catch(error => {
        console.error('Error loading tabs:', error);
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: red;">Erreur: ' + error.message + '</p>';
    });
}

function displayDomainTabs(tabs) {
    const container = document.getElementById('grouped-tabs');
    container.innerHTML = '';
    
    // Group by domain
    const domains = {};
    tabs.forEach(tab => {
        try {
            const url = new URL(tab.url);
            const domain = url.hostname;
            if (!domains[domain]) domains[domain] = [];
            domains[domain].push(tab);
        } catch (e) {
            console.warn('Invalid URL:', tab.url);
        }
    });
    
    // Display domains with group creation functionality
    Object.keys(domains).sort().forEach(domain => {
        const domainTabs = domains[domain];
        
        // Domain container
        const domainContainer = document.createElement('div');
        domainContainer.style.cssText = `
            border: 1px solid #ddd;
            border-radius: 6px;
            margin-bottom: 15px;
            background: white;
        `;
        
        // Domain header with group creation button (like subjects)
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: #f0f8ff;
            border: 1px solid #4a90e2;
            border-left: 4px solid #4a90e2;
            border-radius: 6px 6px 0 0;
            cursor: pointer;
            transition: background-color 0.3s;
        `;
        
        // Left side: domain name and count
        const leftDiv = document.createElement('div');
        leftDiv.style.display = 'flex';
        leftDiv.style.alignItems = 'center';
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = domain;
        titleSpan.style.cssText = `
            font-weight: bold;
            color: #4a90e2;
            margin-right: 10px;
        `;
        
        const countSpan = document.createElement('span');
        countSpan.textContent = domainTabs.length;
        countSpan.style.cssText = `
            background: #4a90e2;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
        `;
        
        leftDiv.appendChild(titleSpan);
        leftDiv.appendChild(countSpan);
        
        // Right side: create group button
        const createBtn = document.createElement('button');
        createBtn.textContent = 'Créer groupe';
        createBtn.style.cssText = `
            background: #28a745;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            transition: background-color 0.3s;
        `;
        
        createBtn.addEventListener('mouseenter', () => {
            createBtn.style.backgroundColor = '#218838';
        });
        createBtn.addEventListener('mouseleave', () => {
            createBtn.style.backgroundColor = '#28a745';
        });
        
        createBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Creating domain group for:', domain);
            
            const tabIds = domainTabs.map(tab => tab.id);
            showMessage(`Création du groupe "${domain}" en cours...`, 'info');
            
            browser.runtime.sendMessage({
                action: 'createTabGroup',
                tabIds: tabIds,
                groupName: domain
            }).then(response => {
                if (response && response.action === 'groupCreated') {
                    if (response.groupId) {
                        showMessage(`Groupe "${domain}" créé avec ${response.tabCount} onglets!`, 'success');
                    } else if (response.windowId) {
                        showMessage(`Groupe "${domain}" créé dans une nouvelle fenêtre avec ${response.tabCount} onglets!`, 'success');
                    } else {
                        showMessage(`Groupe "${domain}" créé!`, 'success');
                    }
                } else if (response && response.action === 'error') {
                    showMessage(`Erreur: ${response.message}`, 'error');
                } else {
                    showMessage('Réponse inattendue du script de fond', 'warning');
                }
            }).catch(error => {
                console.error('Error creating domain group:', error);
                showMessage('Erreur lors de la création du groupe', 'error');
            });
        });
        
        header.appendChild(leftDiv);
        header.appendChild(createBtn);
        
        // Tabs container (initially hidden)
        const tabsContainer = document.createElement('div');
        tabsContainer.style.display = 'none';
        tabsContainer.style.padding = '10px';
        
        // Create tab elements
        domainTabs.forEach(tab => {
            const tabElement = createTabElement(tab);
            tabsContainer.appendChild(tabElement);
        });
        
        // Click to toggle (only on header, not button)
        let isExpanded = false;
        header.addEventListener('click', (e) => {
            // Don't toggle if clicking on the button
            if (e.target === createBtn || createBtn.contains(e.target)) {
                return;
            }
            
            isExpanded = !isExpanded;
            tabsContainer.style.display = isExpanded ? 'block' : 'none';
            
            // Update visual indicator
            titleSpan.textContent = `${domain} ${isExpanded ? '↑' : '↓'}`;
        });
        
        // Hover effects
        header.addEventListener('mouseenter', () => {
            if (!createBtn.matches(':hover')) {
                header.style.backgroundColor = '#e6f3ff';
            }
        });
        header.addEventListener('mouseleave', () => {
            header.style.backgroundColor = '#f0f8ff';
        });
        
        domainContainer.appendChild(header);
        domainContainer.appendChild(tabsContainer);
        container.appendChild(domainContainer);
    });
}

function createTabElement(tab) {
    const element = document.createElement('div');
    element.style.cssText = `
        display: flex;
        align-items: center;
        padding: 10px;
        margin: 5px 0;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        transition: all 0.3s;
    `;
    
    // Favicon
    const favicon = document.createElement('img');
    favicon.src = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="%23ddd"/></svg>';
    favicon.width = 16;
    favicon.height = 16;
    favicon.style.marginRight = '10px';
    
    // Title (clickable)
    const title = document.createElement('span');
    title.textContent = tab.title;
    title.style.cssText = `
        flex: 1;
        cursor: pointer;
        color: #007bff;
        font-size: 12px;
        text-decoration: none;
    `;
    
    // Make title clickable
    title.addEventListener('click', () => {
        console.log('Opening tab:', tab.id);
        browser.runtime.sendMessage({ action: 'openTab', tabId: tab.id });
    });
    
    title.addEventListener('mouseenter', () => {
        title.style.textDecoration = 'underline';
    });
    title.addEventListener('mouseleave', () => {
        title.style.textDecoration = 'none';
    });
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '🗑️';
    closeBtn.style.cssText = `
        background: #f44336;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 6px 10px;
        cursor: pointer;
        font-size: 12px;
        margin-left: 10px;
        transition: background-color 0.3s;
    `;
    
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Closing tab:', tab.id);
        browser.runtime.sendMessage({ action: 'closeTab', tabId: tab.id });
        
        // Reload after close
        setTimeout(() => {
            loadDomainTabs();
        }, 500);
    });
    
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = '#d32f2f';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = '#f44336';
    });
    
    // Hover effect for whole element
    element.addEventListener('mouseenter', () => {
        element.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        element.style.backgroundColor = '#f8f9fa';
    });
    element.addEventListener('mouseleave', () => {
        element.style.boxShadow = 'none';
        element.style.backgroundColor = 'white';
    });
    
    element.appendChild(favicon);
    element.appendChild(title);
    element.appendChild(closeBtn);
    
    return element;
}

function loadSubjectTabs() {
    const container = document.getElementById('subject-groups');
    const loading = document.getElementById('loading-subjects');
    
    if (container) container.innerHTML = '';
    if (loading) loading.style.display = 'block';
    
    // Initialiser les boutons de tri une seule fois
    initializeSortButtons();
    
    browser.runtime.sendMessage({ action: 'getTabsBySubject' }).then((response) => {
        if (loading) loading.style.display = 'none';
        
        if (response && Object.keys(response).length > 0) {
            // Utiliser le tri par défaut (nombre d'onglets)
            const currentSort = getCurrentSortType();
            displaySubjectGroups(response, currentSort);
        } else {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Aucun sujet détecté.</p>';
        }
    }).catch(error => {
        if (loading) loading.style.display = 'none';
        console.error('Error loading subjects:', error);
        container.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Erreur: ' + error.message + '</p>';
    });
}

function initializeSortButtons() {
    const alphaBtn = document.getElementById('sort-subjects-alpha');
    const countBtn = document.getElementById('sort-subjects-count');
    
    if (!alphaBtn || !countBtn) return;
    
    // Éviter les doublons d'event listeners
    alphaBtn.replaceWith(alphaBtn.cloneNode(true));
    countBtn.replaceWith(countBtn.cloneNode(true));
    
    const newAlphaBtn = document.getElementById('sort-subjects-alpha');
    const newCountBtn = document.getElementById('sort-subjects-count');
    
    newAlphaBtn.addEventListener('click', () => {
        setActiveSort('alpha');
        // Recharger les sujets avec le nouveau tri
        const container = document.getElementById('subject-groups');
        if (container && container.children.length > 0) {
            // Récupérer les données depuis le DOM ou recharger
            browser.runtime.sendMessage({ action: 'getTabsBySubject' }).then((response) => {
                if (response && Object.keys(response).length > 0) {
                    displaySubjectGroups(response, 'alpha');
                }
            });
        }
    });
    
    newCountBtn.addEventListener('click', () => {
        setActiveSort('count');
        // Recharger les sujets avec le nouveau tri
        const container = document.getElementById('subject-groups');
        if (container && container.children.length > 0) {
            browser.runtime.sendMessage({ action: 'getTabsBySubject' }).then((response) => {
                if (response && Object.keys(response).length > 0) {
                    displaySubjectGroups(response, 'count');
                }
            });
        }
    });
}

function setActiveSort(sortType) {
    const alphaBtn = document.getElementById('sort-subjects-alpha');
    const countBtn = document.getElementById('sort-subjects-count');
    
    if (!alphaBtn || !countBtn) return;
    
    alphaBtn.classList.remove('active');
    countBtn.classList.remove('active');
    
    if (sortType === 'alpha') {
        alphaBtn.classList.add('active');
    } else {
        countBtn.classList.add('active');
    }
}

function getCurrentSortType() {
    const alphaBtn = document.getElementById('sort-subjects-alpha');
    const countBtn = document.getElementById('sort-subjects-count');
    
    if (alphaBtn && alphaBtn.classList.contains('active')) {
        return 'alpha';
    } else {
        return 'count'; // Défaut
    }
}

function displaySubjectGroups(subjects, sortType = 'count') {
    const container = document.getElementById('subject-groups');
    container.innerHTML = '';
    
    // Convertir l'objet en array pour pouvoir trier
    let subjectArray = Object.keys(subjects).map(subjectName => ({
        name: subjectName,
        data: subjects[subjectName]
    }));
    
    // Trier selon le type demandé
    if (sortType === 'alpha') {
        subjectArray.sort((a, b) => a.name.localeCompare(b.name));
        console.log('Subjects sorted alphabetically');
    } else {
        // Tri par nombre d'onglets (décroissant)
        subjectArray.sort((a, b) => b.data.tabs.length - a.data.tabs.length);
        console.log('Subjects sorted by tab count');
    }
    
    // Créer les éléments dans l'ordre trié
    subjectArray.forEach(({ name: subjectName, data: subject }) => {
        const element = document.createElement('div');
        element.style.cssText = `
            border: 1px solid #ddd;
            border-radius: 6px;
            margin-bottom: 15px;
            background: white;
        `;
        
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
            cursor: pointer;
        `;
        
        const title = document.createElement('span');
        title.textContent = `${subjectName} (${subject.tabs.length})`;
        title.style.fontWeight = 'bold';
        
        const createBtn = document.createElement('button');
        createBtn.textContent = 'Créer groupe';
        createBtn.style.cssText = `
            background: #28a745;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
        `;
        
        createBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            browser.runtime.sendMessage({
                action: 'createTabGroup',
                tabIds: subject.tabs.map(t => t.id),
                groupName: subjectName
            }).then(response => {
                if (response && response.action === 'groupCreated') {
                    showMessage(`Groupe "${subjectName}" créé!`, 'success');
                }
            });
        });
        
        header.appendChild(title);
        header.appendChild(createBtn);
        
        const tabsDiv = document.createElement('div');
        tabsDiv.style.display = 'none';
        tabsDiv.style.padding = '10px';
        
        subject.tabs.forEach(tab => {
            const tabEl = createTabElement(tab);
            tabsDiv.appendChild(tabEl);
        });
        
        header.addEventListener('click', (e) => {
            if (e.target === header || e.target === title) {
                const isVisible = tabsDiv.style.display !== 'none';
                tabsDiv.style.display = isVisible ? 'none' : 'block';
            }
        });
        
        element.appendChild(header);
        element.appendChild(tabsDiv);
        container.appendChild(element);
    });
}

function loadDuplicateTabs() {
    const container = document.getElementById('duplicate-groups');
    const loading = document.getElementById('loading-duplicates');
    
    if (container) container.innerHTML = '';
    if (loading) loading.style.display = 'block';
    
    browser.runtime.sendMessage({ action: 'getDuplicateTabs' }).then((response) => {
        if (loading) loading.style.display = 'none';
        
        if (response && response.length > 0) {
            displayDuplicateGroups(response);
        } else {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Aucun doublon détecté.</p>';
        }
    }).catch(error => {
        if (loading) loading.style.display = 'none';
        console.error('Error loading duplicates:', error);
        container.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Erreur: ' + error.message + '</p>';
    });
}

function displayDuplicateGroups(duplicates) {
    const container = document.getElementById('duplicate-groups');
    container.innerHTML = '';
    
    duplicates.forEach(group => {
        const element = document.createElement('div');
        element.style.cssText = `
            border: 1px solid #ffc107;
            border-radius: 6px;
            margin-bottom: 20px;
            background: #fff3cd;
        `;
        
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 10px 15px;
            background: #ffc107;
            color: #212529;
            font-weight: bold;
            font-size: 12px;
        `;
        header.textContent = `Doublons: ${new URL(group.url).hostname} (${group.tabs.length} onglets)`;
        
        const tabsDiv = document.createElement('div');
        tabsDiv.style.padding = '10px';
        
        group.tabs.forEach(tab => {
            const isKeep = tab.id === group.keepTab.id;
            const tabEl = document.createElement('div');
            tabEl.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px;
                margin: 5px 0;
                background: ${isKeep ? '#d4edda' : 'white'};
                border: 1px solid ${isKeep ? '#c3e6cb' : '#e9ecef'};
                border-radius: 4px;
            `;
            
            const favicon = document.createElement('img');
            favicon.src = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="%23ddd"/></svg>';
            favicon.width = 16;
            favicon.height = 16;
            
            const title = document.createElement('span');
            title.textContent = tab.title;
            title.style.cssText = `
                flex: 1;
                margin-left: 10px;
                cursor: pointer;
                color: #007bff;
                font-size: 12px;
            `;
            title.addEventListener('click', () => {
                browser.runtime.sendMessage({ action: 'openTab', tabId: tab.id });
            });
            
            const status = document.createElement('span');
            status.textContent = isKeep ? 'À garder' : 'Doublon';
            status.style.cssText = `
                margin-left: 10px;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                color: white;
                background: ${isKeep ? '#28a745' : '#dc3545'};
            `;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.disabled = isKeep;
            deleteBtn.style.cssText = `
                margin-left: 8px;
                background: ${isKeep ? '#6c757d' : '#dc3545'};
                color: white;
                border: none;
                border-radius: 3px;
                cursor: ${isKeep ? 'not-allowed' : 'pointer'};
                opacity: ${isKeep ? '0.6' : '1'};
                font-size: 12px;
                padding: 4px 8px;
            `;
            
            if (!isKeep) {
                deleteBtn.addEventListener('click', () => {
                    browser.runtime.sendMessage({ action: 'closeTab', tabId: tab.id });
                    setTimeout(() => loadDuplicateTabs(), 500);
                });
            }
            
            tabEl.appendChild(favicon);
            tabEl.appendChild(title);
            tabEl.appendChild(status);
            tabEl.appendChild(deleteBtn);
            tabsDiv.appendChild(tabEl);
        });
        
        element.appendChild(header);
        element.appendChild(tabsDiv);
        container.appendChild(element);
    });
}

function loadStopwordsTab() {
    const container = document.getElementById('custom-stopwords-list');
    const countInfo = document.getElementById('count-info');
    
    // Configurer le conteneur principal pour utiliser toute la hauteur
    const stopwordsTab = document.getElementById('stopwords-tab');
    if (stopwordsTab) {
        stopwordsTab.style.cssText = `
            height: calc(100vh - 100px);
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
            padding: 0;
        `;
    }
    
    browser.runtime.sendMessage({ action: 'getAllStopwords' }).then((response) => {
        if (response) {
            const defaultStopwords = response.defaultStopwords || [];
            const customStopwords = response.customStopwords || [];
            const allowedWords = response.allowedWords || [];
            
            // Récupérer les expressions autorisées
            browser.storage.local.get(['allowedExpressions']).then((result) => {
                const allowedExpressions = result.allowedExpressions || [];
                
                // Combiner tous les mots actifs (par défaut - réautorisés + personnalisés)
                const activeDefaultWords = defaultStopwords.filter(word => !allowedWords.includes(word));
                const allActiveWords = [...activeDefaultWords, ...customStopwords].sort();
                
                const totalCount = allActiveWords.length + allowedExpressions.length;
                
                countInfo.innerHTML = `<strong>${totalCount}</strong> règles actives (${allActiveWords.length} mots + ${allowedExpressions.length} expressions)`;
                
                // Interface à deux colonnes avec bouton sticky
                stopwordsTab.innerHTML = `
                    <!-- En-tête fixe -->
                    <div style="
                        flex-shrink: 0; 
                        padding: 15px; 
                        background: white; 
                        border-bottom: 1px solid #eee;
                        text-align: center;
                    ">
                        <h3 style="margin: 0 0 10px 0; color: #6c5ce7;">🎯 Filtres de regroupement</h3>
                        <div style="font-size: 14px; color: #333; margin-bottom: 10px;">
                            <strong>${totalCount}</strong> règles actives
                        </div>
                        <p style="margin: 0; font-size: 12px; color: #666;">
                            Gérez les mots ignorés et les expressions prioritaires pour l'analyse des sujets.
                        </p>
                    </div>
                    
                    <!-- Interface à deux colonnes -->
                    <div style="
                        flex: 1;
                        display: flex;
                        gap: 10px;
                        padding: 15px;
                        box-sizing: border-box;
                        overflow: hidden;
                    ">
                        <!-- Colonne mots interdits -->
                        <div style="
                            flex: 1;
                            display: flex;
                            flex-direction: column;
                            border: 2px solid #e74c3c;
                            border-radius: 8px;
                            overflow: hidden;
                        ">
                            <div style="
                                background: #e74c3c;
                                color: white;
                                padding: 10px;
                                font-weight: bold;
                                text-align: center;
                                font-size: 13px;
                            ">
                                🚫 Mots interdits (${allActiveWords.length})
                            </div>
                            <div style="
                                background: #fff5f5;
                                padding: 8px;
                                font-size: 11px;
                                color: #666;
                                border-bottom: 1px solid #fadbd8;
                            ">
                                Un mot par ligne. Ces mots seront ignorés lors de l'analyse.
                            </div>
                            <textarea id="stopwords-textarea" style="
                                flex: 1;
                                border: none;
                                padding: 10px;
                                font-family: monospace;
                                font-size: 11px;
                                background: #fafafa;
                                resize: none;
                                outline: none;
                                box-sizing: border-box;
                            " placeholder="youtube\ntutorial\nguide\nformation\n...">${allActiveWords.join('\n')}</textarea>
                        </div>
                        
                        <!-- Colonne expressions autorisées -->
                        <div style="
                            flex: 1;
                            display: flex;
                            flex-direction: column;
                            border: 2px solid #27ae60;
                            border-radius: 8px;
                            overflow: hidden;
                        ">
                            <div style="
                                background: #27ae60;
                                color: white;
                                padding: 10px;
                                font-weight: bold;
                                text-align: center;
                                font-size: 13px;
                            ">
                                ✅ Expressions prioritaires (${allowedExpressions.length})
                            </div>
                            <div style="
                                background: #f8fff8;
                                padding: 8px;
                                font-size: 11px;
                                color: #666;
                                border-bottom: 1px solid #d5f4e6;
                            ">
                                Une expression par ligne (min. 2 mots/chiffres). Ces expressions seront détectées en priorité.
                            </div>
                            <textarea id="expressions-textarea" style="
                                flex: 1;
                                border: none;
                                padding: 10px;
                                font-family: monospace;
                                font-size: 11px;
                                background: #fafafa;
                                resize: none;
                                outline: none;
                                box-sizing: border-box;
                            " placeholder="Hollow Knight\nBorderlands 4\nFinal Fantasy 7\nTiny Glade\n...">${allowedExpressions.join('\n')}</textarea>
                        </div>
                    </div>
                    
                    <!-- Bouton fixe en bas -->
                    <div style="
                        flex-shrink: 0;
                        background: white;
                        border-top: 2px solid #6c5ce7;
                        padding: 15px;
                        text-align: center;
                        box-shadow: 0 -3px 15px rgba(0,0,0,0.15);
                    ">
                        <button id="save-filters-btn" style="
                            background: #6c5ce7;
                            color: white;
                            border: none;
                            padding: 14px 32px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: bold;
                            width: 100%;
                            max-width: 300px;
                        ">💾 Sauvegarder les filtres</button>
                    </div>
                `;
                
                // Attacher les événements
                attachFiltersEvents(defaultStopwords, allowedWords);
            });
        }
    }).catch(error => {
        console.error('Error loading filters:', error);
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Erreur de chargement</p>';
        }
    });
}

function attachFiltersEvents(defaultStopwords, currentAllowedWords) {
    const saveBtn = document.getElementById('save-filters-btn');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveFilters(defaultStopwords, currentAllowedWords);
        });
    }
}

function saveFilters(defaultStopwords, currentAllowedWords) {
    const stopwordsTextarea = document.getElementById('stopwords-textarea');
    const expressionsTextarea = document.getElementById('expressions-textarea');
    
    if (!stopwordsTextarea || !expressionsTextarea) {
        showMessage('❌ Erreur: Zones de texte non trouvées', 'error');
        return;
    }
    
    // Traiter les mots interdits
    const stopwordsContent = stopwordsTextarea.value.trim();
    let allStopwords = [];
    
    if (stopwordsContent) {
        allStopwords = stopwordsContent.split('\n')
            .map(word => word.trim().toLowerCase())
            .filter(word => word.length >= 2)
            .filter(word => /^[a-zà-ÿ]+$/i.test(word))
            .filter((word, index, arr) => arr.indexOf(word) === index); // Dédoublonner
    }
    
    // Traiter les expressions autorisées
    const expressionsContent = expressionsTextarea.value.trim();
    let allExpressions = [];
    let invalidExpressions = [];
    
    if (expressionsContent) {
        const rawExpressions = expressionsContent.split('\n')
            .map(expr => expr.trim())
            .filter(expr => expr.length > 0);
        
        rawExpressions.forEach(expr => {
            // Compter les mots et chiffres (les chiffres comptent comme des mots)
            const elements = expr.split(/\s+/).filter(element => {
                // Accepter les mots (lettres + accents) et les chiffres
                return /^[a-zà-ÿ0-9]+$/i.test(element) && element.length >= 1;
            });
            
            if (elements.length >= 2) {
                // Expression valide : au moins 2 mots/chiffres
                const normalizedExpr = elements.join(' ').toLowerCase();
                if (!allExpressions.includes(normalizedExpr)) {
                    allExpressions.push(normalizedExpr);
                }
            } else {
                invalidExpressions.push(expr);
            }
        });
    }
    
    console.log('Processing:', allStopwords.length, 'stopwords and', allExpressions.length, 'expressions');
    if (invalidExpressions.length > 0) {
        console.log('Invalid expressions:', invalidExpressions);
    }
    
    // Séparer les mots par défaut des mots personnalisés
    const customWords = allStopwords.filter(word => !defaultStopwords.includes(word));
    const presentDefaultWords = allStopwords.filter(word => defaultStopwords.includes(word));
    
    // Calculer les nouveaux mots réautorisés (mots par défaut absents de la liste)
    const newAllowedWords = defaultStopwords.filter(word => !presentDefaultWords.includes(word));
    
    // Sauvegarder les trois types de données
    Promise.all([
        browser.storage.local.set({ customStopwords: customWords }),
        browser.storage.local.set({ allowedWords: newAllowedWords }),
        browser.storage.local.set({ allowedExpressions: allExpressions })
    ]).then(() => {
        // Recharger les stopwords dans le background
        browser.runtime.sendMessage({ action: 'reloadCustomStopwords' });
        
        let message = `✅ Filtres sauvegardés : ${allStopwords.length} mots + ${allExpressions.length} expressions`;
        if (invalidExpressions.length > 0) {
            message += ` (${invalidExpressions.length} expressions ignorées : min. 2 mots requis)`;
        }
        
        showMessage(message, 'success');
        
        // Recharger l'interface
        setTimeout(() => {
            loadStopwordsTab();
        }, 1500);
        
    }).catch(error => {
        console.error('Error saving filters:', error);
        showMessage('❌ Erreur lors de la sauvegarde', 'error');
    });
}

function showMessage(message, type) {
    console.log(`Message [${type}]:`, message);
    
    const msg = document.createElement('div');
    msg.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 12px 16px;
        border-radius: 6px;
        z-index: 10000;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        color: white;
        background: ${type === 'success' ? '#4CAF50' : type === 'info' ? '#2196F3' : type === 'warning' ? '#ff9800' : '#f44336'};
    `;
    msg.textContent = message;
    
    document.body.appendChild(msg);
    
    setTimeout(() => {
        msg.remove();
    }, type === 'info' ? 2000 : 3000); // Messages info plus courts
}

console.log('OrganOngle v2 popup loaded successfully');

// Background script compatible Manifest V2 pour Firefox (amélioré)
// Variables globales pour les stopwords
let frenchStopwords = new Set();
let technicalTerms = new Set();
let customStopwords = new Set();
let allowedWords = new Set();
let allowedExpressions = [];

// Charger les stopwords au démarrage
async function loadCustomStopwords() {
    try {
        const result = await browser.storage.local.get(['customStopwords', 'allowedWords', 'allowedExpressions']);
        customStopwords = new Set(result.customStopwords || []);
        allowedWords = new Set(result.allowedWords || []);
        allowedExpressions = result.allowedExpressions || [];
        console.log('Custom stopwords loaded:', customStopwords.size, 'terms');
        console.log('Allowed words loaded:', allowedWords.size, 'terms');
        console.log('Allowed expressions loaded:', allowedExpressions.length, 'expressions');
    } catch (error) {
        console.warn('Could not load custom stopwords:', error);
        customStopwords = new Set();
        allowedWords = new Set();
        allowedExpressions = [];
    }
}

// Initialiser les stopwords français
function initializeStopwords() {
    frenchStopwords = new Set([
        // Articles et déterminants
        'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'ce', 'cette', 'ces', 'mon', 'ma', 'mes',
        'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
        
        // Mots très courants
        'accueil', 'home', 'your', 'page', 'site', 'web', 'blog', 'post', 'article', 'news',
        'aide', 'help', 'support', 'contact', 'about', 'menu', 'navigation', 'nav',
        
        // Prépositions et conjonctions
        'avec', 'dans', 'pour', 'par', 'sans', 'sous', 'vers', 'chez', 'depuis', 'pendant', 'contre',
        'entre', 'parmi', 'selon', 'malgré', 'durant', 'concernant', 'tout', 'tous', 'toute', 'toutes',
        
        // Apprentissage et contenu générique
        'tuto', 'tutoriel', 'tutorial', 'guide', 'astuce', 'conseil', 'aide', 'solution', 'problème',
        'video', 'vidéo', 'film', 'série', 'episode', 'épisode', 'saison', 'streaming', 'watch',
        'cours', 'course', 'lesson', 'leçon', 'formation', 'training', 'learn', 'learning',
        'tips', 'tricks', 'best', 'practices', 'documentation', 'docs', 'manual', 'reference',
        
        // Plateformes et domaines web
        'www', 'com', 'org', 'net', 'fr', 'html', 'http', 'https', 'ftp', 'mail', 'email',
        'youtube', 'google', 'facebook', 'twitter', 'instagram', 'linkedin', 'github'
    ]);
    
    technicalTerms = new Set([
        'javascript', 'python', 'java', 'typescript', 'php', 'ruby', 'swift', 'kotlin', 'dart', 'rust',
        'react', 'vue', 'angular', 'svelte', 'django', 'flask', 'express', 'spring', 'laravel',
        'mysql', 'postgresql', 'mongodb', 'redis', 'docker', 'kubernetes', 'git', 'github',
        'html', 'css', 'sass', 'scss', 'bootstrap', 'tailwind', 'nodejs', 'npm', 'yarn',
        'webpack', 'vite', 'babel', 'api', 'rest', 'graphql', 'json', 'xml', 'sql',
        'linux', 'ubuntu', 'windows', 'macos', 'android', 'ios', 'chrome', 'firefox', 'safari',
        'photoshop', 'illustrator', 'figma', 'sketch', 'blender', 'unity', 'unreal'
    ]);
    
    console.log('Stopwords français initialisés:', frenchStopwords.size, 'termes');
}

// Initialiser au démarrage
console.log('OrganOngle v2 background script (Manifest V2) starting...');
initializeStopwords();
loadCustomStopwords();

// Gestion des onglets mis à jour (optionnel)
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        console.log('Tab updated:', tab.url);
    }
});

// Gestion des messages (Manifest V2)
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    switch (message.action) {
        case 'ping':
            console.log('Ping received, responding...');
            sendResponse({ success: true, message: 'Background script is working' });
            break;
            
        case 'openTab':
            browser.tabs.update(message.tabId, { active: true }).then(() => {
                console.log('Tab opened:', message.tabId);
                sendResponse({ success: true });
            }).catch(error => {
                console.error('Error opening tab:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true; // Réponse asynchrone
            
        case 'closeTab':
            browser.tabs.remove(message.tabId).then(() => {
                console.log('Tab closed:', message.tabId);
                browser.runtime.sendMessage({ action: 'refreshTabs' });
                sendResponse({ success: true });
            }).catch(error => {
                console.error('Error closing tab:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true;
            
        case 'closeTabs':
            browser.tabs.remove(message.tabIds).then(() => {
                console.log('Tabs closed:', message.tabIds);
                browser.runtime.sendMessage({ action: 'refreshTabs' });
                sendResponse({ success: true });
            }).catch(error => {
                console.error('Error closing tabs:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true;
            
        case 'getTabsBySubject':
            console.log('Analyzing tabs by subject...');
            browser.tabs.query({}).then((tabs) => {
                const subjects = analyzeTabsBySubject(tabs);
                console.log('Subjects analyzed:', Object.keys(subjects).length);
                sendResponse(subjects);
            }).catch(error => {
                console.error('Error analyzing subjects:', error);
                sendResponse({});
            });
            return true;
            
        case 'getDuplicateTabs':
            console.log('Finding duplicate tabs...');
            browser.tabs.query({}).then((tabs) => {
                const duplicates = findDuplicateTabs(tabs);
                console.log('Duplicates found:', duplicates.length);
                sendResponse(duplicates);
            }).catch(error => {
                console.error('Error finding duplicates:', error);
                sendResponse([]);
            });
            return true;
            
        case 'createTabGroup':
            console.log('Creating tab group:', message.groupName);
            createTabGroupV2(message.tabIds, message.groupName).then((result) => {
                console.log('Group creation result:', result);
                sendResponse(result);
            }).catch(error => {
                console.error('Error creating group:', error);
                sendResponse({ action: 'error', message: error.message });
            });
            return true;
            
        case 'getStopwordsStats':
            const stats = {
                defaultCount: frenchStopwords.size,
                customCount: customStopwords.size,
                totalCount: frenchStopwords.size + customStopwords.size
            };
            console.log('Stopwords stats:', stats);
            sendResponse(stats);
            break;
            
        case 'getAllStopwords':
            browser.storage.local.get(['allowedWords']).then((result) => {
                const storedAllowedWords = result.allowedWords || [];
                allowedWords = new Set(storedAllowedWords);
                
                const response = {
                    defaultStopwords: Array.from(frenchStopwords).sort(),
                    customStopwords: Array.from(customStopwords).sort(),
                    allowedWords: storedAllowedWords.sort(),
                    technicalTerms: Array.from(technicalTerms).sort()
                };
                console.log('All stopwords requested:', response);
                sendResponse(response);
            }).catch(error => {
                console.error('Error getting stopwords:', error);
                sendResponse({
                    defaultStopwords: [],
                    customStopwords: [],
                    allowedWords: [],
                    technicalTerms: []
                });
            });
            return true;
            
        case 'reloadCustomStopwords':
            loadCustomStopwords().then(() => {
                console.log('Custom stopwords reloaded');
                sendResponse({ success: true });
            }).catch(error => {
                console.error('Error reloading stopwords:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true;
            
        default:
            console.warn('Unknown action:', message.action);
            sendResponse({ success: false, error: 'Unknown action' });
    }
});

// Fonction de création de groupes compatible Firefox
async function createTabGroupV2(tabIds, groupName) {
    try {
        console.log('Attempting to create tab group for:', groupName, 'with tabs:', tabIds);
        
        // Vérifier si l'API browser.tabs.group est disponible (Firefox 138+)
        if (browser.tabs.group) {
            console.log('Using browser.tabs.group API');
            const groupId = await browser.tabs.group({ tabIds: tabIds });
            
            // Essayer de définir le nom et la couleur
            if (browser.tabGroups && browser.tabGroups.update) {
                try {
                    await browser.tabGroups.update(groupId, {
                        title: groupName,
                        color: getRandomGroupColor()
                    });
                    console.log('Group created with name:', groupName);
                    return {
                        action: 'groupCreated',
                        groupId: groupId,
                        tabCount: tabIds.length,
                        nameSet: true
                    };
                } catch (updateError) {
                    console.warn('Could not set group name:', updateError.message);
                    return {
                        action: 'groupCreated',
                        groupId: groupId,
                        tabCount: tabIds.length,
                        nameSet: false,
                        error: updateError.message
                    };
                }
            } else {
                console.log('Group created but tabGroups.update not available');
                return {
                    action: 'groupCreated',
                    groupId: groupId,
                    tabCount: tabIds.length,
                    nameSet: false
                };
            }
        } else {
            console.log('Tab Groups API not available, using window fallback');
            return await createWindowGroupFallback(tabIds, groupName);
        }
    } catch (error) {
        console.error('Error creating tab group:', error);
        // Fallback vers nouvelle fenêtre
        return await createWindowGroupFallback(tabIds, groupName);
    }
}

// Fallback pour créer une nouvelle fenêtre
async function createWindowGroupFallback(tabIds, groupName) {
    try {
        console.log('Using window fallback for group:', groupName);
        const allTabs = await browser.tabs.query({});
        const tabsToMove = allTabs.filter(tab => tabIds.includes(tab.id));
        
        if (tabsToMove.length > 0) {
            const newWindow = await browser.windows.create({
                tabId: tabsToMove[0].id,
                focused: true
            });
            
            if (tabsToMove.length > 1) {
                const remainingTabIds = tabsToMove.slice(1).map(tab => tab.id);
                await browser.tabs.move(remainingTabIds, {
                    windowId: newWindow.id,
                    index: -1
                });
            }
            
            console.log('Window group created successfully');
            return {
                action: 'groupCreated',
                windowId: newWindow.id,
                tabCount: tabsToMove.length
            };
        } else {
            throw new Error('Aucun onglet trouvé pour ce groupe');
        }
    } catch (error) {
        console.error('Error in window fallback:', error);
        throw error;
    }
}

function getRandomGroupColor() {
    const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Analyse des onglets par sujet
function analyzeTabsBySubject(tabs) {
    const subjects = {};
    const keywordGroups = {};
    
    console.log('Analyzing', tabs.length, 'tabs for subjects');
    
    tabs.forEach(tab => {
        try {
            const keywords = extractRelevantKeywords(tab.title, tab.url);
            keywords.forEach(keyword => {
                if (!keywordGroups[keyword]) {
                    keywordGroups[keyword] = [];
                }
                keywordGroups[keyword].push(tab);
            });
        } catch (error) {
            console.warn('Error processing tab:', tab.title, error);
        }
    });
    
    console.log('Keyword groups found:', Object.keys(keywordGroups).length);
    
    Object.keys(keywordGroups).forEach(keyword => {
        const tabsForKeyword = keywordGroups[keyword];
        if (tabsForKeyword.length >= 2 && isValidTechnicalSubject(keyword)) {
            const subjectName = normalizeSubjectName(keyword);
            if (!subjects[subjectName]) {
                subjects[subjectName] = {
                    name: subjectName,
                    tabs: [],
                    confidence: calculateConfidence(keyword, tabsForKeyword)
                };
            }
            
            tabsForKeyword.forEach(tab => {
                if (!subjects[subjectName].tabs.find(t => t.id === tab.id)) {
                    subjects[subjectName].tabs.push(tab);
                }
            });
        }
    });
    
    // Filtrer par confiance
    const filteredSubjects = {};
    Object.keys(subjects).forEach(key => {
        const subject = subjects[key];
        if (subject.tabs.length >= 2 && subject.confidence > 0.4) {
            filteredSubjects[key] = subject;
        }
    });
    
    console.log('Final subjects:', Object.keys(filteredSubjects).length);
    return filteredSubjects;
}

function extractRelevantKeywords(title, url) {
    const text = (title + ' ' + url).toLowerCase();
    const originalText = title + ' ' + url; // Garder la casse originale pour les expressions
    let keywords = [];
    
    // 1. D'abord chercher les expressions prioritaires (case-insensitive)
    allowedExpressions.forEach(expression => {
        const regex = new RegExp('\\b' + expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
        if (regex.test(originalText)) {
            // Normaliser le nom de l'expression pour le groupement
            const normalizedExpression = expression.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            keywords.push(normalizedExpression);
        }
    });
    
    // 2. Ensuite extraire les mots individuels
    const words = text.match(/\b[a-zA-ZÀ-ÿ]{2,}\b/g) || [];
    
    const englishStopwords = new Set([
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
        'tutorial', 'guide', 'how', 'learn', 'course', 'youtube', 'github',
        'best', 'practices', 'good', 'bad', 'free', 'paid', 'premium'
    ]);
    
    const allStopwords = new Set([...englishStopwords, ...frenchStopwords, ...customStopwords]);
    
    // Retirer les mots réautorisés
    allowedWords.forEach(word => {
        allStopwords.delete(word);
    });
    
    const wordKeywords = words.filter(word => {
        const cleanWord = word.trim().toLowerCase();
        return cleanWord.length >= 3 && 
               !/^\d+$/.test(cleanWord) &&
               !allStopwords.has(cleanWord) && 
               (technicalTerms.has(cleanWord) || isLikelyTechnicalTerm(cleanWord, title));
    });
    
    // Combiner expressions et mots, en dédoublonnant
    keywords = keywords.concat(wordKeywords);
    return [...new Set(keywords)];
}

function isLikelyTechnicalTerm(word, originalTitle) {
    // Vérifier si c'est un nom propre (première lettre majuscule)
    const regex = new RegExp('\\b' + word.charAt(0).toUpperCase() + word.slice(1) + '\\b');
    if (regex.test(originalTitle)) return true;
    
    // Patterns techniques
    if (word.includes('js') || word.includes('css') || word.includes('api') || 
        word.endsWith('js') || word.endsWith('css') || word.endsWith('sql') ||
        word.startsWith('lib') || word.startsWith('micro')) return true;
    
    // Mots composés longs souvent techniques
    if (word.length > 8) return true;
    
    // Contient des chiffres (numéros de version, etc.)
    if (/\d/.test(word) && word.length > 3) return true;
    
    return false;
}

function isValidTechnicalSubject(keyword) {
    if (keyword.length < 3) return false;
    
    const excludePatterns = /^(news|blog|post|article|video|image|photo|doc|file|text|content|info|data)$/i;
    if (excludePatterns.test(keyword)) return false;
    
    const actionWords = /^(open|close|start|stop|play|click|press|copy|paste)$/i;
    if (actionWords.test(keyword)) return false;
    
    return true;
}

function normalizeSubjectName(keyword) {
    const normalizations = {
        'js': 'JavaScript', 'ts': 'TypeScript', 'css': 'CSS', 'html': 'HTML',
        'sql': 'SQL', 'api': 'API', 'sdk': 'SDK', 'cli': 'CLI',
        'nodejs': 'Node.js', 'reactjs': 'React', 'vuejs': 'Vue.js',
        'nextjs': 'Next.js', 'nuxtjs': 'Nuxt.js', 'expressjs': 'Express.js',
        'postgresql': 'PostgreSQL', 'mongodb': 'MongoDB', 'mysql': 'MySQL',
        'docker': 'Docker', 'kubernetes': 'Kubernetes', 'github': 'GitHub',
        'vscode': 'VS Code', 'android': 'Android', 'ios': 'iOS',
        'linux': 'Linux', 'ubuntu': 'Ubuntu', 'windows': 'Windows'
    };
    
    const lower = keyword.toLowerCase();
    return normalizations[lower] || keyword.charAt(0).toUpperCase() + keyword.slice(1);
}

function calculateConfidence(keyword, tabs) {
    let confidence = 0.5;
    
    if (keyword.length > 6) confidence += 0.2;
    if (keyword.length > 10) confidence += 0.1;
    
    confidence += Math.min(tabs.length * 0.05, 0.2);
    
    const titleMatches = tabs.filter(tab => 
        tab.title.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    confidence += (titleMatches / tabs.length) * 0.3;
    
    const knownTechnical = ['javascript', 'python', 'react', 'vue', 'angular', 'docker', 
                           'nodejs', 'typescript', 'php', 'java', 'css', 'html', 'sql'];
    if (knownTechnical.includes(keyword.toLowerCase())) {
        confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
}

function findDuplicateTabs(tabs) {
    const urlGroups = {};
    
    tabs.forEach(tab => {
        try {
            const cleanUrl = cleanURL(tab.url);
            if (!urlGroups[cleanUrl]) {
                urlGroups[cleanUrl] = [];
            }
            urlGroups[cleanUrl].push(tab);
        } catch (error) {
            console.warn('Error processing URL:', tab.url, error);
        }
    });
    
    const duplicates = [];
    Object.keys(urlGroups).forEach(url => {
        if (urlGroups[url].length > 1) {
            const sortedTabs = urlGroups[url].sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
            duplicates.push({
                url: url,
                tabs: sortedTabs,
                keepTab: sortedTabs[0]
            });
        }
    });
    
    return duplicates;
}

function cleanURL(url) {
    try {
        const urlObj = new URL(url);
        urlObj.hash = '';
        const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
        paramsToRemove.forEach(param => {
            urlObj.searchParams.delete(param);
        });
        return urlObj.toString();
    } catch (e) {
        return url;
    }
}

console.log('OrganOngle v2 background script (Manifest V2) loaded successfully');

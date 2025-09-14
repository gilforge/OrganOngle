# OrganOngle v2

Extension Firefox améliorée pour la gestion et l'organisation des onglets.

## Nouvelles fonctionnalités v2

### 1. Regroupement par domaine (original)
- Affiche tous vos onglets groupés par nom de domaine
- Interface en grille pour un aperçu rapide
- Boutons de fermeture individuels

### 2. **NOUVEAU** : Regroupement par sujet
- Détection automatique de sujets communs entre vos onglets
- **Analyse intelligente** avec filtrage des mots non-pertinents ("youtube", "tutorial")
- **Score de confiance** : Indicateurs visuels (✓✓ = haute, ✓ = moyenne, ? = faible confiance)
- **Apprentissage persistant** : Vos choix sont mémorisés entre les sessions
- **Interface d'apprentissage** : Boutons pour approuver/ignorer/renommer les sujets
- **Tri configurable** : par ordre alphabétique ou par nombre d'onglets
- Bouton "Créer groupe" pour regrouper automatiquement les onglets liés
- **Vérification des groupes existants** avant création
- Exemples détectés : "Blender", "Python", "Docker", etc.

### 3. **NOUVEAU** : Détection de doublons
- Identification automatique des onglets qui pointent vers la même URL
- **Affichage des URLs complètes** : Vérification visuelle des doublons détectés
- **Boutons de suppression individuels** : Poubelle 🗑️ sur chaque doublon pour suppression directe
- Suggestion de l'onglet à conserver (le plus récent)
- Suppression en lot des doublons sélectionnés
- Nettoyage des paramètres de tracking (utm_*, fbclid, etc.)
- Compteur d'onglets par groupe de doublons

## Installation

1. Téléchargez le dossier `OrganOngle_v2`
2. Ouvrez Firefox et allez dans `about:debugging`
3. Cliquez sur "Ce Firefox" dans la barre latérale
4. Cliquez sur "Charger un module temporaire..."
5. Sélectionnez le fichier `manifest.json` dans le dossier de l'extension

## Utilisation

### Interface à onglets
L'extension s'ouvre avec trois onglets :
- **Par domaine** : Vue classique groupée par site web
- **Par sujet** : Détection automatique de thèmes communs
- **Doublons** : Liste des URLs dupliquées avec options de suppression

### Actions disponibles
- **Clic sur titre d'onglet** : Active l'onglet correspondant
- **Bouton × rouge** : Ferme l'onglet individuellement
- **Clic sur nom de domaine/sujet** : Développe/réduit la liste
- **Boutons de tri** (onglet sujets) : Trier par ordre alphabétique ou par nombre d'onglets
- **Boutons d'apprentissage** (onglet sujets) :
  - ✓ = Confirmer ce sujet (sera privilégié à l'avenir)
  - × = Ignorer ce sujet (ne sera plus proposé)
  - ✎ = Renommer ce sujet (crée un mapping personnalisé)
- **Bouton poubelle 🗑️** (onglet doublons) : Supprime directement un doublon spécifique
- **Créer groupe** : Utilise l'API de groupes Firefox (si disponible)
- **Supprimer sélectionnés** : Supprime tous les doublons cochés

## Algorithmes

### Détection de sujets
- Extraction de mots-clés significatifs des titres et URLs
- Filtrage des mots vides et des termes techniques
- Regroupement par mots-clés communs (minimum 2 onglets)
- Score de pertinence pour éliminer les faux positifs

### Détection de doublons
- Normalisation des URLs (suppression fragments et paramètres tracking)
- Comparaison exacte des URLs nettoyées
- Tri par date d'accès pour conserver le plus récent
- Interface de sélection pour validation manuelle

## Améliorations apportées

### Interface utilisateur
- Design moderne avec onglets de navigation
- Indicateurs visuels (badges de comptage, statuts)
- Responsive design pour différentes tailles de popup
- Feedback utilisateur (boutons de confirmation)

### Performance
- Chargement asynchrone du contenu des onglets
- Mise en cache des données analysées
- Actualisation automatique après modifications

### Sécurité
- Validation des URLs avant traitement
- Gestion d'erreurs pour les onglets inaccessibles
- Permissions minimales requises

### Ergonomie
- **Interface de doublons améliorée** : URLs visibles pour vérification manuelle
- **Suppression directe** : Boutons individuels pour éviter le processus en 2 étapes
- **Feedback visuel** : Indicateurs clairs pour onglets à conserver vs doublons
- **Compteurs informatifs** : Nombre d'onglets par groupe affiché
- **Actions rapides** : Moins de clics nécessaires pour les tâches courantes

## Développement

### Structure des fichiers
```
OrganOngle_v2/
├── manifest.json          # Configuration extension
├── background.js          # Script arrière-plan avec algorithmes
├── popup/
│   ├── popup.html         # Interface utilisateur
│   ├── popup.css          # Styles
│   └── popup.js           # Logique interface
└── icons/
    └── icon.png           # Icône extension
```

### API utilisées
- `browser.tabs.*` : Gestion des onglets
- `browser.runtime.*` : Communication interne
- `browser.browserAction.*` : Interface popup
- `browser.tabs.group.*` : Groupes Firefox (si disponible)

## Notes techniques

### Compatibilité
- Firefox 78+ (Manifest v2)
- Compatible avec les futures versions utilisant des groupes d'onglets

### Limitations connues
- L'API `browser.tabs.group` n'est pas encore stable dans Firefox
- La détection de sujets fonctionne mieux avec des titres en français/anglais
- Les sites avec des titres génériques peuvent ne pas être bien catégorisés

### Améliorations futures possibles
- Machine learning pour améliorer la détection de sujets
- Apprentissage des préférences utilisateur
- Sauvegarde/restauration de groupes
- Synchronisation entre appareils
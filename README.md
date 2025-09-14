# OrganOngle v2

Extension Firefox améliorée pour la gestion et l'organisation des onglets.

## Nouvelles fonctionnalités v2

### 1. Regroupement par domaine
- Affiche tous vos onglets groupés par nom de domaine
- Boutons de fermeture individuels

### 2. **NOUVEAU** : Regroupement par sujet
- Détection automatique de sujets communs entre vos onglets
- **Analyse intelligente** avec filtrage des mots non-pertinents ("youtube", "tutorial")
- **Tri configurable** : par ordre alphabétique ou par nombre d'onglets
- Bouton "Créer groupe" pour regrouper automatiquement les onglets liés

### 3. **NOUVEAU** : Détection de doublons
- Identification automatique des onglets qui pointent vers la même URL
- **Affichage des URLs complètes** : Vérification visuelle des doublons détectés
- **Boutons de suppression individuels** : Poubelle 🗑️ sur chaque doublon pour suppression directe
- Suggestion de l'onglet à conserver (le plus récent)
- Suppression en lot des doublons sélectionnés
- Nettoyage des paramètres de tracking (utm_*, fbclid, etc.)
- Compteur d'onglets par groupe de doublons

## Installation comme extension
1. Dans le menu Firefox, sélectionnez "Extensions et thèmes"
2. Cherchez "OrganOngle"
3. Cliquez sur "Activer"

## Installation manuelle
1. Téléchargez le dossier `OrganOngle`
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
- **Filtres** : Liste des mots qui ne doivent pas être utilisés comme sujet, et liste des expressions que vous autorisez

### Actions disponibles
- **Clic sur titre d'onglet** : Active l'onglet correspondant
- **Clic sur nom de domaine/sujet** : Développe/réduit la liste
- **Boutons de tri** (onglet sujets) : Trier par ordre alphabétique ou par nombre d'onglets
- **Bouton poubelle 🗑️** : Supprime directement un onglet spécifique
- **Créer groupe** : Utilise l'API de groupes Firefox (si disponible)
- **Supprimer sélectionnés** : Supprime tous les doublons cochés

## Algorithmes

### Détection de sujets
- Extraction de mots-clés significatifs des titres et URLs
- Filtrage des mots vides et des termes techniques
- Regroupement par mots-clés communs (minimum 2 onglets)

### Détection de doublons
- Normalisation des URLs (suppression fragments et paramètres tracking)
- Comparaison exacte des URLs nettoyées
- Tri par date d'accès pour conserver le plus récent
- Interface de sélection pour validation manuelle

### Performance
- Actualisation automatique après modifications

### Sécurité
- Validation des URLs avant traitement
- Gestion d'erreurs pour les onglets inaccessibles
- Permissions minimales requises

### Améliorations futures possibles
- Machine learning pour améliorer la détection de sujets
- Apprentissage des préférences utilisateur
- Sauvegarde/restauration de groupes
- Synchronisation entre appareils
- Import/Export des listes de mots interdits et d'expressions autorisées
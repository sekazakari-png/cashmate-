# CASHMATE — MVP Android hors ligne

CASHMATE est un prototype PWA en français pour gérer une petite boutique. Il utilise IndexedDB dans le navigateur : les produits, ventes, dépenses, crédits et paramètres restent enregistrés localement sur l'appareil.

## Fonctions incluses
- Tableau de bord du jour : ventes, bénéfice estimé, dépenses, valeur du stock.
- Ajout, modification, recherche et suppression de produits.
- Enregistrement de ventes avec déduction automatique du stock.
- Modes de paiement : espèces, Wave, Orange Money et crédit client.
- Enregistrement de dépenses.
- Suivi des crédits et remboursements.
- Rapports globaux et export/import de sauvegarde JSON.
- Mise en cache PWA pour l'ouverture hors connexion après le premier chargement.

## Limites connues de cette version
- Pas de comptes utilisateurs ni synchronisation cloud.
- Les données restent sur un seul navigateur/appareil. Effacer les données du navigateur peut les supprimer : exportez régulièrement une sauvegarde.
- Les paiements Wave et Orange Money sont seulement consignés comme modes de paiement. Aucun transfert réel ni paiement d'abonnement n'est déclenché.
- L'application ne gère pas encore plusieurs articles dans une même vente, les retours, les taxes, ni les achats fournisseurs.
- Le bénéfice affiché est une estimation : ventes moins coût des articles vendus moins dépenses saisies. Il ne tient pas compte de toutes les charges possibles.
- Pour des raisons de sécurité, ne stockez pas de données sensibles de clients dans cette version locale.

## Tester gratuitement sur ordinateur
Le service worker exige HTTPS ou localhost. Dans le dossier du projet, lancez un petit serveur local :
```bash
python -m http.server 8000
```
Puis ouvrez `http://localhost:8000` dans Chrome.

## Installer sur Android sans frais
1. Hébergez le dossier sur un service statique HTTPS gratuit (par exemple GitHub Pages).
2. Sur Android, ouvrez l'adresse du site dans Chrome.
3. Ouvrez le menu ⋮ puis choisissez **Installer l'application** ou **Ajouter à l'écran d'accueil**.
4. Ouvrez CASHMATE depuis l'icône installée.
5. Chargez l'application une première fois avec Internet. Ensuite, le shell de l'application peut s'ouvrir hors connexion.

> Pour une distribution via Google Play ou un APK natif, une étape de packaging Android supplémentaire sera nécessaire. La PWA n'est pas un APK.

## Publication sur GitHub Pages
1. Créez un compte GitHub et un nouveau dépôt public `cashmate`.
2. Téléversez tous les fichiers de ce dossier à la racine du dépôt.
3. Dans le dépôt : Settings → Pages → Deploy from a branch → `main` → `/ (root)`.
4. Attendez l'URL publiée, puis ouvrez-la sur votre Android.
5. Testez l'installation et le mode avion.

## Contrôles de test conseillés
- Créer un produit avec 10 unités.
- Vendre 2 unités : vérifier que le stock passe à 8.
- Enregistrer une dépense : vérifier le tableau de bord.
- Faire une vente à crédit et enregistrer un remboursement partiel.
- Exporter les données, vider les données du site de test, puis restaurer la sauvegarde.

## Architecture
- `index.html` : écrans et navigation.
- `styles.css` : interface responsive.
- `app.js` : logique métier et base IndexedDB.
- `manifest.webmanifest` : métadonnées PWA.
- `sw.js` : cache hors connexion.
- `icon.svg` : icône.

## Évolution recommandée avant commercialisation
Ajouter une authentification, une base de données cloud avec règles d'accès, synchronisation multi-appareils, journal d'audit, sauvegardes automatisées, tests automatisés, politique de confidentialité et intégration officielle d'un prestataire de paiement. Faire vérifier la conformité locale avant de traiter les données personnelles et les paiements.

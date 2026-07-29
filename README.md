# Plateforme Intelligente d'Octroi de Crédit - Frontend

Il s'agit du frontend de la Plateforme Intelligente d'Octroi de Crédit. C'est une application monopage (SPA) construite avec **Angular 22** et **TailwindCSS**.

## Technologies Clés

- **Angular 22**
- **TypeScript**
- **TailwindCSS** (pour le style)
- **RxJS** (pour la gestion de l'état et la programmation réactive)

## Prérequis

- **Node.js** (v20 ou supérieur recommandé)
- **npm** (Node Package Manager)

## Configuration et Exécution Locale

1. Ouvrez un terminal et accédez à ce répertoire (`projet_stage_front`).
2. Installez les dépendances requises :
   ```bash
   npm install
   ```
3. Démarrez le serveur de développement Angular :
   ```bash
   npm start
   ```
   *(Cela exécute `ng serve` en arrière-plan).*

4. Accédez à `http://localhost:4200/` dans votre navigateur.

> **Remarque** : Le frontend s'attend à ce que le backend Spring Boot fonctionne sur `http://localhost:8081`. Assurez-vous que le backend est correctement configuré et en cours d'exécution pour vous authentifier et récupérer des données.

## Structure du Projet

- `src/app/core/` : Services principaux (`ApiService`, `AuthService`, `DataStateService`), modèles et gardes.
- `src/app/features/` : Modules et composants fonctionnels (ex. : `analyst/dossiers`).
- `src/app/shared/` : Composants UI, pipes et directives partagés.
- `src/styles.scss` / `tailwind.config.js` : Styles globaux et configuration de Tailwind.

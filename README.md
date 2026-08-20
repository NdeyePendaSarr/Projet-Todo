# ⏳ FocusDay — Coach de productivité temporel

> **Un coach de productivité temporel — pas une simple todo-list.**

FocusDay est une application web conçue pour aider à **piloter sa journée par créneaux horaires**.

Au lieu de simplement lister des tâches, l'application permet de définir :
- un objectif ;
- une plage horaire ;
- une description ;
- et surtout **la raison pour laquelle cet objectif est important**.

L'application suit ensuite le déroulement de la journée, met à jour les statuts en fonction de l'heure, rappelle les objectifs à l'approche de leur créneau et propose un **débrief réflexif en fin de journée**.

> **🔗 Démo en ligne : [focus-day-nps.vercel.app](https://focus-day-nps.vercel.app/)**

---

## 🎯 Le concept

Une todo-list répond principalement à la question :

> **« Qu'est-ce que je dois faire ? »**

FocusDay cherche plutôt à répondre à quatre questions :

> **Qu'est-ce que je dois faire ?**  
> **Quand dois-je le faire ?**  
> **Pourquoi est-ce important ?**  
> **Est-ce que je l'ai réellement fait ?**

L'objectif est donc de transformer une simple liste de tâches en **système de pilotage temporel et de réflexion sur sa journée**.

---

## 🖼️ Aperçu

### Tableau de bord

Le tableau de bord existe en **thème clair et thème sombre**.

| Thème clair | Thème sombre |
| :---: | :---: |
| ![Tableau de bord en thème clair](screenshots/theme_clair.png) | ![Tableau de bord en thème sombre](screenshots/dashboard.png) |

### Ta journée

La timeline représente les objectifs de la journée et affiche un curseur **« maintenant »** qui évolue avec l'heure.

Le taux de réussite est également mis à jour en direct.

![Vue « Ta journée » avec la timeline](screenshots/journee.png)

### Création d'un objectif

Chaque objectif peut être défini avec :
- un nom ;
- une heure de début ;
- une heure de fin ;
- une description ;
- et surtout un **« pourquoi »**.

![Formulaire de création d'objectif](screenshots/formulaire.png)

### Objectifs

Les objectifs sont présentés sous forme de cartes avec un statut dynamique et des actions rapides.

![Objectifs affichés en cartes](screenshots/objectifs_definis.png)

### Débrief du soir

Le débrief permet de prendre du recul sur la journée :

- les objectifs ont-ils été atteints ?
- a-t-on fait plus que prévu ?
- qu'est-ce qui a manqué ?
- quelle était l'humeur de la journée ?

![Débrief du soir](screenshots/objectifs_atteints.png)

### Historique

L'historique permet de retrouver les objectifs précédents et de les filtrer.

Les données sont conservées dans le navigateur grâce à `localStorage`, ce qui permet de consulter l'historique même sans connexion.

![Historique des objectifs](screenshots/historique.png)

---

## ✨ Ce qui rend FocusDay différent

### ⏰ Créneaux horaires

Chaque objectif possède une véritable plage horaire.

Exemple :

```text
08:00 → 10:00 : Travail sur le mémoire
14:00 → 15:30 : Développement
18:00 → 19:00 : Sport
```

L'application sait donc déterminer si un objectif est :
- à venir ;
- en cours ;
- terminé ;
- ou manqué.

### 🎯 Le « pourquoi »

Chaque objectif peut être associé à une motivation.

Le « pourquoi » permet de ne pas seulement voir **ce qu'il faut faire**, mais aussi **pourquoi il faut le faire**.

### 🔔 Rappels intelligents

Lorsqu'un créneau approche et qu'aucune action n'a encore été effectuée, l'application peut utiliser la **Notification API** du navigateur pour rappeler l'objectif et indiquer le temps restant.

### 📊 Statuts dynamiques

FocusDay ne se limite pas à une case « terminé ».

Un objectif peut avoir plusieurs états :

- À faire
- En cours
- Terminé
- Manqué

Ces statuts sont déterminés à partir de l'état de l'objectif et de l'heure actuelle.

### 🕐 Timeline de journée

La timeline permet de visualiser la journée dans le temps.

Un curseur **« maintenant »** se déplace automatiquement afin de situer l'utilisateur par rapport à ses objectifs.

### 🌙 Débrief du soir

La journée ne s'arrête pas lorsque les objectifs sont terminés.

FocusDay propose un espace de réflexion permettant de faire le bilan :
- objectifs atteints ;
- objectifs manqués ;
- dépassement des objectifs ;
- humeur ;
- réflexion personnelle.

### 📈 Tableau de bord

Le tableau de bord présente notamment :
- le taux de réussite ;
- les statistiques des derniers jours ;
- l'évolution des performances ;
- la météo du moment.

### 🗂️ Historique

Les journées précédentes peuvent être retrouvées grâce à un historique avec recherche et filtres :

- Tous
- Réussis
- Manqués

Les données étant stockées dans `localStorage`, l'historique reste disponible hors connexion.

> L'application n'est toutefois pas encore une PWA et ne possède pas de service worker.

### 🌓 Thème clair / sombre

L'interface propose un thème clair et un thème sombre afin d'adapter l'expérience aux préférences de l'utilisateur.

---

## 🧠 Architecture et choix techniques

FocusDay a été conçu avec une architecture suffisamment découplée pour permettre de faire évoluer progressivement le stockage et les services.

### Stockage abstrait

Les données sont actuellement conservées dans `localStorage`.

L'accès au stockage passe cependant par une couche d'abstraction :

```text
Interface utilisateur
        │
        ▼
   Couche métier
        │
        ▼
   lib/store.ts
        │
        ▼
   localStorage
```

Cette organisation permet de remplacer ultérieurement `localStorage` par une véritable base de données ou un backend distant sans modifier toute l'application.

Par exemple :

```text
localStorage
     ↓
Supabase / Firebase / API personnalisée
```

L'objectif est donc de limiter le couplage entre l'interface et le système de persistance.

---

## 🧮 Logique métier temporelle

Une partie importante du projet repose sur la gestion des horaires.

La couche métier prend notamment en charge :

- la conversion des heures ;
- la comparaison entre l'heure actuelle et les créneaux ;
- les créneaux traversant minuit ;
- la détection des chevauchements ;
- le calcul des statistiques ;
- la détermination automatique du statut ;
- le passage automatique d'un objectif à l'état **« manqué »** lorsque son créneau est dépassé.

Cette logique est isolée dans `lib/time.ts` et testée indépendamment de l'interface.

Cela permet de considérer les règles temporelles comme une véritable **couche métier**, plutôt que comme de simples comportements d'interface.

---

## 🔔 Architecture des notifications

Les rappels utilisent actuellement la **Notification API** du navigateur.

L'architecture a cependant été pensée pour pouvoir évoluer vers des notifications push côté serveur.

```text
Objectif
   │
   ▼
Créneau horaire
   │
   ▼
Détection de l'approche
   │
   ▼
Notification API
```

Une évolution future pourrait remplacer cette dernière étape par un système de notifications push serveur.

---

## 🌤️ Météo

La météo affichée dans le tableau de bord utilise :

- **Open-Meteo**
- la géolocalisation du navigateur.

Aucune clé API n'est nécessaire.

---

## 🧱 Stack technique

| Technologie | Utilisation |
|---|---|
| **Next.js 16** | Framework web et architecture de l'application |
| **TypeScript** | Typage statique |
| **Tailwind CSS v4** | Interface et responsive design |
| **Vitest** | Tests unitaires |
| **localStorage** | Persistance locale |
| **Notification API** | Notifications navigateur |
| **Open-Meteo** | Données météorologiques |
| **Geolocation API** | Localisation pour la météo |
| **GitHub Actions** | Intégration continue |
| **Vercel** | Déploiement |

---

## 📂 Organisation du projet

```text
focus-day/
├── app/
│   ├── page.tsx
│   ├── ...
│   └── ...
│
├── components/
│   ├── ...
│   └── ...
│
├── lib/
│   ├── store.ts       # Abstraction du stockage
│   ├── time.ts        # Logique métier temporelle
│   └── ...
│
├── screenshots/
│   ├── theme_clair.png
│   ├── dashboard.png
│   ├── journee.png
│   ├── formulaire.png
│   ├── objectifs_definis.png
│   ├── objectifs_atteints.png
│   └── historique.png
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
└── README.md
```

---

## 🚀 Démarrer en local

### 1. Installer les dépendances

```bash
npm install
```

### 2. Lancer le serveur de développement

```bash
npm run dev
```

Puis ouvrir :

```text
http://localhost:3000
```

---

## 🧪 Commandes disponibles

```bash
npm test
```

Lance les tests unitaires avec Vitest.

```bash
npm run lint
```

Vérifie le code avec ESLint.

```bash
npx tsc --noEmit
```

Vérifie les types TypeScript.

```bash
npm run build
```

Effectue le build de production.

---

## ✅ Qualité & tests

Le projet applique plusieurs contrôles automatisés.

### TypeScript

Le projet utilise **TypeScript strict** afin de détecter les erreurs de typage le plus tôt possible.

### Tests métier

Les tests Vitest couvrent notamment la couche temporelle :

- conversion des heures ;
- créneaux traversant minuit ;
- détection des chevauchements ;
- calcul des statistiques ;
- détermination des statuts ;
- bascule automatique en « manqué ».

### Intégration continue

GitHub Actions exécute automatiquement :

```text
Lint
  ↓
Vérification TypeScript
  ↓
Tests
  ↓
Build
```

à chaque push et pull request.

Workflow :

```text
.github/workflows/ci.yml
```

### Accessibilité

Une attention particulière est portée à :

- la navigation au clavier ;
- les attributs ARIA ;
- le focus visible ;
- la gestion des dialogues avec `Échap` / `Entrée` ;
- `prefers-reduced-motion`.

---

## 🌍 Déploiement

Le projet est déployé avec **Vercel**.

Aucune variable d'environnement n'est nécessaire pour le fonctionnement actuel de l'application, les données étant stockées localement dans le navigateur.

> **🔗 Application en ligne : [focus-day-nps.vercel.app](https://focus-day-nps.vercel.app/)**

---

## 🔮 Évolutions possibles

L'architecture actuelle permet d'envisager plusieurs évolutions :

- migration de `localStorage` vers Supabase, Firebase ou une API personnalisée ;
- synchronisation des données entre plusieurs appareils ;
- authentification utilisateur ;
- notifications push serveur ;
- installation comme véritable PWA ;
- statistiques plus avancées ;
- historique synchronisé dans le cloud.

Ces évolutions ne nécessitent pas nécessairement de remettre en cause l'interface actuelle : la séparation entre la logique métier, le stockage et l'interface facilite cette progression.

---

## 📚 Origine du projet

Le concept de FocusDay prolonge un **sujet d'examen de Master 1 réalisé en 2025**.

Le projet initial était une todo-list développée avec :

- Flutter ;
- une API PHP ;
- MySQL.

En 2026, le concept a été repris et largement personnalisé.

L'objectif n'était plus simplement de **stocker des tâches**, mais de construire une application capable d'**accompagner le déroulement d'une journée**.

Le projet a ainsi évolué vers :

```text
Todo-list classique
       ↓
Objectifs avec horaires
       ↓
Suivi en temps réel
       ↓
Rappels
       ↓
Statuts temporels
       ↓
Statistiques
       ↓
Débrief réflexif
```

FocusDay constitue donc également un exercice de transformation d'un sujet académique en **produit web plus complet et plus proche d'un cas d'usage réel**.

---

## 👩‍💻 À propos

Conçu et développé par **Ndeye Penda Sarr**.

**Business Intelligence & Data · Développement Web Full-Stack**

---

© 2025–2026 Ndeye Penda Sarr
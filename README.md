# Daymark

Daymark is a calm, lightweight task manager for organizing work into categories, tracking subtasks, and keeping deadlines in view. Your tasks are saved in your browser with LocalStorage.

## Features

- Organize tasks into custom categories.
- Create, edit, complete, and delete tasks.
- Break tasks into subtasks and track their completion percentage.
- Set deadlines and identify overdue tasks.
- Schedule daily, weekly, or monthly recurring tasks.
- Review or clear completed tasks.
- Keep task data in browser LocalStorage without an account.

## Screenshots

Add current application screenshots here before publishing:

- Main task view
- Task details and subtasks
- Mobile layout

## Tech stack

- React 18 and TypeScript
- Vite
- Tailwind CSS 4
- Lucide React icons
- Vitest
- npm

## Getting started

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

## Commands

```sh
npm run typecheck  # TypeScript checks
npm test           # Unit tests
npm run build      # Type-check and create a production build
npm run preview    # Preview the production build locally
```

## Project structure

```text
.
├── .github/              # Issue and pull request templates, CI workflow
├── src/
│   ├── App.tsx           # Application interface and UI state
│   ├── index.css         # Application styles
│   ├── main.tsx          # React entry point
│   ├── taskData.ts       # Task operations, recurrence, deadlines, persistence
│   └── taskData.test.ts  # Unit tests for task behavior
├── index.html
├── package.json
└── vite.config.ts
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, testing, and pull request guidance.

## License

No license has been added yet. Until a license is chosen and included in the repository, all rights remain with the copyright holder.

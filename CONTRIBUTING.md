# Contributing

Thanks for helping improve Daymark. Please keep changes focused and preserve the existing behavior unless a change is needed to fix or improve it.

## Set up your fork

1. Use the project's GitHub page to fork the repository.
2. Clone your fork and enter the project directory:

   ```sh
   git clone https://github.com/<your-username>/<repository>.git
   cd <repository>
   ```

3. Install dependencies:

   ```sh
   npm install
   ```

4. Create a branch for your change:

   ```sh
   git switch -c feat/short-description
   ```

## Run and verify

Start the development server:

```sh
npm run dev
```

Run the tests and TypeScript checks before submitting:

```sh
npm test
npm run typecheck
```

For UI or production-build changes, also run:

```sh
npm run build
```

## Submit a Pull Request

Commit focused changes, push your branch to your fork, and open a Pull Request against the project's default branch. Describe the change, link any related issue, and include screenshots for UI changes. Complete the checklist in the Pull Request template.

Use a short, descriptive commit message. Examples:

```text
feat: add recurring tasks
fix: correct overdue handling
docs: update README
test: add task tests
```

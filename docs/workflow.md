# ThesisHub — Issue-Driven Development Workflow

The project was developed incrementally through GitHub issues, feature branches and pull requests into the `master` branch. See the [actual PR history](https://github.com/ReyA44/thesis-hub/pulls?q=is%3Apr) for traceability.

## Typical cycle

1. Define a scoped issue with acceptance criteria.
2. Create a descriptive `feature/`, `fix/` or `docs/` branch from the current `master`.
3. Implement the smallest coherent change; preserve clear names and explanatory comments.
4. Run the relevant automated tests and review the changed files.
5. Open a pull request with `Closes #<actual issue number>` in its description.
6. Address CI failures and review feedback.
7. Merge to `master` and synchronize the local repository.
8. Check essential UI flows in the browser.

## Definition of done

- Core functionality is implemented and source behavior agrees with Prisma schema.
- CI passes backend unit tests, isolated HTTP/PostgreSQL integration tests, React ESLint and Vite build.
- Errors are handled without exposing internal stack traces.
- Documentation distinguishes shipped features from deferred ideas.
- Final browser acceptance is performed by the developer before submission.

## AI assistance

AI was used for planning, drafting, code review and troubleshooting. Verify changes through CI, inspecting the implementation and actual browser use. See [AI usage](ai-usage.md).

## Safety and scope

Never commit `.env`, passwords or signing secrets. No brokerage integration. Public deployment is out of scope for the local-first submission. Prioritize a working understandable MVP over adding features.

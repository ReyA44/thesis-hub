
# ThesisHub — Development Workflow

**Version:** 1.0
**Methodology:** Agile-inspired, issue-driven development
**Tools:** Antigravity IDE, Git, GitHub, GitHub Projects

## 1. Project Management

We use GitHub Issues to manage development tasks.

Each issue should contain:
- Description of the task
- Acceptance criteria (conditions for completion)
- Priority
- Relevant technical notes

GitHub Projects provides a Kanban board:
- Todo
- In Progress
- In Review
- Done

Development is divided into small, manageable features.

## 2. Git Branching Strategy

The `master` branch contains stable, reviewed work.

New work is developed in separate branches:

- `feature/` — New functionality
- `fix/` — Bug fixes
- `docs/` — Documentation
- `test/` — Tests

Example: `feature/post-creation`

Branches should be short-lived and focused on one task.

## 3. Development Cycle

For each feature:

1. Select or create a GitHub Issue.
2. Define acceptance criteria.
3. Create a branch from the latest `master`.
4. Implement the feature.
5. Test functionality and handle errors.
6. Review changes and commit.
7. Push the branch to GitHub.
8. Open a Pull Request linked to the issue.
9. Review the changes (self-review for solo work).
10. Merge into `master` and close the issue.

## 4. Commit Conventions

Use descriptive commit messages.

Examples:
- `feat: add thesis creation form`
- `fix: prevent duplicate reactions`
- `docs: document database relationships`
- `test: add authentication tests`
- `refactor: extract market data service`

Each commit should represent a logical change.

## 5. Testing and Quality

Testing should include:
- Unit tests for business logic
- Integration tests for API/database operations
- Manual UI testing for user workflows
- Authentication and authorization checks
- Validation and error handling

Automated testing will be added as the application grows.

## 6. Documentation

Maintain:
- README.md — Project overview and setup
- docs/requirements.md — Product requirements
- docs/workflow.md — Development process
- docs/architecture.md — System architecture (later)
- docs/decisions/ — Important technical decisions (later)
- docs/learning-log.md — Topics learned beyond the syllabus (later)

Documentation evolves alongside implementation.

## 7. AI-Assisted Development

AI is used to accelerate implementation and learning.

Developer responsibilities:
- Understand the architecture and major components
- Review generated changes
- Verify critical logic and security
- Run relevant tests
- Document important technical decisions

AI-generated code is not considered verified without testing.

## 8. Definition of Done

A task is complete when:
- Acceptance criteria are satisfied
- Relevant tests pass
- No known critical bugs remain
- Documentation is updated if necessary
- Changes are reviewed and merged

## 9. Security and Privacy

- Never commit API keys, credentials, or secrets
- Use environment variables for configuration
- Validate user inputs
- Enforce authorization on the backend
- Do not store personal brokerage information

## 10. Iterative Development

Build a working MVP first.

Add features incrementally, prioritizing
functionality, maintainability, and testability.

Requirements and architecture may evolve.
Significant decisions and changes are documented.

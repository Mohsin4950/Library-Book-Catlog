# R2 - Developer Version Control

Practical 10: End-to-End DevOps Pipeline | B3-G1 | Library Book Catalog
Role: R2 - Developer (Version Control) | GitHub: Mohsin4950

## Aim
To develop the Library Book Catalog API and manage its source code with Git and GitHub:
work on a feature branch, commit with Jira keys, push to GitHub, raise a pull request and merge it into `main`
(following the procedure of ASDD Practical 2 - Git version control).

## What R2 delivered
| Deliverable | File / location |
| --- | --- |
| Flask API with `GET /items`, `POST /items`, `GET /health` | `app.py` |
| Automated tests (pytest) | `test_app.py` |
| Dependencies | `requirements.txt` |
| Ignore rules for Python build files | `.gitignore` |
| Feature branch | `feature-library-api` |
| Pull request and merge | `feature-library-api` -> `main` on GitHub |

## Jira traceability
Every commit message starts with the Jira key of the story it implements.

| Commit message | Jira story |
| --- | --- |
| `SCRUM-6 feat: list catalog books via GET /items` | SCRUM-6 View the library book catalog |
| `SCRUM-7 feat: add books to the catalog via POST /items` | SCRUM-7 Add a book to the library catalog |
| `SCRUM-8 feat: add GET /health endpoint` | SCRUM-8 Check the library API health |
| `SCRUM-8 test: verify health, list and add book endpoints` | SCRUM-8 (tests cover all three stories) |
| `SCRUM-5 docs: add R2 run instructions and version control record` | SCRUM-5 Epic |

## Git commands used (mapped to Practical 2)
| Practical 2 step | Command used in this project |
| --- | --- |
| Step 2 - Verify Git | `git --version` |
| Step 3 - Configure Git | `git config user.name "Mohsin4950"`<br>`git config user.email "mohsinsidhpurwala@eng.rizvi.edu.in"` |
| Clone (terminology) | `git clone https://github.com/Mohsin4950/Library-Book-Catlog.git` |
| Step 16 - Create a new branch | `git checkout -b feature-library-api` |
| Step 8 - Check status | `git status` |
| Step 9 - Stage files | `git add app.py requirements.txt .gitignore` |
| Step 10 / 18 - Commit | `git commit -m "SCRUM-6 feat: list catalog books via GET /items"` (and one commit per story) |
| Step 19 - Push the branch | `git push -u origin feature-library-api` |
| Pull request | GitHub -> Compare & pull request -> base `main` <- compare `feature-library-api` |
| Step 20 - Merge | Merge pull request on GitHub (equivalent to `git checkout main` + `git merge feature-library-api`) |
| Step 21 - Verify | `git checkout main`, `git pull`, `git branch`, `git status`, `git log --oneline --graph` |

## Test result
```
$ pytest -v
test_app.py::test_health PASSED
test_app.py::test_get_items PASSED
test_app.py::test_post_item PASSED
test_app.py::test_post_item_requires_title_and_author PASSED
4 passed
```

## API check (running app)
```
$ curl http://localhost:5000/health
{"status":"ok"}

$ curl -X POST -H "Content-Type: application/json" \
       -d '{"title":"Refactoring","author":"Martin Fowler"}' http://localhost:5000/items
{"author":"Martin Fowler","id":4,"title":"Refactoring"}

$ curl http://localhost:5000/items
[{"author":"Robert C. Martin","id":1,"title":"Clean Code"}, ... ,{"author":"Martin Fowler","id":4,"title":"Refactoring"}]
```

## Screenshots to capture for the journal
1. Terminal: `git log --oneline --graph` showing the Jira-keyed commits.
2. Terminal: `pytest -v` with 4 passed.
3. Browser: `http://localhost:5000/items` and `/health` responses.
4. GitHub: branches page showing `feature-library-api`.
5. GitHub: the merged pull request (Conversation and Commits tabs).
6. GitHub: commit history on `main` after the merge.

## Hand-off to R3 / R4
- Run command: `python app.py` (listens on `0.0.0.0:5000`).
- Test command: `pip install -r requirements.txt && pytest -v` - use this in the GitHub Actions workflow.
- The Dockerfile should expose port 5000 and start `python app.py`.

## Viva note (R2 question: branch vs merge / why pull requests)
A branch is an independent line of development: R2 built the API on `feature-library-api` so that `main`
stayed stable while work was in progress. A merge combines the commits of one branch into another.
A pull request is GitHub's way of proposing that merge: teammates can review the diff and the commits
(and later, CI results) before the code reaches `main`, which is how version control supports team collaboration.

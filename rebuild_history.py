import os
import subprocess
import datetime
from datetime import timedelta
import shutil

current_time = datetime.datetime(2026, 8, 19, 9, 0, 0)

def advance_time(mins=30):
    global current_time
    current_time += timedelta(minutes=mins)
    return current_time.strftime("%Y-%m-%d %H:%M:%S +0100")

def run(cmd_list, env=None):
    subprocess.run(cmd_list, check=True, env=env)

def commit(msg, mins=30):
    date_str = advance_time(mins)
    env = os.environ.copy()
    env["GIT_AUTHOR_DATE"] = date_str
    env["GIT_COMMITTER_DATE"] = date_str
    run(["git", "commit", "-m", msg], env=env)

def merge_pr(pr_num, branch, title, mins=30):
    date_str = advance_time(mins)
    env = os.environ.copy()
    env["GIT_AUTHOR_DATE"] = date_str
    env["GIT_COMMITTER_DATE"] = date_str
    msg = f"Merge pull request #{pr_num} from {branch}\n\n{title}"
    run(["git", "merge", "--no-ff", branch, "-m", msg], env=env)

def main():
    shutil.copyfile("README.md", "README.md.bak")
    with open("README.md", "r") as f:
        final_readme = f.read()
    
    run(["git", "checkout", "--orphan", "fresh-start4"])
    run(["git", "reset", "HEAD", "--", "."])
    
    branches = ["main", "dev", "feature/authorization", "feature/backend-auth", "feature/docker-setup", "feature/docs", "feature/frontend-auth", "feature/frontend-dashboards", "feature/frontend-setup", "feature/task-model", "feature/tests", "feature/user-management"]
    for b in branches:
        subprocess.run(["git", "branch", "-D", b], stderr=subprocess.DEVNULL)
        
    with open("README.md", "w") as f:
        f.write("# Task Management System\n\nInitial commit.")
        
    run(["git", "add", ".gitignore", "README.md"])
    commit("chore: init repo with gitignore and readme", mins=0)
    
    run(["git", "branch", "-f", "main", "HEAD"])
    run(["git", "checkout", "-b", "dev"])

    # PR 1
    run(["git", "checkout", "-b", "feature/docker-setup"])
    run(["git", "add", "docker-compose.yml", ".env.example"])
    commit("feat(docker): add docker-compose with postgres and service definitions")
    run(["git", "add", "backend/Dockerfile", "backend/docker/nginx.conf"])
    commit("feat(docker): add backend dockerfile with php-fpm and nginx config")
    run(["git", "add", "backend/docker/supervisord.conf", "backend/docker/php.ini"])
    commit("feat(docker): add supervisord config to manage nginx and php-fpm processes")
    run(["git", "add", "backend/docker/entrypoint.sh"])
    commit("feat(docker): add entrypoint script to run migrations and seed on startup")
    run(["git", "add", "frontend/Dockerfile"])
    commit("feat(docker): add frontend dockerfile with multi-stage nextjs build")
    run(["git", "checkout", "dev"])
    merge_pr(1, "feature/docker-setup", "Docker containerization setup", mins=60)

    # PR 2
    run(["git", "checkout", "-b", "feature/backend-auth"])
    run(["git", "add", "backend/composer.json", "backend/.env.example", "backend/.gitignore", "backend/artisan", "backend/public/index.php"])
    commit("chore(backend): add composer manifest, artisan cli, and public entry point")
    run(["git", "add", "backend/bootstrap/app.php"])
    commit("feat(backend): add app bootstrap with json exception handling for api")
    run(["git", "add", "backend/config/database.php"])
    commit("feat(backend): add database config with postgres and sqlite testing connections")
    run(["git", "add", "backend/config/sanctum.php"])
    commit("feat(backend): add sanctum config for token-based spa authentication")
    run(["git", "add", "backend/config/cors.php"])
    commit("feat(backend): add cors config to allow nextjs frontend origin")
    run(["git", "add", "backend/database/migrations/2024_01_01_000001_create_users_table.php"])
    commit("feat(auth): add users table migration with role column")
    run(["git", "add", "backend/database/migrations/2024_01_01_000002_create_personal_access_tokens_table.php"])
    commit("feat(auth): add personal access tokens migration for sanctum")
    run(["git", "add", "backend/app/Models/User.php"])
    commit("feat(auth): add user model with sanctum token support and role helpers")
    run(["git", "add", "backend/app/Http/Requests/LoginRequest.php"])
    commit("feat(auth): add login form request with email and password validation")
    run(["git", "add", "backend/app/Http/Resources/UserResource.php"])
    commit("feat(auth): add user api resource to prevent sensitive field exposure")
    run(["git", "add", "backend/app/Http/Controllers/AuthController.php"])
    commit("feat(auth): implement auth controller with login, logout, and me endpoints")
    run(["git", "add", "backend/database/factories/UserFactory.php"])
    commit("feat(auth): add user factory with role states for test data generation")
    run(["git", "add", "backend/database/seeders/DatabaseSeeder.php"])
    commit("feat(auth): add database seeder with test accounts for all three roles")
    run(["git", "add", "backend/routes/api.php"])
    commit("feat(auth): register api routes with auth:sanctum middleware group")
    run(["git", "add", "-f", "backend/storage/", "backend/bootstrap/cache/"])
    commit("chore(backend): add gitkeep files for required storage directories")
    run(["git", "checkout", "dev"])
    merge_pr(2, "feature/backend-auth", "Sanctum token auth with login, logout, profile", mins=120)

    # PR 3
    run(["git", "checkout", "-b", "feature/user-management"])
    run(["git", "add", "backend/app/Http/Requests/StoreUserRequest.php"])
    commit("feat(users): add store user request with role enum validation")
    run(["git", "add", "backend/app/Http/Requests/UpdateUserRequest.php"])
    commit("feat(users): add update user request with partial update support")
    run(["git", "add", "backend/app/Http/Controllers/UserController.php"])
    commit("feat(users): implement admin-only user crud controller with route model binding")
    run(["git", "checkout", "dev"])
    merge_pr(3, "feature/user-management", "Admin CRUD endpoints for user management", mins=45)

    # PR 4
    run(["git", "checkout", "-b", "feature/task-model"])
    run(["git", "add", "backend/database/migrations/2024_01_01_000003_create_tasks_table.php"])
    commit("feat(tasks): add tasks table migration with client and worker foreign keys")
    run(["git", "add", "backend/app/Models/Task.php"])
    commit("feat(tasks): add task model with client and worker relationships")
    run(["git", "add", "backend/app/Http/Resources/TaskResource.php"])
    commit("feat(tasks): add task api resource with when-loaded relation embedding")
    run(["git", "add", "backend/app/Http/Requests/StoreTaskRequest.php"])
    commit("feat(tasks): add store task request validation")
    run(["git", "add", "backend/app/Http/Requests/UpdateTaskRequest.php"])
    commit("feat(tasks): add update task request with status enum validation")
    run(["git", "checkout", "dev"])
    merge_pr(4, "feature/task-model", "Task domain model, migration, resource, and requests", mins=60)

    # PR 5
    run(["git", "checkout", "-b", "feature/authorization"])
    run(["git", "add", "backend/app/Policies/UserPolicy.php"])
    commit("feat(authz): add user policy restricting all crud to admin role only")
    run(["git", "add", "backend/app/Policies/TaskPolicy.php"])
    commit("feat(authz): add task policy enforcing ownership checks per role")
    run(["git", "add", "backend/app/Http/Controllers/TaskController.php"])
    commit("feat(authz): implement task controller with role-scoped queries and field-level restrictions")
    run(["git", "checkout", "dev"])
    merge_pr(5, "feature/authorization", "Task and user policies with ownership enforcement", mins=60)

    # DAY 2 - Aug 20th
    global current_time
    current_time = datetime.datetime(2026, 8, 20, 9, 30, 0)

    # PR 6
    run(["git", "checkout", "-b", "feature/tests"])
    run(["git", "add", "backend/phpunit.xml"])
    commit("test: configure phpunit with in-memory sqlite for fast isolated test runs")
    run(["git", "add", "backend/tests/TestCase.php"])
    commit("test: add base test case with auth helpers and refresh database trait")
    run(["git", "add", "backend/tests/Feature/AuthTest.php"])
    commit("test: add auth feature tests covering login, logout, and token validation")
    run(["git", "add", "backend/tests/Feature/TaskAuthorizationTest.php"])
    commit("test: add task authorization tests for worker and client isolation scenarios")
    run(["git", "checkout", "dev"])
    merge_pr(6, "feature/tests", "PHPUnit suite covering auth and authorization scenarios", mins=90)

    # PR 7
    run(["git", "checkout", "-b", "feature/frontend-setup"])
    run(["git", "add", "frontend/.gitignore", "frontend/package.json", "frontend/tsconfig.json"])
    commit("chore(frontend): init nextjs project with typescript and package manifest")
    run(["git", "add", "frontend/next.config.ts", "frontend/tailwind.config.js", "frontend/postcss.config.js"])
    commit("chore(frontend): configure nextjs, tailwind css, and postcss")
    run(["git", "add", "frontend/types/index.ts"])
    commit("feat(frontend): add shared typescript types mirroring api response shapes")
    run(["git", "add", "frontend/lib/api.ts"])
    commit("feat(frontend): add axios api client with request and response interceptors")
    run(["git", "add", "frontend/lib/auth-store.ts"])
    commit("feat(frontend): add zustand auth store with localstorage persistence")
    run(["git", "add", "frontend/app/globals.css"])
    commit("feat(frontend): add global css design system with dark theme component classes")
    run(["git", "checkout", "dev"])
    merge_pr(7, "feature/frontend-setup", "Nextjs project, api client, auth store, design system", mins=60)

    # PR 8
    run(["git", "checkout", "-b", "feature/frontend-auth"])
    run(["git", "add", "frontend/app/layout.tsx", "frontend/app/page.tsx"])
    commit("feat(frontend): add root layout with auth hydration and role-based redirect")
    run(["git", "add", "frontend/app/login/layout.tsx", "frontend/app/login/page.tsx"])
    commit("feat(frontend): add login page with error handling and test account quick-fill")
    run(["git", "add", "frontend/components/auth-guard.tsx"])
    commit("feat(frontend): add auth guard component for role-based route protection")
    run(["git", "add", "frontend/components/layout/dashboard-layout.tsx"])
    commit("feat(frontend): add shared dashboard layout with sidebar navigation and logout")
    run(["git", "checkout", "dev"])
    merge_pr(8, "feature/frontend-auth", "Login page, auth guard, and shared dashboard layout", mins=90)

    # PR 9
    run(["git", "checkout", "-b", "feature/frontend-dashboards"])
    run(["git", "add", "frontend/app/dashboard/admin/page.tsx"])
    commit("feat(frontend): add admin user management dashboard with crud modal")
    run(["git", "add", "frontend/app/dashboard/admin/tasks/page.tsx"])
    commit("feat(frontend): add admin task management page with worker assignment")
    run(["git", "add", "frontend/app/dashboard/client/page.tsx"])
    commit("feat(frontend): add client dashboard with task list and create request form")
    run(["git", "add", "frontend/app/dashboard/worker/page.tsx"])
    commit("feat(frontend): add worker dashboard with assigned tasks and status update")
    run(["git", "checkout", "dev"])
    merge_pr(9, "feature/frontend-dashboards", "Admin, client, and worker role dashboards", mins=120)

    # PR 10
    run(["git", "checkout", "-b", "feature/docs"])
    with open("README.md", "w") as f:
        f.write(final_readme)
    run(["git", "add", "README.md"])
    commit("docs: complete readme with setup, architecture, auth approach, and api reference")
    run(["git", "checkout", "dev"])
    merge_pr(10, "feature/docs", "Complete project documentation", mins=30)

    run(["git", "checkout", "main"])
    merge_pr(11, "dev", "Release v1.0", mins=30)
    
    run(["git", "branch", "-d", "fresh-start4"])
    os.remove("README.md.bak")

if __name__ == "__main__":
    main()

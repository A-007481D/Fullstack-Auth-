# Development & Troubleshooting Log

This document tracks the specific edge cases, environmental quirks, and architectural challenges we faced while deploying this full-stack application, and how we solved them. You can use this as a reference if the recruiter asks about your debugging process or deployment experience!

## 1. Google Cloud Shell Networking & CORS Interception
**Issue:** Making Axios requests to `localhost:8000` worked locally but failed in Cloud Shell with a `404 Not Found` or a massive CORS block redirecting to Google's JWT authentication page.
**Root Cause:** Cloud Shell hosts preview ports behind an aggressive reverse proxy. `localhost:8000` evaluates to the user's physical laptop, not the cloud server. Furthermore, if the backend returns a `302 Redirect` (e.g., on auth failure), the Cloud Shell proxy intercepts it and forces a Google authentication wall.
**Solution:** 
1. **Next.js Rewrites:** We migrated Axios to use a relative path (`/api`) and configured Next.js `rewrites` to proxy requests to `http://backend:8000`. This kept all traffic entirely inside the internal Docker DNS network, bypassing the external proxy.
2. **Forced JSON Responses:** We modified Laravel's `bootstrap/app.php` using `shouldRenderJsonWhen()` to guarantee that API validation errors always return a `422 JSON` response instead of a `302 Redirect`, preventing the Cloud Shell proxy from hijacking the request.

## 2. Laravel 11 Base Controller Removal
**Issue:** A fatal `500 Internal Server Error` was thrown: `Class "App\Http\Controllers\Controller" not found`.
**Root Cause:** In Laravel 11, the framework authors removed the default base `Controller.php` file to simplify the directory structure. Our controllers were instinctively trying to `extend Controller`.
**Solution:** We removed the inheritance (`class AuthController`) to make them plain PHP classes. For controllers that relied on authorization policies (Tasks and Users), we manually imported and used the `Illuminate\Foundation\Auth\Access\AuthorizesRequests` trait to restore the `$this->authorize()` functionality.

## 3. GitHub Actions Composer Version Mismatch
**Issue:** The CI pipeline crashed on `composer install` with: `Your requirements could not be resolved to an installable set of packages`.
**Root Cause:** The `composer.lock` file was generated inside our Docker container which runs **PHP 8.3**. However, the GitHub Action workflow was configured to use **PHP 8.2**, causing a strict dependency version mismatch.
**Solution:** Bumped the `shivammathur/setup-php` action in `.github/workflows/ci.yml` from `8.2` to `8.3` to perfectly mirror the production container environment.

## 4. Next.js Docker Build Quirks
**Issue A (Dependencies):** `npm ci` crashed because `package-lock.json` was omitted from the repository.
**Solution A:** Switched to `npm install` in the Next.js `Dockerfile` to allow graceful dependency resolution.

**Issue B (Standalone Config):** `npm run build` crashed complaining that `next.config.ts` is not supported in the standalone builder.
**Solution B:** Migrated the config file to standard JavaScript (`next.config.mjs`).

**Issue C (Static Assets):** The Docker Stage 3 runner crashed with `COPY /app/public ./public: not found`.
**Solution C:** Next.js expects a static assets folder. We injected an empty `public/.gitkeep` directory into the repository to satisfy the Docker `COPY` command.

**Issue D (Hot Reloading vs Production Image):** Code changes made to the frontend UI were not showing up in the browser, even after committing to git.
**Root Cause:** The `docker-compose.yml` mounts the backend source code via a volume (`./backend:/var/www/html`) which allows PHP/Laravel to hot-reload. However, the frontend is configured with `NODE_ENV: production` and builds a standalone compiled Next.js image during `docker compose up --build`. No source files are mounted into the frontend container.
**Solution:** Remembering to run `docker compose up -d --build frontend` whenever Next.js source code changes to recompile the production bundle.

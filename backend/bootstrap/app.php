<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Laravel 11 Application Bootstrap
|--------------------------------------------------------------------------
|
| Laravel 11 uses this single file instead of Kernel.php + ServiceProviders
| for most configuration. It's cleaner and more explicit.
|
*/

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Ensure all API responses return JSON (no HTML error pages on API routes)
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        // Alias for convenience — can use 'auth.sanctum' in route definitions
        $middleware->alias([
            'auth.sanctum' => \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Force Laravel to always return JSON for API routes
        // This prevents 302 redirects to login/referer when validation or auth fails
        $exceptions->shouldRenderJsonWhen(function (\Illuminate\Http\Request $request, \Throwable $e) {
            if ($request->is('api/*')) {
                return true;
            }
            return $request->expectsJson();
        });

        /*
         * Transform authentication exceptions into JSON 401 responses.
         * Without this, Laravel would redirect to /login (HTML) — wrong for an API.
         */
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return response()->json([
                'message' => 'Unauthenticated. Please provide a valid Bearer token.',
            ], 401);
        });

        /*
         * Transform authorization exceptions into JSON 403 responses.
         * This fires when a Policy returns false.
         */
        $exceptions->render(function (AuthorizationException $e, Request $request) {
            return response()->json([
                'message' => 'Forbidden. You do not have permission to perform this action.',
            ], 403);
        });
    })
    ->create();

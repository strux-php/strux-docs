# Protecting Routes

Protecting routes from unauthenticated users (or redirecting logged-in users away from public pages) is a fundamental part of web security. 

Strux provides two incredibly easy-to-use middleware components out of the box to handle this: the `AuthorizationMiddleware` and the `GuestMiddleware`.

Because Strux uses PHP 8 Attributes for its routing and middleware system, protecting a route is as simple as adding an attribute to your controller method!

## Requiring Authentication

If you have routes that should only be accessible to logged-in users (like a user dashboard or a settings page, or logging out), you should apply the `AuthorizationMiddleware` to them.

If a user tries to access these routes without being logged in, they will be automatically redirected to the login page.

```php
use Strux\Auth\Middleware\AuthorizationMiddleware;
use Strux\Component\Middleware\Attributes\Middleware;
use Strux\Component\Routing\Attributes\Route;
use Strux\Component\Http\Controller\Web\Controller;

class DashboardController extends Controller
{
    #[Route('/dashboard', methods: ['GET'], name: 'dashboard.index')]
    #[Middleware([AuthorizationMiddleware::class])]
    public function index(): Response
    {
        return $this->view('pages/dashboard', [
            'title' => 'My Dashboard'
        ]);
    }
}
```

> [!NOTE]
> The `AuthorizationMiddleware` is highly intelligent. If the user *is* logged in, the middleware automatically injects the `$user` object into the Request attributes. You can retrieve it anywhere!

## Guest Routes

Conversely, there are pages that should *only* be visible to people who are NOT logged in. For example, the Login and Registration pages. If a user is already logged in, they shouldn't be able to access the login form again.

To achieve this, use the `GuestMiddleware`.

If a logged-in user tries to visit a guest route, the middleware will automatically intercept the request and redirect them to their designated dashboard (utilizing your `AuthManager` redirect map).

```php
use Strux\Auth\Middleware\GuestMiddleware;
use Strux\Component\Middleware\Attributes\Middleware;
use Strux\Component\Routing\Attributes\Route;

class AuthController extends Controller
{
    #[Route('/login', methods: ['GET', 'POST'], name: 'auth.login')]
    #[Middleware([GuestMiddleware::class])]
    public function login(): Response
    {
        // Login logic here...
    }
    
    #[Route('/register', methods: ['GET', 'POST'], name: 'auth.register')]
    #[Middleware([GuestMiddleware::class])]
    public function register(): Response
    {
        // Registration logic here...
    }
}
```

### Applying Middleware to an Entire Controller
If every single method in your controller needs the same protection (e.g., an `AccountController`), you can simply place the `#[Middleware]` attribute at the top of the class instead of on every method!

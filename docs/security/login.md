# Login and Authentication

Logging users into your application is securely handled by the `AuthManager`. Strux uses secure sessions to maintain authentication state across requests.

Strux heavily utilizes Form objects (`App\Http\Form\...`) to validate requests before they hit your core authentication logic.

## The Login Process

To authenticate a user, you typically accept their `email` and `password` via a POST request, validate it using a Form object, and then pass those credentials to the `AuthManager`'s Sentinel using the `authenticate()` method.

### Example Login Controller

Here is a complete, production-ready example of how to implement a login route using Strux's Routing Attributes and Base Controller:

```php
namespace App\Http\Controllers\Web;

use App\Domain\Identity\Entity\User;
use App\Http\Form\Auth\LoginForm;
use Strux\Auth\Middleware\GuestMiddleware;
use Strux\Auth\Middleware\AuthorizationMiddleware;
use Strux\Component\Middleware\Attributes\Middleware;
use Strux\Component\Routing\Attributes\Route;
use Strux\Component\Http\Controller\Web\Controller;
use Strux\Component\Http\Response;

class AuthController extends Controller
{
    #[Route('/login', methods: ['GET', 'POST'], name: 'auth.login')]
    #[Middleware([GuestMiddleware::class])]
    public function login(): Response
    {
        // 1. Initialize the Form object to handle validation
        $form = new LoginForm($this->request);

        // 2. Process POST requests
        if ($this->request->is('POST') && $form->isValid()) {
            
            // 3. Attempt Authentication
            if ($this->authManager->sentinel('web')->authenticate([
                'email' => strtolower($form->get('email')),
                'password' => $form->get('password')
            ])) {
                /** @var User $user */
                $user = $this->authManager->sentinel('web')->user();
                
                // 4. Resolve their role-specific dashboard URL
                $resolvedRedirect = $this->authManager->resolveRedirectFor($user);
                
                $this->flash->set('success', 'Logged in successfully. Welcome back!');
                return $this->redirect($resolvedRedirect);
            }

            // 4b. Handle Failure
            $this->flash->set('error', 'Invalid email or password. Please try again.');
        }

        // 5. Render the View for GET requests (or failed POSTs)
        return $this->view('pages/auth/auth', [
            'title' => 'Sign In',
            'loginForm' => $form
        ], !empty($form->getErrors()) ? 400 : 200);
    }
    
    #[Route('/logout', methods: ['POST'], name: 'auth.logout')]
    #[Middleware([AuthorizationMiddleware::class])]
    public function logout(): Response
    {
        // Destroy the user's session securely
        $this->authManager->sentinel('web')->logout();
        
        $this->flash->set('success', 'You have been logged out successfully.');
        return $this->redirect('/login');
    }
}
```

> [!IMPORTANT]
> Notice how we use the `$this->flash` service to set success and error messages! This is built directly into the base `Controller`.

## Checking Authentication State

You can check if a user is currently logged in at any time, either in your Controllers or your Views.

### In Controllers:
```php
$isLoggedIn = $this->authManager->sentinel()->isAuthenticated();

if ($isLoggedIn) {
    /** @var User $user */
    $user = $this->authManager->sentinel()->user();
    echo "Welcome back, " . $user->name;
}
```

### In Twig Views:
By injecting your authentication state into a Global Twig Context (like an `AppContext` provider), you can easily toggle UI elements dynamically:

```twig
{% if isAuthenticated %}
    <a href="{{ route('dashboard.index') }}">Go to Dashboard</a>
    <form action="{{ route('auth.logout') }}" method="POST">
        <button type="submit">Sign Out</button>
    </form>
{% else %}
    <a href="{{ route('auth.login') }}">Sign In</a>
{% endif %}
```

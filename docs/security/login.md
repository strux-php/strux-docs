# Login and Authentication

Logging users into your application is the most fundamental security feature. Strux handles this through **Sentinels** — specialized guards that manage sessions, validate credentials, and keep your users authenticated across page loads.

Think of it like a hotel:
- When you check in (login), the front desk gives you a key card (session)
- Every time you enter a room, you show your key card (the sentinel checks the session)
- If you want to stay logged in after checkout, you can pay for an extended stay (Remember Me)
- When you check out (logout), the key card stops working

---

## The Login Flow — Step by Step

Here is exactly what happens when a user logs in:

```
User submits email + password
       ↓
1. Form validates the input (is the email valid? is the password there?)
       ↓
2. Sentinel looks up the user by email in the database
       ↓
3. Sentinel calls password_verify() to check the password hash
       ↓
       ┌─── INVALID ───┐
       │                │
  LoginFailed event     │
  fires                 │
       │                │
  User sees error       │
  "Invalid credentials" │
       │                │
       └────────────────┘
       │
       ┌─── VALID ───┐
       │              │
  Validated event     │
  fires               │
       │              │
  User ID is stored   │
  in the session      │
       │              │
  If "Remember Me"    │
  → secure cookie     │
  → token rotated     │
       │              │
  Authenticated event │
  fires               │
       │              │
  last_login_at is    │
  updated             │
       │              │
  redirectFor($user)  │
  resolves dashboard  │
  URL                 │
       │              │
  User is redirected  │
  to their dashboard  │
       │              │
       └──────────────┘
```

Every single step in this flow is handled by the framework. You just need to call `$this->auth->authenticate()`.

---

## The Login Controller

Here is a complete, production-ready login controller. This handles everything — form validation, authentication, remember me, flash messages, and role-based redirects:

```php
namespace App\Http\Controllers\Web;

use App\Domain\Identity\Entity\User;
use App\Http\Form\Auth\LoginForm;
use Strux\Auth\Middleware\GuestMiddleware;
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
        // 1. Create a form object — it handles validation automatically
        $form = new LoginForm($this->request);

        // 2. Only process POST submissions
        if ($this->request->is('POST') && $form->isValid()) {

            // 3. Attempt authentication
            //    If credentials are wrong, authenticate() returns false
            //    and the LoginFailed event fires automatically
            if ($this->auth->authenticate([
                'email'    => strtolower($form->get('email')),
                'password' => $form->get('password')
            ], remember: $form->has('remember'))) {

                // 4. Authentication succeeded!
                //    - Validated event fired
                //    - User logged in
                //    - Remember me cookie set (if checked)
                //    - Authenticated event fired
                //    - last_login_at updated

                /** @var User $user */
                $user = $this->auth->user();

                // 5. Resolve their dashboard URL based on their role
                //    e.g., admin → /dashboard/admin, artist → /dashboard/studio
                $dashboardUrl = $this->auth->redirectFor($user);

                $this->flash->set('success', 'Logged in successfully. Welcome back!');
                return $this->redirect($dashboardUrl);
            }

            // 6. Authentication failed
            //    LoginFailed event was already fired
            $this->flash->set('error', 'Invalid email or password. Please try again.');
        }

        // 7. Show the login form (for GET requests or failed POSTs)
        return $this->view('pages/auth/auth', [
            'title'    => 'Sign In',
            'loginForm' => $form
        ], !empty($form->getErrors()) ? 400 : 200);
    }
}
```

> [!IMPORTANT]
> Notice how we did NOT manually check the password or look up the user. The `$this->auth->authenticate()` method does everything: it calls the sentinel's `validate()` (which fires `LoginFailed` or `Validated`), then `login()` (which fires `Authenticated`). Trust the framework to handle security correctly.

---

## The Logout Controller

Logging out is even simpler — one method call:

```php
#[Route('/logout', methods: ['POST'], name: 'auth.logout')]
#[Middleware([AuthorizationMiddleware::class])]
public function logout(): Response
{
    // This does ALL of the following:
    // 1. Removes user ID from the session
    // 2. Regenerates the session ID (prevents session fixation)
    // 3. Clears the "Remember Me" cookie from the browser
    // 4. Nulls the remember_token in the database
    // 5. Fires the LoggedOut event
    // 6. Logs: "[Auth] User Logged Out: ID {id}"
    $this->auth->logout();

    $this->flash->set('success', 'You have been logged out successfully.');
    return $this->redirect('/login');
}
```

> [!WARNING]
> Always use the `POST` method for logout! If you use a `GET` link for logout, a malicious website could trick a user into logging out by embedding `<img src="https://yourapp.com/logout">` in a page. Using `POST` with `AuthorizationMiddleware` prevents this.

---

## Checking Authentication State

You can check if a user is logged in at any time, anywhere in your application.

### In Controllers

```php
// Quick check
if ($this->auth->isAuthenticated()) {
    // User is logged in
}

// Get the user (null if not logged in)
$user = $this->auth->user();

// Get just the user ID
$userId = $this->auth->id();

// Using the Auth facade (from anywhere)
use Strux\Auth\Auth;

if (Auth::isAuthenticated()) {
    $user = Auth::user();
}
```

### In Twig Views

If you inject the user into your template context, you can conditionally show UI elements:

```twig
{% if isAuthenticated %}
    <a href="{{ route('dashboard.index') }}">Go to Dashboard</a>
    <form action="{{ route('auth.logout') }}" method="POST">
        <button type="submit">Sign Out</button>
    </form>
{% else %}
    <a href="{{ route('auth.login') }}">Sign In</a>
    <a href="{{ route('auth.register') }}">Create Account</a>
{% endif %}
```

---

## Remember Me ("Stay Logged In")

The "Remember Me" feature lets users stay logged in even after they close their browser. It works like a **digital handshake** between the browser and the server.

### How It Works (Non-Technical)

Imagine you have a VIP pass to a club:
1. **You check in** at the front desk (login) and they give you a hand stamp (session)
2. If you want to come back tomorrow without checking in again, you pay for a **membership card** (Remember Me cookie)
3. Tomorrow, you show your membership card at the door, and the guard checks it against their member list (database)
4. Each time you use the card, you get a **new card** with a different number — so if someone steals your old card, it won't work anymore (token rotation)
5. If you lose your card, you can ask them to cancel it (logout clears the token)

### How It Works (Technical)

1. **On login with `remember: true`**: A cryptographically random 60-byte token is generated. The SHA-256 hash is stored in `users.remember_token`. The raw token is set as an httpOnly, SameSite=Lax cookie named `remember_me` with a 30-day expiry.
2. **On subsequent requests**: If no session exists, the sentinel reads the `remember_me` cookie. It base64-decodes it, extracts the user ID + raw token, hashes the token, and compares it to the stored hash. If they match, the user is automatically logged in and the token is **rotated** (old one invalidated, new one issued).
3. **On logout**: The cookie is cleared and `remember_token` is set to `null` in the database.

### Enabling Remember Me

Add a checkbox to your login form:

```php
// In your LoginForm class
#[BooleanField(label: 'Remember me')]
protected bool $remember = false;
```

Then pass the checkbox state to the authentication call:

```php
$this->auth->authenticate([
    'email'    => $form->get('email'),
    'password' => $form->get('password')
], remember: $request->has('remember'));
```

You can also pass it to `login()` after registration:

```php
$this->auth->login($user, remember: true);
```

### Configuration

Remember-me settings are configured in `auth.sentinels.web`:

```php
// src\Config\Auth.php
'sentinels' => [
    'web' => [
        'remember_duration' => 2_592_000,   // 30 days in seconds (default)
        'cookie_path'       => '/',
        'cookie_domain'     => '',
        'cookie_secure'     => false,       // Set to true in production with HTTPS
        'cookie_http_only'  => true,
    ],
],
```

| Setting | What It Controls | Default |
|---|---|---|
| `remember_duration` | How long the cookie lasts (in seconds) | 2,592,000 (30 days) |
| `cookie_path` | Which paths the cookie applies to | `/` (entire site) |
| `cookie_domain` | Restrict cookie to a specific domain | `''` (current domain) |
| `cookie_secure` | Only send cookie over HTTPS | `false` (set to `true` in production) |
| `cookie_http_only` | Prevent JavaScript from reading the cookie | `true` |

> [!TIP]
> In production, ALWAYS set `cookie_secure` to `true`. This prevents the remember-me cookie from being sent over unencrypted HTTP connections, protecting your users from cookie theft on public WiFi.

### Security Features

Strux's Remember Me implementation follows security best practices:

- **Token rotation**: Every time the cookie is used, a new token is generated and the old one is invalidated. If someone steals a cookie, using it will rotate the token, and the legitimate user's next request will fail — alerting them to the breach.
- **Timing-safe comparison**: Token verification uses `hash_equals()` instead of `==` or `===`. This prevents timing attacks where an attacker could guess the token by measuring response times.
- **SHA-256 hashing**: The raw token is never stored in the database. Only the SHA-256 hash is stored, so a database breach does not expose valid tokens.
- **httpOnly + SameSite=Lax**: The cookie cannot be read by JavaScript (preventing XSS theft) and is only sent for top-level navigation (preventing CSRF-based cookie theft).

---

## Events Fired During Login

Every login attempt fires events that you can listen to:

| Event | When | What You Can Do |
|---|---|---|
| `LoginFailed` | Wrong email or password | Log the attempt, notify the user, track brute force |
| `Validated` | Credentials are correct (before login) | Audit log, 2FA challenge, additional checks |
| `Authenticated` | User is fully logged in | Update `last_login_at`, send notification, initialize session data |

By default, the framework logs each of these. See [Authentication Events](auth-intro.md) for details on adding your own listeners.

---

## Common Questions

### Why use `$this->auth` instead of `$_SESSION` directly?

The sentinel does much more than just reading a session variable:
- It lazy-loads the user from the database (not from the session)
- It checks the Remember Me cookie if no session exists
- It fires events at every step
- It handles session regeneration (prevents session fixation attacks)
- It provides a clean, typed API that your IDE can autocomplete

### What happens if the session expires?

If the session expires and Remember Me is enabled, the sentinel automatically attempts to restore the session from the Remember Me cookie. The user stays logged in without any visible interruption.

### How do I log out from all devices?

To invalidate all sessions for a user, you would need to clear their `remember_token` and any stored sessions. This is typically done as part of a "security settings" page:

```php
$user->remember_token = null;
$user->save();
// This invalidates all Remember Me cookies
// Sessions will expire naturally
```

For complete device logout, you would also need to clear session data, which requires session storage access.

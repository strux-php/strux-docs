# Protecting Routes

Protecting routes is how you control **who can see what** in your application. Strux provides three middleware components that work together like a security checkpoint at an airport:

1. **GuestMiddleware** — *"Only people NOT flying today can enter the terminal"*
2. **AuthorizationMiddleware** — *"Only ticketed passengers can go through security"*
3. **EnsureEmailIsVerified** — *"Only passengers with verified ID can board the plane"*

Each middleware handles one specific concern. You combine them to create the right security level for each page.

---

## Middleware Stacking — How It Works

Middleware runs in the order you specify, like a conveyor belt. Each middleware can either:
- **Pass the request through** (the user is allowed)
- **Redirect or reject** (the user is not allowed)

```
  Request comes in
       │
       ▼
┌─────────────────┐
│ GuestMiddleware  │  ← If user is logged in, redirect to dashboard
│                  │    If user is NOT logged in, pass through
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Authorization        │  ← If user is NOT logged in, redirect to login
│ Middleware           │    If user IS logged in, pass through
└────────┬────────────┘
         │
         ▼
┌──────────────────────┐
│ EnsureEmailIsVerified│  ← If email NOT verified, redirect to /email/verify
│                      │    If email IS verified, pass through
└────────┬─────────────┘
         │
         ▼
   Your Controller
```

> [!IMPORTANT]
> The order matters! `AuthorizationMiddleware` should always come **before** `EnsureEmailIsVerified` because you need to be logged in before the system can check if your email is verified.

---

## The Three Middleware Components

### 1. GuestMiddleware

Use this on pages that should **only** be visible to people who are **NOT** logged in.

**Examples:** Login page, Registration page, Forgot Password page

```php
use Strux\Auth\Middleware\GuestMiddleware;
use Strux\Component\Middleware\Attributes\Middleware;
use Strux\Component\Routing\Attributes\Route;

#[Route('/login', methods: ['GET', 'POST'], name: 'auth.login')]
#[Middleware([GuestMiddleware::class])]
public function login(): Response
{
    // Only guests (non-logged-in users) can see this
}
```

**What happens if a logged-in user visits the page?**
They are automatically redirected to their dashboard (determined by the role-based redirect map).

### 2. AuthorizationMiddleware

Use this on pages that require the user to be **logged in** (but does not check email verification).

**Examples:** Dashboard, Profile page, Settings page, Logout

```php
use Strux\Auth\Middleware\AuthorizationMiddleware;

#[Route('/dashboard', methods: ['GET'], name: 'dashboard.index')]
#[Middleware([AuthorizationMiddleware::class])]
public function index(): Response
{
    // Only logged-in users can see this
}
```

**What happens if a guest visits the page?**
They are redirected to the login page. The URL they tried to visit is saved as a `next` parameter so you can redirect them back after login.

```php
// After login, the user is sent back to where they were going
$next = $this->request->safe()->input('next');
$intendedUrl = !empty($next) ? $next : $dashboardUrl;
return $this->redirect($intendedUrl);
```

### 3. EnsureEmailIsVerified

Use this on pages that require the user to have a **verified email address**.

**Examples:** Posting a comment, Creating an auction, Accessing premium content

```php
use Strux\Auth\Middleware\AuthorizationMiddleware;
use Strux\Auth\Middleware\EnsureEmailIsVerified;

#[Route('/auctions/create', methods: ['GET', 'POST'])]
#[Middleware([AuthorizationMiddleware::class, EnsureEmailIsVerified::class])]
public function create(): Response
{
    // Only logged-in users with verified emails can see this
}
```

**What happens if the email is not verified?**
They are redirected to `/email/verify` (the verification notice page). For API requests (Accept: application/json), it returns a 403 JSON response:

```json
{
    "error": "Email not verified"
}
```

> [!TIP]
> Use this middleware on any action that creates or modifies important data. Requiring email verification before allowing users to post, bid, or sell prevents spam and fraudulent accounts.

---

## Putting It All Together: Real-World Examples

### Authentication Pages (Login, Register, Forgot Password)

These pages should only be accessible to guests:

```php
#[Route('/login', methods: ['GET', 'POST'], name: 'auth.login')]
#[Middleware([GuestMiddleware::class])]
public function login(): Response { /* ... */ }

#[Route('/register', methods: ['GET', 'POST'], name: 'auth.register')]
#[Middleware([GuestMiddleware::class])]
public function register(): Response { /* ... */ }

#[Route('/forgot-password', methods: ['GET', 'POST'])]
#[Middleware([GuestMiddleware::class])]
public function forgotPassword(): Response { /* ... */ }

#[Route('/reset-password/:token', methods: ['GET', 'POST'])]
#[Middleware([GuestMiddleware::class])]
public function reset(string $token): Response { /* ... */ }
```

### General Dashboard (Logged In, No Verification Needed)

```php
#[Route('/dashboard', methods: ['GET'])]
#[Middleware([AuthorizationMiddleware::class])]
public function index(): Response { /* ... */ }

#[Route('/profile', methods: ['GET', 'POST'])]
#[Middleware([AuthorizationMiddleware::class])]
public function profile(): Response { /* ... */ }

#[Route('/logout', methods: ['POST'])]
#[Middleware([AuthorizationMiddleware::class])]
public function logout(): Response { /* ... */ }
```

### Sensitive Actions (Logged In + Verified Email)

```php
#[Route('/auctions/create', methods: ['GET', 'POST'])]
#[Middleware([AuthorizationMiddleware::class, EnsureEmailIsVerified::class])]
public function createAuction(): Response { /* ... */ }

#[Route('/comments', methods: ['POST'])]
#[Middleware([AuthorizationMiddleware::class, EnsureEmailIsVerified::class])]
public function postComment(): Response { /* ... */ }
```

### Email Verification Pages (Logged In, No Verification Needed — Obviously!)

The verification pages need to be accessible to users whose emails are not yet verified. That is the whole point:

```php
#[Route('/email/verify/:token', methods: ['GET'])]
#[Middleware([AuthorizationMiddleware::class])]
public function verifyEmail(string $token): Response
{
    // Uses $this->auth->user()->verifyToken($token)
    // Then $this->auth->user()->verifyEmail()
}

#[Route('/email/verify', methods: ['GET'])]
#[Middleware([AuthorizationMiddleware::class])]
public function verifyNotice(): Response
{
    // Shows the "check your inbox" page
}

#[Route('/email/verify/resend', methods: ['POST'])]
#[Middleware([AuthorizationMiddleware::class])]
public function resendVerification(): Response
{
    // Generates a new token and sends a new email
}
```

> [!NOTE]
> Notice that the verification routes use `AuthorizationMiddleware` but NOT `EnsureEmailIsVerified`. Users who are logged in but not verified need these routes to complete verification. If you added `EnsureEmailIsVerified`, it would block them in a redirect loop!

---

## Class-Level Middleware

If every method in your controller needs the same protection, you can apply middleware to the entire class instead of each method:

```php
#[Middleware([AuthorizationMiddleware::class])]
class AccountController extends Controller
{
    // All methods in this controller require authentication
    public function index(): Response { /* ... */ }
    public function edit(): Response { /* ... */ }
    public function update(): Response { /* ... */ }
}
```

You can also combine class-level and method-level middleware. Method-level `#[Middleware]` is appended to class-level middleware:

```php
#[Middleware([AuthorizationMiddleware::class])]
class AccountController extends Controller
{
    #[Route('/account/delete', methods: ['POST'])]
    #[Middleware([EnsureEmailIsVerified::class])]  // Added on top of AuthorizationMiddleware
    public function delete(): Response { /* ... */ }
}
```

---

## How the AuthorizationMiddleware Works Internally

Since this is the most commonly used middleware, here is a deeper look at what it does:

### When the User IS Authenticated

1. Attaches the user object to the PSR-7 request attributes (you can retrieve it elsewhere with `$request->getAttribute('user')`)
2. Inspects the controller method for `#[Authorize]` attributes
3. If `#[Authorize]` defines **roles** → checks if the user has one of the required roles
4. If `#[Authorize]` defines **permissions** → checks if the user has the required permission
5. If `#[Authorize]` defines **authorities** → resolves the resource model and calls the policy method
6. Passes the request through to the controller

### When the User is NOT Authenticated

1. Checks if the request expects JSON → returns a structured 401 response
2. Otherwise → stores the current URL as a `next` parameter and redirects to login
3. Sets a flash message: "You must be logged in to access this page."

### The Next Parameter

The `AuthorizationMiddleware` automatically saves the page the user was trying to visit. The login route receives this as a `?next=` query parameter:

```
/login?next=/dashboard/settings
```

In your login controller, you can read this and redirect back after successful login:

```php
$next = $this->request->safe()->input('next');
$resolvedRedirect = $this->auth->redirectFor($user);
$intendedUrl = !empty($next) ? $next : $resolvedRedirect;
```

---

## What Each Middleware Returns

| Middleware | Authenticated? | Verified? | Result |
|---|---|---|---|
| `GuestMiddleware` | No | — | ✅ Pass through (this is for guests) |
| `GuestMiddleware` | Yes | — | 🔀 Redirect to dashboard |
| `AuthorizationMiddleware` | Yes | — | ✅ Pass through (may check roles/permissions) |
| `AuthorizationMiddleware` | No | — | 🔀 Redirect to login (or 401 JSON) |
| `EnsureEmailIsVerified` | Yes | Yes | ✅ Pass through |
| `EnsureEmailIsVerified` | Yes | No | 🔀 Redirect to `/email/verify` (or 403 JSON) |
| `EnsureEmailIsVerified` | No | — | 🔀 Redirect to `/email/verify` (defensive) |

---

## Quick Reference: Which Middleware to Use

| If you want... | Use... |
|---|---|
| Only guests can see this page | `GuestMiddleware` |
| Only logged-in users can see this page | `AuthorizationMiddleware` |
| Logged-in users with verified email only | `AuthorizationMiddleware` + `EnsureEmailIsVerified` |
| Anyone can see this page (public) | No middleware |

---

## Verifying the Middleware Stack in Development

In development, you can test your middleware stack by:
1. Visiting a protected route without being logged in → should redirect to `/login?next=/your-route`
2. Logging in with an unverified email → should redirect to `/email/verify`
3. Clicking the verification link from the email log → should redirect to your dashboard
4. Visiting the protected route again → should work

Check your application log for middleware messages:

```
[AuthorizationMiddleware] User with ID abc-123 is authenticated. Proceeding.
```

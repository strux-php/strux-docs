# Authentication: Introduction

Welcome to the Strux authentication system. Think of authentication as the **front door of your application** — it controls who gets in, what they can see, and where they go once they're inside.

Strux provides a complete, production-ready authentication system right out of the box. Whether you are building a simple blog, a membership site, or a complex multi-tenant marketplace, everything you need is already here. No boilerplate to write, no packages to install.

## What's Included?

Strux's auth system is not just a login form. It is a **complete identity management layer** that covers every stage of a user's journey:

| Feature | What It Does | Documentation |
|---|---|---|
| **Registration** | Creates new accounts, assigns roles, sends verification emails | [Signup docs](signup.md) |
| **Login / Logout** | Authenticates users, manages sessions, supports "Remember Me" | [Login docs](login.md) |
| **Email Verification** | Confirms users actually own the email they registered with | _(this page)_ |
| **Password Recovery** | Allows users to reset forgotten passwords securely | [Password docs](passwords.md) |
| **Role-Based Access** | Controls what users can see and do based on their role | [Roles docs](roles.md) |
| **Route Protection** | Blocks unauthorized users from restricted pages | [Protecting Routes](protecting-routes.md) |
| **Authorization Policies** | Fine-grained permission checking at the controller level | [Roles docs](roles.md) |
| **Auth Events** | Fires events at every step — log them, email them, react to them | _(this page)_ |
| **Remember Me** | Keeps users logged in across browser sessions for up to 30 days | [Login docs](login.md) |

---

## The Core Concept: Sentinels

Strux uses a concept called **Sentinels** to handle authentication. Think of a Sentinel as a **guard** that stands at the door. You ask the guard: "Who is this person? Are they allowed in?"

There are two built-in sentinels:

### 1. Session Sentinel (`web`)
This is the standard sentinel for web applications. It works like this:
- When a user logs in, their ID is stored in the **session** (a small file or database entry on the server)
- On every page load, the sentinel checks the session to see if the user is logged in
- If "Remember Me" is enabled, it also checks a secure **cookie** in the user's browser as a backup
- On logout, the session is destroyed and the remember-me cookie is cleared

This is the sentinel used by 99% of web applications. You interact with it automatically when you call `$this->auth->user()`.

### 2. Token Sentinel (`api`)
This sentinel uses **JWT (JSON Web Tokens)** instead of sessions. It is designed for:
- API endpoints consumed by mobile apps or single-page applications
- Stateless authentication (no session storage needed)
- Machine-to-machine communication

The token sentinel checks for a `Bearer` token in the `Authorization` header of every request, validates the JWT signature, and loads the user from the database.

### Configuring Sentinels

You configure both sentinels in your `src/Config/Auth.php` file:

```php
'sentinels' => [
    'web' => [
        'remember_duration' => 2_592_000,   // 30 days (default)
        'cookie_path'       => '/',
        'cookie_domain'     => '',
        'cookie_secure'     => false,       // Set to true in production with HTTPS
        'cookie_http_only'  => true,
    ],
],
```

> [!TIP]
> To switch the default sentinel (used by `$this->auth`), change `auth.defaults.guard` from `'web'` to `'api'`. All `$this->auth->user()` calls will then use JWT instead of sessions.

---

## Accessing the Auth System

Strux gives you **two ways** to access authentication throughout your application:

### In Controllers: `$this->auth`

Every controller (that extends the base `Controller` class) has a `$this->auth` property ready to use. The best part? It is **fully typed**, meaning your IDE will autocomplete every method for you — no guessing, no digging through source code.

```php
class DashboardController extends Controller
{
    public function index(): Response
    {
        // Get the logged-in user (or null if not logged in)
        $user = $this->auth->user();
        
        // Check if anyone is logged in
        if ($this->auth->isAuthenticated()) {
            return $this->view('pages/dashboard', [
                'userName' => $user->name
            ]);
        }
        
        return $this->redirect('/login');
    }
}
```

Here are all the methods available on `$this->auth`:

| Method | What It Does | Returns |
|---|---|---|
| `user()` | Get the currently logged-in user | `User` object or `null` |
| `isAuthenticated()` | Check if anyone is logged in | `true` or `false` |
| `id()` | Get the logged-in user's ID | `int`, `string`, or `null` |
| `login($user, $remember)` | Log in a user manually (e.g., after registration) | `void` |
| `logout()` | Log out the current user, clear session and cookie | `void` |
| `authenticate($credentials, $remember)` | Check credentials and log in | `true` or `false` |
| `validate($credentials)` | Check credentials WITHOUT logging in | `true` or `false` |
| `setUser($user)` | Set the user manually (advanced use) | `void` |
| `can($ability, $resource)` | Check if user has permission via `#[Policy]` | `true` or `false` |
| `cannot($ability, $resource)` | Opposite of `can()` | `true` or `false` |
| `redirectFor($user)` | Get the correct redirect URL based on user's role | `string` |

### Globally: The `Auth` Facade

Sometimes you need authentication outside of a controller — in a service class, a console command, or a Twig template helper. For these cases, use the static `Auth` facade:

```php
use Strux\Auth\Auth;

// From anywhere in your code
$user = Auth::user();
$isLoggedIn = Auth::isAuthenticated();
$userId = Auth::id();

// Authentication
Auth::authenticate(['email' => $email, 'password' => $password], remember: true);
Auth::login($user, remember: true);
Auth::logout();

// Authorization
Auth::can('view', $ticket);
Auth::cannot('delete', $ticket);
```

> [!NOTE]
> The `Auth` facade always uses the **default sentinel** configured in `auth.defaults.guard`. To use a different sentinel (e.g., `'api'`), access the `AuthManager` directly.

### Accessing the AuthManager Directly

For advanced use cases — like switching between sentinels — inject `AuthManager` into your class:

```php
use Strux\Auth\AuthManager;

class ReportGenerator
{
    public function __construct(
        private AuthManager $auth
    ) {}
    
    public function generate(): array
    {
        // Use the web sentinel
        $webUser = $this->auth->sentinel('web')->user();
        
        // Use the API sentinel
        $apiUser = $this->auth->sentinel('api')->user();
        
        // ...
    }
}
```

---

## Built-In Entity Models

The framework ships with three complete ORM entity classes. You do not need to create any database tables manually — the migration system detects these and generates them automatically.

### User (`Strux\Auth\Entity\User`)

The default user model includes everything you need for a complete authentication system:

| Field | Type | Purpose |
|---|---|---|
| `id` | UUID (auto-generated) | Unique identifier for each user |
| `name` | String | Display name, automatically title-cased |
| `email` | String | Lowercased, unique, used for login |
| `password` | String | Bcrypt-hashed, hidden from JSON output |
| `email_verified_at` | DateTime or null | When the user verified their email |
| `email_verification_token` | String or null | SHA-256 hash of the verification token |
| `email_verification_expires_at` | DateTime or null | When the verification token expires |
| `last_login_at` | DateTime or null | Timestamp of last successful login |
| `remember_token` | String or null | SHA-256 hash for "Remember Me" cookie |
| `password_reset_token` | String or null | SHA-256 hash of the password reset token |
| `reset_token_expires_at` | DateTime or null | When the password reset token expires |
| `roles` | Collection of Role | Many-to-many relationship |

### Role (`Strux\Auth\Entity\Role`)
- `id`, `name`, `slug`, `description`
- `users` — many-to-many relationship back to users
- `permissions` — many-to-many relationship to permissions

### Permission (`Strux\Auth\Entity\Permission`)
- `id`, `name`, `slug`, `description`
- `roles` — many-to-many relationship back to roles

> [!TIP]
> To add custom fields to your User (like `bio`, `avatar`, or `isAdmin`), create your own User class that extends the framework's User. See [The User Model](auth-user.md) for details.

---

## Authentication Events

One of the most powerful features of Strux's auth system is that it fires **events** at every important step. This allows you to react to what happens — log it, send an email, notify an admin, update a dashboard — without modifying the core auth code.

### The Complete Event List

| Event | Fired When | Carries |
|---|---|---|
| `Registered` | A new user creates an account | `$event->user` |
| `Authenticated` | A user successfully logs in | `$event->user` |
| `Validated` | A user's credentials pass validation | `$event->user` |
| `LoginFailed` | Someone tries to log in with wrong credentials | `$event->credentials` |
| `LoggedOut` | A user logs out | `$event->user` |
| `Verified` | A user verifies their email address | `$event->user` |
| `PasswordReset` | A user successfully resets their password | `$event->user` |

### What Happens When Each Event Fires

By default, the framework already registers listeners that log each event:

| Event | Listener | What It Does |
|---|---|---|
| `Authenticated` | `UpdateLastLogin` | Updates `last_login_at` on the user record |
| `Authenticated` | `LogAuthenticationAction::onLogin` | Logs: `[Auth] User Logged In: ID {id} ({email})` |
| `LoggedOut` | `LogAuthenticationAction::onLogout` | Logs: `[Auth] User Logged Out: ID {id}` |
| `LoginFailed` | `LogAuthenticationAction::onFailure` | Logs: `[Auth] Failed Login Attempt for email: {email}` |
| `Registered` | `LogAuthenticationAction::onRegistered` | Logs: `[Auth] User Registered: ID {id} ({email})` |
| `Validated` | `LogAuthenticationAction::onValidated` | Logs: `[Auth] User Validated: ID {id} ({email})` |
| `Verified` | `LogAuthenticationAction::onVerified` | Logs: `[Auth] User Email Verified: ID {id} ({email})` |
| `PasswordReset` | `LogAuthenticationAction::onPasswordReset` | Logs: `[Auth] User Password Reset: ID {id} ({email})` |

### Listening to Events Yourself

You can add your own listeners to any of these events. For example, to send a welcome email when someone registers:

```php
// In your own code, anywhere after boot
$dispatcher = ContainerBridge::resolve(EventDispatcher::class);

$dispatcher->addListener(Registered::class, function (Registered $event) {
    $user = $event->user;
    // Send welcome email, create default data, notify admin, etc.
    Mail::to($user->email)->send('emails/welcome', ['user' => $user]);
});
```

Or you can use the `#[Listener]` attribute on a dedicated listener class (auto-discovered by the framework):

```php
use Strux\Component\Events\Attributes\Listener;
use Strux\Auth\Events\Registered;

#[Listener(event: Registered::class)]
class SendWelcomeEmail
{
    public function handle(Registered $event): void
    {
        // $event->user is the newly registered user
        // Send welcome email here
    }
}
```

> [!TIP]
> All authentication events are simple DTOs (Data Transfer Objects). They carry data but do not contain logic. This makes them easy to test and easy to serialize if you need to queue them.

---

## Email Verification

Strux includes a complete email verification system built into the User entity. The `EnsureEmailIsVerified` middleware protects routes that require verified emails, and the `AuthController` includes routes for verifying and resending.

### The Four Methods on User

The `User` entity (both the framework default and your custom one) includes three methods for email verification:

#### 1. `generateVerificationToken()`

Creates a new email verification token and stores it securely:

```php
// Simple — 1 hour expiry (default)
$rawToken = $user->generateVerificationToken();

// Custom expiry — pass a Unix timestamp
$rawToken = $user->generateVerificationToken(time() + 7200); // 2 hours

// Custom expiry — pass a DateTime object
use DateTimeImmutable;
$rawToken = $user->generateVerificationToken(new DateTimeImmutable('+2 days'));
```

**How it works:**
1. Generates a cryptographically random 64-character hex string (the "raw" token)
2. SHA-256 hashes the raw token and stores the hash in `email_verification_token`
3. Stores the expiry in `email_verification_expires_at`
4. Saves the user to the database
5. Returns the **raw** (un-hashed) token so you can put it in a verification URL

> [!WARNING]
> Never store the raw token in the database! Only the SHA-256 hash is stored. The raw token is returned to your code so you can include it in an email link. If the database is compromised, the attacker cannot use the stored hashes.

#### 2. `verifyToken($token)`

Checks if a raw token matches the stored hash and is not expired:

```php
$user = $this->auth->user();

if ($user->verifyToken($request->input('token'))) {
    // Token is valid!
    $user->verifyEmail();
} else {
    // Token is invalid or expired
}
```

**How it works:**
1. SHA-256 hashes the raw token from the URL
2. Compares it to the stored hash using `hash_equals()` (timing-safe comparison)
3. Checks that `email_verification_expires_at` has not passed
4. Returns `$this` (the user) if valid, `null` otherwise

#### 3. `isVerified()`

A quick check to see if the user's email is already verified:

```php
if ($user->isVerified()) {
    // Email is verified — user can access verified-only areas
} else {
    // Email is not verified — prompt user to verify
}
```

This is equivalent to checking `$user->email_verified_at !== null` directly, but reads more naturally and protects against future field name changes.

#### 4. `verifyEmail()`

Marks the user's email as verified and dispatches the `Verified` event:

```php
$user->verifyEmail();
// Email is now verified. The Verified event is dispatched automatically.
```

**What it does:**
1. Sets `email_verified_at` to the current timestamp
2. Clears `email_verification_token` and `email_verification_expires_at`
3. Saves the user
4. Dispatches a `Verified` event (which gets logged by the default listener)

### The Three Verify Routes

| Route | Method | Purpose |
|---|---|---|
| `/email/verify/:token` | GET | Click the link from your email |
| `/email/verify` | GET | See the "check your inbox" page |
| `/email/verify/resend` | POST | Get a new verification email |

All three require the user to be logged in (`AuthorizationMiddleware`).

> [!TIP]
> After registration, the user is automatically logged in and the verification email is sent immediately. They just need to click the link in their email to complete verification.

---

## Zero-Configuration Setup

Here is the surprising truth: you can build a complete authentication system **without writing a single line of code**. Here is what happens on a fresh Strux installation:

1. The framework ships with `User`, `Role`, and `Permission` entity classes
2. When you run `php bin/console db:migrate`, the migration generator detects these classes and creates the database tables automatically
3. The `AuthRegistry` wires up the `AuthManager`, sentinels, event listeners, and user provider during boot
4. Your controllers have `$this->auth` ready to use

The only thing you need to build is the UI — the login form, registration form, and templates. Everything else is already done.

### The Registration Flow (End to End)

Here is what happens from the moment a user submits your registration form:

```
User submits form
       ↓
Form validates input (email format, password length, etc.)
       ↓
User is created in the database with hashed password
       ↓
Role is assigned (e.g., 'collector' or 'artist')
       ↓
generateVerificationToken() creates a secure token
       ↓
Verification email is sent (to storage/logs/emails.log in dev)
       ↓
Registered event fires (logged by default listener)
       ↓
User is automatically logged in
       ↓
User is redirected to their dashboard
       ↓
[Later] User clicks verification link in email
       ↓
verifyToken() checks the token against the stored hash
       ↓
verifyEmail() marks email as verified, dispatches Verified event
```

### The Login Flow (End to End)

```
User submits login form
       ↓
Form validates input
       ↓
Sentinel looks up user by email
       ↓
password_verify() checks the password hash
       ↓
[On failure] LoginFailed event fires, user sees error
       ↓
[On success] Validated event fires
       ↓
User ID is stored in session
       ↓
If "Remember Me" is checked → secure cookie is set with rotated token
       ↓
Authenticated event fires, last_login_at is updated
       ↓
redirectFor($user) resolves the correct dashboard URL
       ↓
User is redirected to their role-specific dashboard
```

> [!NOTE]
> Every arrow in these flows represents code that already exists in the framework. You do not need to write any of it.

---

## Next Steps

Now that you understand the big picture, dive into the specific documentation:

| Topic | What You'll Learn |
|---|---|
| [Login & Remember Me](login.md) | Building login forms, remember-me cookies, session management |
| [Registration](signup.md) | Creating accounts, assigning roles, email verification |
| [Password Recovery](passwords.md) | Forgot password flow, reset tokens, email notifications |
| [Roles & Permissions](protecting-routes.md) | RBAC, role-based redirects, permission checking |
| [Protecting Routes](protecting-routes.md) | Middleware, email verification, stacking order |
| [The User Model](auth-user.md) | Custom users, extending the framework, ORM relationships |

---

> [!TIP]
> All authentication events are logged to your application log by default. In development, check `var/logs/app.log` (or wherever your logs directory is configured) to see: `[Auth] User Registered: ID {id}`, `[Auth] User Logged In: ID {id}`, etc. This is invaluable for debugging.

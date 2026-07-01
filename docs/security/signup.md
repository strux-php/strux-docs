# User Registration (Sign Up)

Creating a new user account is the first step in a user's journey. Strux makes this process secure and complete — including password hashing, role assignment, automatic login, and email verification.

Think of registration like **applying for a membership**:
1. You fill out an application form (the registration form)
2. The club checks that your information is valid (form validation)
3. The club creates your member profile (saves the user to the database)
4. You get a membership card and a welcome packet (auto-login + verification email)
5. The club sends you a welcome letter asking you to confirm your address (email verification)
6. You respond to confirm you live where you said you do (click the verification link)

---

## The Registration Flow — Step by Step

Here is exactly what happens when a new user registers:

```
User fills out the registration form
       ↓
1. Form validates: is the email valid? Is the password long enough?
   Do the password and confirmation match?
       ↓
2. Check if the email is already taken (prevent duplicate accounts)
       ↓
3. Create a new User object with the submitted data
       ↓
4. Hash the password securely with bcrypt (NEVER store plain text!)
       ↓
5. Save the user to the database
       ↓
6. Assign a default role (e.g., 'collector' for regular users)
       ↓
7. Generate a verification token via $user->generateVerificationToken()
       ↓
8. Build the verification URL with the raw token
       ↓
9. Send the verification email
       ↓
10. Fire the Registered event (logged by default)
       ↓
11. Log the user in automatically (so they don't have to log in again)
       ↓
12. Resolve their dashboard URL based on their role
       ↓
13. Redirect the user to their new dashboard with a success message
```

> [!NOTE]
> Steps 7-9 (email verification) happen silently in the background. If the email fails to send (e.g., in development without a mail server), the user is still created and logged in — verification is optional but encouraged.

---

## The Registration Controller

Here is the complete registration controller from the Strux application. This is production-ready code:

```php
namespace App\Http\Controllers\Web;

use App\Domain\Identity\Entity\User;
use App\Domain\Identity\Entity\Roles;
use App\Http\Form\Auth\RegisterForm;
use Exception;
use Strux\Auth\Events\Registered;
use Strux\Auth\Middleware\GuestMiddleware;
use Strux\Component\Mail\MailerInterface;
use Strux\Component\Middleware\Attributes\Middleware;
use Strux\Component\Routing\Attributes\Route;
use Strux\Component\Http\Controller\Web\Controller;
use Strux\Component\Http\Response;

class AuthController extends Controller
{
    #[Route('/register', methods: ['GET', 'POST'], name: 'auth.register')]
    #[Middleware([GuestMiddleware::class])]
    public function register(): Response
    {
        $form = new RegisterForm($this->request);

        if ($this->request->is('POST') && $form->isValid()) {
            $email = strtolower($form->get('email'));

            // 1. Prevent duplicate accounts
            if (User::where('email', $email)->exists()) {
                $this->flash->set('error', 'A user with this email already exists.');
                return $this->view(/* ... */, 409);
            }

            // 2. Create the user
            $user = new User();
            $user->firstname = ucfirst($form->get('firstname'));
            $user->lastname = ucfirst($form->get('lastname'));
            $user->email = $email;
            $user->setPassword($form->get('password'));

            try {
                if ($user->save()) {

                    // 3. Assign a role
                    $roleSlug = $form->get('role') === 'artist' ? 'artist' : 'collector';
                    $role = Roles::where('slug', $roleSlug)->first();
                    if ($role) {
                        $user->roles()->attach([$role->id]);
                    }

                    // 4. Generate verification token and send email
                    $rawToken = $user->generateVerificationToken();
                    $verifyUrl = $this->route('auth.verify_email', ['token' => $rawToken]);

                    try {
                        /** @var MailerInterface $mailer */
                        $mailer = $this->container->get(MailerInterface::class);
                        $mailer->to($email, $user->name ?? 'User')
                            ->send('emails/auth/verify-email', [
                                'verifyUrl' => $verifyUrl,
                                'user' => $user,
                            ]);
                    } catch (Exception $e) {
                        // Email failed — user is still created, log the error
                        $this->logError('Failed to send verification email', [
                            'email' => $email,
                            'error' => $e->getMessage(),
                        ]);
                    }

                    // 5. Fire the Registered event
                    $this->event->dispatch(new Registered($user));

                    // 6. Auto-login
                    $this->auth->login($user);

                    // 7. Redirect to role-specific dashboard
                    $dashboardUrl = $this->auth->redirectFor($user);

                    $this->flash->set('success',
                        'Account created successfully! Please verify your email address.');
                    return $this->redirect($dashboardUrl);
                }

                $form->addErrors($user->getErrors());
                $this->flash->set('error', 'Could not create account. Please check the errors below.');
            } catch (Exception $e) {
                $this->flash->set('error', 'An error occurred: ' . $e->getMessage());
            }
        }

        return $this->view('pages/auth/auth', [
            'title'        => 'Sign In',
            'registerForm' => $form
        ], 400);
    }
}
```

### What Each Step Does

#### 1. `$user->setPassword($password)`

This method securely hashes the password using `password_hash()` with the `PASSWORD_DEFAULT` algorithm (currently bcrypt). You should NEVER call `password_hash()` directly — always use `setPassword()`.

```php
// ✅ Correct
$user->setPassword($form->get('password'));

// ❌ Wrong — let the framework handle hashing
$user->password = password_hash($form->get('password'), PASSWORD_DEFAULT);
```

> [!WARNING]
> Never store plain-text passwords. Strux uses bcrypt, which is the industry standard for password hashing. Even if your database is compromised, bcrypt-hashed passwords are computationally infeasible to crack.

#### 2. Role Assignment with `attach()`

Roles and users have a many-to-many relationship. The `attach()` method creates the link in the pivot table (`roles_users`):

```php
$role = Roles::where('slug', 'artist')->first();
if ($role) {
    $user->roles()->attach([$role->id]);
}
```

This inserts a row like `users_id = 123, roles_id = 2` into `roles_users`. You do not need to write any SQL.

#### 3. `$user->generateVerificationToken()`

This generates a secure, random token for email verification. See [Email Verification](#email-verification-after-registration) below for details.

```php
// Default: expires in 1 hour
$rawToken = $user->generateVerificationToken();

// Custom: expires in 2 hours
$rawToken = $user->generateVerificationToken(time() + 7200);

// Custom: specific date
$rawToken = $user->generateVerificationToken(new DateTimeImmutable('+2 days'));
```

The method returns the **raw** (un-hashed) token so you can put it in a URL. Only the SHA-256 hash is stored in the database.

#### 4. Sending the Verification Email

The verification email is sent using the `MailerInterface`. In development, emails are written to `storage/logs/emails.log` instead of being sent over SMTP. You can find the verification link there to test.

#### 5. `$this->event->dispatch(new Registered($user))`

This fires the `Registered` event, which is logged by the default listener:
```
[Auth] User Registered: ID abc-123 (user@example.com)
```

You can add your own listeners to send a welcome email, create default data, or notify an admin.

#### 6. `$this->auth->login($user)`

The user is automatically logged in after registration. This calls the sentinel's `login()` method, which:
- Stores the user ID in the session
- Regenerates the session ID (security)
- Fires the `Authenticated` event
- Updates `last_login_at`

#### 7. `$this->auth->redirectFor($user)`

The correct dashboard URL is resolved based on the user's role. See [Roles](roles.md) for how to configure the redirect map.

---

## Email Verification After Registration

When a user registers, a verification email is sent automatically. The user must click the link in that email to confirm they own the email address.

### What Happens When the User Clicks the Link

The application has three dedicated routes for email verification:

| Route | What It Does |
|---|---|
| `GET /email/verify/:token` | Verifies the token and marks email as verified |
| `GET /email/verify` | Shows the "check your inbox" notice page |
| `POST /email/verify/resend` | Sends a new verification email |

All three routes require the user to be logged in (`AuthorizationMiddleware`).

### The Verify Controller

```php
#[Route('/email/verify/:token', methods: ['GET'], name: 'auth.verify_email')]
#[Middleware([AuthorizationMiddleware::class])]
public function verifyEmail(string $token): Response
{
    /** @var User $user */
    $user = $this->auth->user();

    // Already verified?
    if ($user->email_verified_at !== null) {
        $this->flash->set('info', 'Your email is already verified.');
        return $this->redirect('/');
    }

    // Check the token
    if (!$user->verifyToken($token)) {
        $this->flash->set('error',
            'This verification link is invalid or has expired. Request a new one.');
        return $this->redirect('/email/verify');
    }

    // Mark as verified — this also fires the Verified event
    $user->verifyEmail();

    $this->flash->set('success', 'Your email has been verified successfully!');
    return $this->redirect('/');
}
```

### The Resend Controller

If the verification email is lost or expired, the user can request a new one:

```php
#[Route('/email/verify/resend', methods: ['POST'], name: 'auth.verify_email_resend')]
#[Middleware([AuthorizationMiddleware::class])]
public function resendVerification(): Response
{
    /** @var User $user */
    $user = $this->auth->user();

    if ($user->email_verified_at !== null) {
        $this->flash->set('info', 'Your email is already verified.');
        return $this->redirect('/');
    }

    // Generate a new token (old one is invalidated)
    $rawToken = $user->generateVerificationToken();
    $verifyUrl = $this->route('auth.verify_email', ['token' => $rawToken]);

    // Send the email
    $mailer = $this->container->get(MailerInterface::class);
    $mailer->to($user->email, $user->name ?? 'User')
        ->send('emails/auth/verify-email', [
            'verifyUrl' => $verifyUrl,
            'user' => $user,
        ]);

    $this->flash->set('success', 'A new verification link has been sent to your email.');
    return $this->redirect('/email/verify');
}
```

> [!NOTE]
> Calling `generateVerificationToken()` a second time replaces the old token. This means the previous verification link stops working. This is intentional — it prevents old links from being used after a new one is requested.

### Protecting Routes That Require Verification

Use the `EnsureEmailIsVerified` middleware on any route that should only be accessible to users with verified emails:

```php
use Strux\Auth\Middleware\AuthorizationMiddleware;
use Strux\Auth\Middleware\EnsureEmailIsVerified;

#[Route('/dashboard', methods: ['GET'])]
#[Middleware([AuthorizationMiddleware::class, EnsureEmailIsVerified::class])]
public function dashboard(): Response
{
    // Only authenticated + verified users can reach this
}
```

The middleware stack order matters:
1. **First**: `AuthorizationMiddleware` checks the user is logged in
2. **Second**: `EnsureEmailIsVerified` checks the email is verified

See [Protecting Routes](protecting-routes.md) for more details.

---

## The Registration Events

Two events are fired during registration:

| Event | Fired When | Carries |
|---|---|---|
| `Registered` | After user is saved to the database | `$event->user` |
| `Authenticated` | After auto-login | `$event->user` |

The `Registered` event is fired **before** the user is logged in. This is important because it lets you do things like:
- Send a welcome email
- Create default user data (profile, settings, etc.)
- Notify administrators
- Track registration analytics

The `Authenticated` event is fired by `$this->auth->login()` after registration. This is the same event that fires during a normal login.

---

## The User Entity Methods

The `User` entity has three methods for email verification:

### `generateVerificationToken()`

```php
public function generateVerificationToken(
    int|DateTimeInterface|null $expiresAt = null
): string
```

| Parameter | Type | Default | What It Means |
|---|---|---|---|
| `$expiresAt` | `int`, `DateTimeInterface`, or `null` | `null` (+1 hour) | When the token should expire |

Returns the **raw** (un-hashed) token as a 64-character hex string.

### `verifyToken($token)`

```php
public function verifyToken(string $token): ?static
```

Checks if the given raw token matches the stored hash and is not expired. Returns the user object if valid, `null` otherwise.

### `isVerified()`

```php
public function isVerified(): bool
```

Returns `true` if the user's email has been verified (`email_verified_at` is not null), `false` otherwise:

```php
if ($user->isVerified()) {
    // Allow access to restricted areas
} else {
    // Show verification prompt
}
```

### `verifyEmail()`

```php
public function verifyEmail(): void
```

Marks the email as verified, clears the token fields, saves, and dispatches the `Verified` event.

---

## Verifying Your Email in Development

In development, the framework uses a `log` mail transport that writes emails to `storage/logs/emails.log` instead of sending them over SMTP. This means:

1. Register a new user through the registration form
2. Open `storage/logs/emails.log`
3. Find the verification email with the link like: `http://localhost/email/verify/abc123...`
4. Click the link (or copy it to your browser)

```log
[2026-06-28 12:34:56] To: user@example.com | Subject: Verify Your Email Address
<!DOCTYPE html>
<html>
...
<a href="http://localhost/email/verify/abc123...">Verify Email</a>
...
---
```

> [!TIP]
> In production, set `MAIL_MAILER=smtp` in your `.env` file and configure your SMTP credentials. The framework supports any standard SMTP server, including SendGrid, Mailgun, Postmark, and Amazon SES.

---

## The Verification Email Template

The email template is at `templates/emails/auth/verify-email.html.twig`. It receives two variables:

| Variable | What It Contains |
|---|---|
| `verifyUrl` | The full URL to the verify endpoint with the token |
| `user` | The User object (you can access `user.name`, `user.email`, etc.) |

```twig
<a href="{{ verifyUrl }}" class="btn">Verify Email</a>
```

You can customize this template to match your brand. Add your logo, change the colors, or include additional information.

---

## Relationship Attachments

When assigning roles to users, the `attach()` method creates the many-to-many relationship:

```php
$user->roles()->attach([$role->id]);
```

This inserts a row into the `roles_users` pivot table. You can also detach roles:

```php
// Remove all roles
$user->roles()->detach();

// Remove specific roles
$user->roles()->detach([$roleId1, $roleId2]);

// Sync roles (remove old, add new)
$user->roles()->sync([$roleId1, $roleId2]);
```

> [!NOTE]
> The `sync()` method is the most common for updating roles. It removes any roles not in the given array and adds any new ones. For example, if the user had roles [1, 2] and you sync [2, 3], the result is [2, 3].

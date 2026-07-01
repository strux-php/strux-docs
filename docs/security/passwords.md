# Password Management

Password management is one of the most security-critical features of any web application. Strux provides secure hashing out of the box and includes a complete password recovery flow — from "forgot password" form to resetting with a new password.

Think of it like losing your house keys:
1. You realize your keys are lost (you forgot your password)
2. You call a locksmith, but they need to verify you are the homeowner first (verify your email)
3. The locksmith gives you a temporary key that only works for one day (reset token)
4. You use the temporary key to get inside and cut a new set of keys (set a new password)
5. The temporary key stops working (token is deleted)

---

## The Complete Password Recovery Flow

Here is exactly what happens from start to finish:

```
FORGOT PASSWORD REQUEST:
       │
User submits their email on the /forgot-password page
       ↓
1. Look up the user by email
       ↓
2. Generate a secure random token (64-character hex string)
       ↓
3. Store the SHA-256 hash of the token + 60-min expiry in the database
       ↓
4. Build the reset URL: /reset-password/{raw-token}
       ↓
5. Send the reset email with the URL
       ↓
6. Show "If an account exists, a reset link has been sent"
       │
       │  (Note: we say "IF an account exists" to prevent email harvesting)
       │
       ▼
PASSWORD RESET:
       │
User clicks the link in their email
       ↓
1. The URL contains the raw token: /reset-password/abc123...
       ↓
2. Hash the token from the URL with SHA-256
       ↓
3. Find the user where password_reset_token matches the hash
       ↓
       ┌─── NOT FOUND ───┐
       │                  │
  "Invalid or expired    │
   reset link"           │
       │                  │
  Redirect to login       │
       │                  │
       └──────────────────┘
       │
       ┌─── FOUND ───┐
       │              │
  Check if expired     │
  (reset_token_        │
  expires_at < now)    │
       │              │
       ┌─── EXPIRED ───┐
       │                │
  "Reset link expired"  │
       │                │
  Redirect to /forgot-  │
  password               │
       │                │
       └────────────────┘
       │
       ┌─── VALID ───┐
       │              │
  Show the reset       │
  password form        │
       │              │
  User submits new     │
  password + confirm   │
       │              │
  Form validates:      │
  min 8 chars,         │
  passwords match      │
       │              │
  Hash the new         │
  password with bcrypt │
       │              │
  Save the user:       │
  - new password hash  │
  - null out token     │
  - null out expiry    │
       │              │
  Fire PasswordReset   │
  event                │
       │              │
  "Password reset      │
   successfully!"      │
       │              │
  Redirect to login    │
       │              │
       └──────────────┘
```

> [!NOTE]
> This entire flow is implemented in the `AuthController`. You do not need to write any of the security logic — just the form templates.

---

## Forgot Password — Requesting a Reset

The "Forgot Password" page lets users request a password reset email.

### The Form

Create a form class for email input:

```php
namespace App\Http\Form\Auth;

use Strux\Component\Form\Attributes\ButtonField;
use Strux\Component\Form\Attributes\EmailField;
use Strux\Component\Form\Form;

class ForgotPasswordForm extends Form
{
    #[EmailField(label: 'Email Address', rules: ['required', 'email'])]
    protected string $email;

    #[ButtonField(label: 'Send Reset Link')]
    protected string $submit;
}
```

### The Controller

```php
#[Route('/forgot-password', methods: ['GET', 'POST'], name: 'auth.forgot_password')]
#[Middleware([GuestMiddleware::class])]
public function forgotPassword(): Response
{
    $form = new ForgotPasswordForm($this->request);

    if ($this->request->is('POST') && $form->isValid()) {
        $email = strtolower($form->get('email'));
        $user = User::where('email', $email)->first();

        // Always show success — don't reveal whether the email exists
        if ($user) {
            // 1. Generate a secure reset token
            $token = bin2hex(random_bytes(32));
            $user->password_reset_token = hash('sha256', $token);
            $user->reset_token_expires_at = new DateTimeImmutable('+60 minutes');
            $user->save();

            // 2. Build the reset URL
            $resetUrl = $this->route('auth.reset_password', ['token' => $token]);

            // 3. Send the email
            try {
                /** @var MailerInterface $mailer */
                $mailer = $this->container->get(MailerInterface::class);
                $mailer->to($email, $user->name ?? 'User')
                    ->send('emails/auth/reset-password', [
                        'resetUrl' => $resetUrl,
                        'user' => $user,
                    ]);
            } catch (Exception $e) {
                $this->logError('Failed to send password reset email', [
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Always show the same message — prevents email enumeration
        $this->flash->set('success',
            'If an account with that email exists, a reset link has been sent.');
        return $this->redirect('/login');
    }

    return $this->view('pages/auth/forgot-password', [
        'title' => 'Forgot Password',
        'form'  => $form
    ]);
}
```

### Security: Why We Say "If an account exists"

Notice that we show the same success message regardless of whether the email exists in our database:

```php
$this->flash->set('success',
    'If an account with that email exists, a reset link has been sent.');
```

This is a deliberate security measure called **email enumeration prevention**. If we showed "Email not found" for unknown emails and "Reset link sent" for known ones, an attacker could use our forgot password page to discover which email addresses are registered on our site.

> [!WARNING]
> Always show the same message regardless of whether the email exists. Never tell an attacker whether an email is registered. This is one of the most common security mistakes in web applications.

---

## Password Reset — Setting a New Password

After the user clicks the link in their email, they are taken to the reset form.

### The Form

```php
namespace App\Http\Form\Auth;

use Strux\Component\Form\Attributes\ButtonField;
use Strux\Component\Form\Attributes\PasswordField;
use Strux\Component\Form\Form;

class ResetPasswordForm extends Form
{
    #[PasswordField(label: 'New Password', rules: ['required', 'minLength[8]'])]
    protected string $password;

    #[PasswordField(label: 'Confirm Password', rules: ['required'])]
    protected string $password_confirmation;

    #[ButtonField(label: 'Reset Password')]
    protected string $submit;

    public function getPassword(): string
    {
        return $this->password;
    }

    public function isValid(): bool
    {
        $isValid = parent::isValid();

        if ($this->password !== $this->password_confirmation) {
            $this->addErrors([
                'password_confirmation' => ['Passwords do not match.']
            ]);
            return false;
        }

        return $isValid;
    }
}
```

### The Controller

```php
#[Route('/reset-password/:token', methods: ['GET', 'POST'], name: 'auth.reset_password')]
#[Middleware([GuestMiddleware::class])]
public function reset(string $token): Response
{
    // 1. Find the user by the hashed token
    $hashedToken = hash('sha256', $token);
    $user = User::where('password_reset_token', $hashedToken)->first();

    // 2. Validate the token exists
    if (!$user || !$user->reset_token_expires_at) {
        $this->flash->set('error',
            'This reset link is invalid or has already been used.');
        return $this->redirect('/login');
    }

    // 3. Validate the token has not expired
    $now = new DateTimeImmutable();
    if ($user->reset_token_expires_at < $now) {
        $this->flash->set('error',
            'This reset link has expired. Please request a new one.');
        return $this->redirect('/forgot-password');
    }

    $form = new ResetPasswordForm($this->request);

    // 4. Process the form submission
    if ($this->request->is('POST') && $form->isValid()) {

        // 5. Hash the new password and clear the token
        $user->setPassword($form->getPassword());
        $user->password_reset_token = null;
        $user->reset_token_expires_at = null;
        $user->save();

        // 6. Fire the PasswordReset event
        $this->event->dispatch(new PasswordReset($user));

        $this->flash->set('success',
            'Your password has been reset successfully. You can now log in.');
        return $this->redirect('/login');
    }

    return $this->view('pages/auth/reset-password', [
        'title' => 'Reset Password',
        'form'  => $form,
        'token' => $token,
    ]);
}
```

### Why We Use `setPassword()`

Always use `$user->setPassword()` instead of directly setting the `$password` property:

```php
// ✅ Correct — automatically hashes with bcrypt
$user->setPassword($form->getPassword());

// ❌ Wrong — stores plain text (or requires manual hashing)
$user->password = $form->getPassword();
```

The `setPassword()` method:
1. Takes the plain text password
2. Hashes it with `password_hash($password, PASSWORD_DEFAULT)` (bcrypt)
3. Stores the hash in `$user->password`

---

## The Reset Email Template

The email template is at `templates/emails/auth/reset-password.html.twig`. It receives two variables:

| Variable | What It Contains |
|---|---|
| `resetUrl` | The full URL to the reset form with the token |
| `user` | The User object |

```twig
<a href="{{ resetUrl }}" class="btn">Reset Password</a>
```

### Full Template

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* ... branded styles ... */
        .btn {
            display: inline-block;
            padding: 14px 32px;
            background: #d4a853;
            color: #0a0a0a;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Art<span>Haus</span></h1>
        </div>
        <div class="body">
            <h2>Reset Your Password</h2>
            <p>Click the button below to choose a new password:</p>
            <p style="text-align: center;">
                <a href="{{ resetUrl }}" class="btn">Reset Password</a>
            </p>
            <p>If you did not request this, please ignore this email.</p>
            <p style="color: #999;">This link will expire in 60 minutes.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 ArtHaus. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

---

## The PasswordReset Event

When a user successfully resets their password, the `PasswordReset` event fires:

```php
$this->event->dispatch(new PasswordReset($user));
```

By default, this event is logged by the `LogAuthenticationAction` listener:

```
[Auth] User Password Reset: ID abc-123 (user@example.com)
```

You can listen to this event to:
- Send a confirmation email: "Your password was changed"
- Notify the user via SMS
- Log the IP address for security audits
- Invalidate all other sessions

---

## Password Security Best Practices

### 1. Password Hashing

Strux uses `password_hash()` with the `PASSWORD_DEFAULT` algorithm, which is currently **bcrypt**. Bcrypt is intentionally slow — it takes about 0.1 seconds to hash a password, which makes brute-force attacks impractical.

```php
// This is what happens inside setPassword():
$this->password = password_hash($password, PASSWORD_DEFAULT);
```

### 2. Minimum Password Length

The `ResetPasswordForm` requires a minimum of 8 characters:

```php
#[PasswordField(label: 'New Password', rules: ['required', 'minLength[8]'])]
```

Consider also:
- Mix of uppercase and lowercase letters
- Include numbers and special characters
- Reject common passwords (password123, qwerty, etc.)

### 3. Token Expiry

Reset tokens expire after 60 minutes:

```php
$user->reset_token_expires_at = new DateTimeImmutable('+60 minutes');
```

This limits the window of opportunity if a reset email falls into the wrong hands.

### 4. Single-Use Tokens

After a successful reset, the token is nulled:

```php
$user->password_reset_token = null;
$user->reset_token_expires_at = null;
```

This means the same link cannot be used twice. If the user needs another reset, they must start the process again.

### 5. Token Hashing

The raw reset token is never stored in the database:

```php
// ✅ Store only the hash
$user->password_reset_token = hash('sha256', $token);

// ❌ Never store the raw token
$user->password_reset_token = $token;
```

If an attacker breaches the database, they cannot use the stored hashes to reset passwords.

---

## Testing the Password Reset Flow

In development with the `log` mail transport:

1. Go to `/forgot-password` and enter your email
2. Open `storage/logs/emails.log`
3. Find the reset email and copy the reset URL
4. Open the URL in your browser
5. Enter a new password and submit
6. Log in with your new password

```log
[2026-06-28 12:34:56] To: user@example.com | Subject: Reset Your Password
<!DOCTYPE html>
...
<a href="http://localhost/reset-password/abc123def456...">Reset Password</a>
...
---
```

> [!TIP]
> The `log` mail transport writes to `storage/logs/emails.log`. In production, switch to SMTP by setting `MAIL_MAILER=smtp` in your `.env` file.

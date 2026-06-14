# Password Management

Managing passwords securely is a critical requirement. Strux provides simple mechanisms for securely hashing passwords before saving them to the database.

## Password Hashing

Behind the scenes, you should use PHP's native, highly-secure `password_hash()` function to encrypt passwords. The framework is designed to verify these native hashes during the authentication process seamlessly.

You should never store plain-text passwords, and you should never use outdated algorithms like `md5()` or `sha1()`.

```php
// Hashing a password (e.g., during registration)
$user->password = password_hash($form->get('password'), PASSWORD_DEFAULT);
$user->save();
```

When the user attempts to log in, the `AuthManager` will automatically use `password_verify()` under the hood to compare their input against the database hash.

## Password Resets

If a user forgets their password, you will typically need to build a Password Reset flow. While Strux provides the database and routing primitives, building the UI and email flow is left to the application developer.

A standard flow looks like this:
1. **User requests a reset:** The user submits their email address via a `ForgotPasswordForm`.
2. **Generate a Token:** You generate a secure, random token and save it to the database alongside the user's ID and an expiration timestamp.
3. **Send an Email:** You email the user a link containing the token: `https://yourapp.com/reset-password?token=XYZ`
4. **Verify the Token:** When the user clicks the link, you look up the token in the database and ensure it hasn't expired.
5. **Update the Password:** The user submits a new password. You hash it using `password_hash()`, update the User model, and delete the token.

> [!TIP]
> Always enforce strong password policies. Require at least 8 characters, and consider implementing checks against common password dictionaries.

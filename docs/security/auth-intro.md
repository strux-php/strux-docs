# Authentication: Introduction

Strux provides a powerful, attribute-based, and PSR-compliant authentication system out of the box. Whether you are building a simple blog or a complex multi-tenant application, the authentication layer is designed to be fully functional immediately, while offering complete flexibility for customization.

## Zero-Configuration Setup

By default, Strux provides everything you need to authenticate users, assign roles, and check permissions without writing a single line of model code. 

The framework ships with three built-in ORM entities:
- `Strux\Auth\Entity\User`
- `Strux\Auth\Entity\Role`
- `Strux\Auth\Entity\Permission`

When you run `php bin/console db:migrate` on a fresh Strux installation, the ORM's Migration Generator automatically detects these framework models and generates the `users`, `roles`, and `permissions` tables in your database, completely wired up with many-to-many relationships.

### What's included in the default User?
The default user model includes standard authentication fields, automatically configured for security:
- `id` (UUID)
- `name` (Reformatted to Title Case)
- `email` (Reformatted to lowercase, Unique)
- `password` (Hidden from serialization)
- `email_verified_at` (Hidden)
- `last_login_at` (Hidden)
- `remember_token`

## The `AuthManager`

The heart of the authentication system is the `AuthManager`. This service acts as the central hub for all authentication activities, from logging in users to resolving role-based redirects.

You can access the `AuthManager` anywhere via Dependency Injection, or use the globally available `auth()` helper function.

```php
// Using the helper
$user = auth()->user();
$isLoggedIn = auth()->check();

// Resolving dynamic redirects based on user roles
$redirectUrl = auth()->resolveRedirectFor($user);
```

## Next Steps

While the zero-configuration setup is great for getting started, most real-world applications will require custom user fields (like `bio`, `avatar`, or `company_id`). 

In the next section, we will cover how to easily create your own custom **User Model** that extends the framework defaults, and how to tell the Auth system to use it.

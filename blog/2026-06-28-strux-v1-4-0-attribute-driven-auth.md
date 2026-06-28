---
slug: strux-v1-4-0-attribute-driven-auth
title: "Strux v1.4.0: Fully Attribute-Driven Auth & Smarter Route Binding"
tags: [releases, changelog]
---

We are thrilled to announce **Strux v1.4.0**! This release completes the transition from config-driven to fully attribute-driven authentication, introduces a brand-new `$this->auth` DX in controllers, adds remember-me support, and brings smarter route model binding with `#[RouteEntity]`.

<!-- truncate -->

## What's New in v1.4.0?

### 🔐 Fully Attribute-Driven Authorization

Authorization is now entirely configuration-free. Instead of mapping policies in an `auth.authorities` config array, attach `#[Policy]` directly on your entity class:

```php
#[Entity(table: 'tickets')]
#[Policy(TicketPolicy::class)]
class Ticket extends Model
{
    // ...
}
```

The `Authorizer` reads this attribute via reflection — no config files, no service registrations, no boilerplate.

### 🎯 Smarter `#[Authorize]`

The `#[Authorize]` attribute now does more with less code. Just place it on your controller or method:

```php
#[Route('/tickets/:ticket')]
#[Authorize]
public function show(Ticket $ticket): Response
```

The framework automatically:
- Derives the ability from the HTTP method + method name (`GET` + `show` → `view`)
- Resolves the resource model from route parameters
- Finds the matching `#[Policy]` on the entity
- Runs the policy check — all in one attribute

### 🧭 `$this->auth` — The New Auth DX

Forget `$this->authManager->sentinel('web')->user()`. Every controller now has a typed `$this->auth` property that proxies both the default sentinel and the `AuthManager`:

```php
// Before
$this->authManager->sentinel('web')->user();
$this->authManager->sentinel('web')->login($user);
$this->authManager->can('update', $ticket);

// After
$this->auth->user();
$this->auth->login($user);
$this->auth->can('update', $ticket);
```

Full IDE autocompletion — `AuthProxy` is a real class, not magic.

### 💤 Remember-Me Support

Session-based authentication now supports persistent "Remember Me" tokens out of the box:

- 30-day default expiry via secure `setcookie()` with httpOnly + SameSite=Lax
- SHA-256 token hashing with rotation on every login
- Automatic re-authentication from cookie on session miss
- Configurable duration, path, domain, secure, and httpOnly flags in `auth.sentinels.web`

Enable it with a single parameter:

```php
$this->auth->authenticate($credentials, remember: true);
$this->auth->login($user, remember: true);
```

### 🧩 `#[RouteEntity]` — Smarter Model Binding

Route model binding now supports custom column mappings, eager loading, and interface-based resolution:

```php
#[Route('/artworks/:slug')]
public function show(
    #[RouteEntity(mapping: ['slug' => 'slug'], with: ['artist', 'categories'])]
    Artwork $artwork
): Response {
    // Found by slug, with relations pre-loaded
}
```

### 🔗 `with()` Alias

The ORM now supports `with()` as a public alias for `include()`. Both are equivalent:

```php
$artworks = Artwork::with('artist', 'categories')->get();
```

---

Upgrade to v1.4.0 via Composer today, and check out the updated [Authentication](/docs/security/auth-intro) and [Controllers](/docs/core/controllers) documentation.

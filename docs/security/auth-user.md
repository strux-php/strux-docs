# The User Model

While the framework provides a functional default User model, almost every application will eventually need to store custom data about its users (e.g., `bio`, `profile_image`, or app-specific relationships like `auctions` or `posts`).

Strux makes this incredibly simple: you just create your own User model and tell the Auth system to use it!

## Creating a Custom User Model

To create a custom user model, you simply create a class in your application's Domain layer (e.g., `src/Domain/Identity/Entity/User.php`) and make it `extend \Strux\Auth\Entity\User`. 

By extending the framework's default model, you automatically inherit all the core authentication fields (`email`, `password`, `remember_token`, etc.) without having to clutter your app's codebase.

```php
<?php

namespace App\Domain\Identity\Entity;

use Strux\Component\Database\Schema\Attributes\Entity;
use Strux\Component\Database\Schema\Attributes\Column;

#[Entity(table: 'users')]
class User extends \Strux\Auth\Entity\User
{
    // Add your custom fields here!
    #[Column]
    public ?string $bio = null;

    #[Column(type: 'boolean')]
    public ?bool $isAdmin = false;
}
```

> [!TIP]
> Notice how we didn't define `$id`, `$email`, or `$password`? They are all safely inherited from the framework!

## Registering Your Custom Model

Once you've created your custom User model, you must tell the Auth system to use it instead of the framework default. 

Open your `src/Config/Auth.php` configuration file and update the `model` property:

```php
    'providers' => [
        'users' => [
            'driver' => 'orm',
            // Update this line to point to your new class!
            'model' => \App\Domain\Identity\Entity\User::class, 
        ],
    ],
```

And that's it! When a user logs in, the Auth system will now instantiate *your* `App\Domain\Identity\Entity\User` class. You can access their custom fields anywhere: `$this->auth->user()->bio` in a controller, or `Auth::user()->bio` globally.

---

## ⚠️ Important: Custom Roles and ORM Relationships

There is one critical architectural detail you must understand when creating a custom User model.

If you create a custom `User` model, but continue to use the framework's default `Role` and `Permission` models, **the database migrations and login system will work perfectly**. 

**However, the ORM relationships on the Role model will break.** 

### Why does this happen?
Strux's ORM uses PHP Attributes to define relationships. The framework's default `Role` model hardcodes its relationship to point to the framework's default User:

```php
// Inside vendor/strux/.../Role.php
#[OwnedByMany(related: \Strux\Auth\Entity\User::class, ...)]
public Collection $users;
```

Because PHP Attributes are statically compiled, we cannot inject your `config('auth.model')` into them dynamically. 

This means if you do `$role->users`, the ORM will eagerly load instances of the *framework's* User class, completely ignoring your custom `App\Domain\Identity\Entity\User` class!

### The Solution

If you intend to traverse relationships backward from Roles to Users (e.g., `$role->users`), and you have a custom User model, **you must also create custom `Roles` and `Permissions` models** in your application to override these relationships.

```php
namespace App\Domain\Identity\Entity;

use Strux\Component\Database\Schema\Attributes\Entity;
use Strux\Component\Database\ORM\Attributes\OwnedByMany;

#[Entity(table: 'roles')]
class Role extends \Strux\Auth\Entity\Role
{
    // Override the relationship to point to YOUR User class!
    #[OwnedByMany(related: User::class)]
    public Collection $users;
    
    #[OwnedByMany(related: Permission::class)]
    public Collection $permissions;
}
```

> [!NOTE]
> If you only traverse from the User down (e.g., `$user->roles`), and never need to call `$role->users`, you do not need to create custom Role models. You can simply define `#[OwnedByMany(related: \Strux\Auth\Entity\Role::class)]` on your custom User class and call it a day!

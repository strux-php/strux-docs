# Roles and Permissions

Strux provides a simple but powerful Role-Based Access Control (RBAC) system deeply integrated into the Authentication framework. 

By mapping Users to Roles, and Roles to Permissions, you can build highly granular access controls for your application.

## Role-Based Redirects

One of the most common tasks in web applications is redirecting users to different dashboards or pages based on their role after they log in. 

Instead of cluttering your Controllers with hardcoded `if ($user->isAdmin())` statements, Strux handles this elegantly via Configuration.

### The Redirect Map
Open your `src/Config/Auth.php` file. Inside the `defaults` array, you will find a `redirect_map` property. This map allows you to specify a URL path for any specific role slug.

```php
    'defaults' => [
        'guard' => 'web',
        'passwords' => 'users',
        // The default route if a user has no specific role mapped
        'redirect_to' => '/',
        
        // Define route paths for specific role slugs
        'redirect_map' => [
            'admin' => '/dashboard/admin',
            'artist' => '/dashboard/studio',
            'collector' => '/dashboard/collection'
        ],
    ],
```

### Resolving the Redirect
When you need to send a user to their designated homepage (for example, at the end of your `LoginController`), simply ask the `AuthManager` to resolve the URL for you:

```php
// In your controller...
$user = $this->auth->user();

// The AuthManager will automatically check the user's roles against the 
// redirect_map in your config, and return the correct URL!
$redirectUrl = $this->auth->redirectFor($user);

return $this->redirect($redirectUrl);
```

## Assigning Roles

Roles and Permissions are connected via standard Many-To-Many ORM relationships. 

When you want to assign a role to a user (for example, during Registration), you can query the Role by its slug, and then use the `attach()` method on the relationship query builder to link them in the database:

```php
use App\Domain\Identity\Entity\User;
use App\Domain\Identity\Entity\Roles;

$user = User::where('email', 'artist@example.com')->first();
$role = Roles::where('slug', 'artist')->first();

// Use attach() and pass an array of Role IDs
if ($role) {
    $user->roles()->attach([$role->id]);
}
```

> [!TIP]
> The `attach()` method automatically handles creating the pivot table entries for you, so you don't need to write manual SQL insert statements for your `roles_users` table!

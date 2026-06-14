# User Registration (Sign Up)

Registering a new user involves capturing their details, securely hashing their password, and saving them to the database using the ORM.

## The Registration Flow

Unlike Login, the registration process does not happen inside the `AuthManager`. Instead, you use standard ORM operations to create the user, attach any roles, and then you may optionally log them in immediately afterward.

### Example Registration Controller

Here is a complete, production-ready example of how to implement a registration route using Strux's Routing Attributes, Form Validation, and ORM:

```php
namespace App\Http\Controllers\Web;

use App\Domain\Identity\Entity\User;
use App\Domain\Identity\Entity\Roles;
use App\Http\Form\Auth\RegisterForm;
use Exception;
use Strux\Auth\Middleware\GuestMiddleware;
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
        // 1. Initialize the Form object to handle validation
        $form = new RegisterForm($this->request);

        // 2. Process POST requests
        if ($this->request->is('POST') && $form->isValid()) {
            $email = strtolower($form->get('email'));
            
            // 3. Ensure the email isn't already taken
            if (User::where('email', $email)->exists()) {
                $this->flash->set('error', 'A user with this email already exists.');
                // Re-render view with errors...
            }

            // 4. Create the User
            $user = new User();
            $user->firstname = ucfirst($form->get('firstname'));
            $user->lastname = ucfirst($form->get('lastname'));
            $user->email = $email;
            
            // Secure the password using PHP's native password_hash!
            $user->password = password_hash($form->get('password'), PASSWORD_DEFAULT);

            try {
                // 5. Save the user to the database
                if ($user->save()) {
                    
                    // 6. Assign a default Role
                    $roleSlug = $form->get('role') === 'artist' ? 'artist' : 'collector';
                    $role = Roles::where('slug', $roleSlug)->first();
                    
                    if ($role) {
                        // Use the attach() method for Many-to-Many relationships
                        $user->roles()->attach([$role->id]);
                    }

                    // 7. Automatically log them in
                    $this->authManager->sentinel('web')->login($user);

                    // 8. Redirect to their new dashboard
                    $this->flash->set('success', 'Account created successfully. Welcome aboard!');
                    return $this->redirect('/');
                }

                $form->addErrors($user->getErrors());
                $this->flash->set('error', 'An error occurred while creating your account.');
            } catch (Exception $e) {
                $this->flash->set('error', 'An error occurred: ' . $e->getMessage());
            }
        }

        // 9. Render the View for GET requests
        return $this->view('pages/auth/auth', [
            'title' => 'Register',
            'registerForm' => $form
        ]);
    }
}
```

> [!WARNING]
> Never store plain-text passwords in your database! Always use `password_hash($password, PASSWORD_DEFAULT)` to ensure your application remains secure against data breaches.

## Relationship Attachments
Notice the use of `$user->roles()->attach([$role->id])`. 

When working with Many-To-Many relationships in the Strux ORM, you can use the `attach()` method to easily link a record in the pivot table without manually writing SQL.

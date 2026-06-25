---
title: Controllers
slug: /controllers
sidebar_position: 2
description: Handling HTTP requests using Web and API Controllers.
---

# Controllers: The Brain of Your Application

Imagine you are at a restaurant. You (the user) give your order to the waiter. The waiter takes it to the kitchen, tells the chefs what to cook, and then brings your food back to you.

In this analogy:

- **The Route** is the menu — it tells you which waiter to talk to for which dish.
- **The Controller** is the waiter — it takes your request, decides what to do with it, and brings back a response.
- **The Model / Service** is the kitchen chef — it does the actual work (cooking / database work).
- **The Response** is your food — what you actually receive at the end.

> [!NOTE]
> Controllers do NOT contain complex business logic. They are the middleman. The real logic lives in Models, Services, and Repositories. Think of controllers as the "traffic cop" — they direct incoming requests to the right place and send the response back.

---

## 1. What Does a Controller Do?

Every time someone visits a page on your website or calls an API endpoint, here is what happens:

```
1. User types URL → https://yourapp.com/artworks
2. Router matches URL to a route → "This goes to ArtworkController::index()"
3. Middleware runs → "Is the user logged in?"
4. Controller method runs → "Fetch all artworks from the database"
5. Response is returned → "Here is the HTML page with all artworks"
```

The controller is the **middleman** in every single request. It:

- Receives information from the user (via the `Request` object)
- Decides what action to take (call a model, run some logic)
- Returns a result (an HTML page, JSON data, or a redirect)

> [!TIP]
> A good controller method should be short — ideally 5 to 15 lines of code. If a method is longer than that, the extra logic probably belongs in a Service or a Model.

---

## 2. Web vs API Controllers

Strux provides **two types** of controllers for two different jobs:

| Type | Base Class | Purpose | Typical Response |
|------|-----------|---------|-----------------|
| **Web Controller** | `Strux\Component\Http\Controller\Web\Controller` | HTML websites, forms, user sessions | `$this->view(...)`, `$this->redirect(...)` |
| **API Controller** | `Strux\Component\Http\Controller\Api\Controller` | JSON APIs, mobile apps, SPA backends | `$this->json(...)`, `$this->Ok(...)`, `$this->NotFound(...)` |

> [!INFO]
> API Controller extends Web Controller, so an API controller can use all web controller features too. But the reverse is not true — a web controller cannot use API-specific methods like `$this->Ok()`.

### Web Controller Example

A web controller renders HTML pages. Think of it as the brain behind every page on your website:

```php
#[Prefix('/artworks')]
#[Middleware([AuthorizationMiddleware::class])]
class ArtworkController extends Controller
{
    #[Route('', methods: ['GET'], name: 'artworks.index')]
    public function index(Request $request): Response
    {
        $artworks = Artwork::all();
        return $this->view('artworks/index', ['artworks' => $artworks]);
    }

    #[Route('/create', methods: ['GET'], name: 'artworks.create')]
    public function create(): Response
    {
        return $this->view('artworks/create');
    }

    #[Route('', methods: ['POST'], name: 'artworks.store')]
    public function store(Request $request): Response
    {
        $artwork = new Artwork();
        $artwork->title = $request->input('title');
        $artwork->save();

        $this->flash->success('Artwork created!');
        return $this->redirect('/artworks');
    }
}
```

### API Controller Example

An API controller returns JSON data. Think of it as the brain behind a mobile app or a single-page application:

```php
#[ApiController]
#[Prefix('/api/artworks')]
#[Consumes('application/json')]
#[Produces('application/json')]
class ArtworkApiController extends Controller
{
    #[ApiRoute('', methods: ['GET'], name: 'api.artworks.index')]
    public function index(): ApiResponse
    {
        $artworks = Artwork::all();
        return $this->Ok($artworks);
    }

    #[ApiRoute('', methods: ['POST'], name: 'api.artworks.store')]
    public function store(#[RequestBody] ArtworkCreateRequest $request): ApiResponse
    {
        $artwork = new Artwork();
        $artwork->title = $request->title;
        $artwork->save();

        return $this->Created($artwork, 'Artwork created successfully.');
    }
}
```

---

## 3. Creating a Controller

### Using the CLI

The fastest way to create a controller is the `new:controller` command:

```bash
# Web controller (default)
php bin/console new:controller Artwork

# API controller
php bin/console new:controller Artwork --type=api

# Short alias
php bin/console g:c Artwork
php bin/console g:c Artwork --type=api
```

**What gets generated:**

**Web controller** (`src/Http/Controllers/Web/ArtworkController.php`):
```php
#[Prefix('/artworks')]
class ArtworkController extends Controller
{
    #[Route('/', methods: ['GET'], name: 'artworks.index')]
    public function index(): Response
    {
        return $this->view('index', ['title' => 'Artwork']);
    }
}
```

**API controller** (`src/Http/Controllers/Api/ArtworkController.php`):
```php
#[ApiController]
#[Prefix('/api/artworks')]
#[Produces('application/json')]
#[Consumes('application/json')]
class ArtworkController extends Controller
{
    #[ApiRoute('/', methods: ['GET'], name: 'api.artworks.index')]
    public function index(): ApiResponse
    {
        return $this->json(['message' => 'Welcome to Artwork']);
    }
}
```

### Creating Manually

A controller is just a PHP class that extends `Controller`:

```php
use Strux\Component\Http\Controller\Web\Controller;
use Strux\Component\Http\Response;
use Strux\Component\Routing\Attribute\Route;

#[Prefix('/products')]
class ProductController extends Controller
{
    #[Route('', methods: ['GET'], name: 'products.index')]
    public function index(): Response
    {
        $products = Product::all();
        return $this->view('products/index', ['products' => $products]);
    }
}
```

> [!WARNING]
> Your controller file must be inside the `src/Http/Controllers/` directory for the framework to auto-discover it. If you place it elsewhere, you will need to manually register its routes.

---

## 4. The Three Levels of Controllers

The controller system has a three-level hierarchy. Each level adds more features on top of the previous one:

### Level 1: `BaseController` (The Foundation)

The root class that provides:

- **11 optional dependencies** via constructor injection (container, request, response factory, PDO, session, logger, view engine, event dispatcher, flash messages, auth manager, form factory)
- **Response helpers**: `createResponse()`, `json()`, `redirect()`, `redirectWith()`
- **View helper**: `view()` for rendering templates
- **Auth helper**: `auth()` for authentication
- **Logging helpers**: `logError()`, `logWarning()`, `logInfo()`
- **Routing helper**: `route()` for generating URLs, `toRoute()` for redirecting to named routes
- **Authorization helper**: `authorize()` for permission checks

### Level 2: `Web\Controller` (Web Features)

Extends `BaseController` and adds:

- **Magic model loading**: Access models as properties — `$this->product`, `$this->user`, etc.
- **Automatic model name inference**: `ProductController` automatically maps to `App\Models\Product`

### Level 3: `Api\Controller` (API Features)

Extends `Web\Controller` and adds:

- **API response helpers**: `Ok()`, `Created()`, `NoContent()`, `BadRequest()`, `Unauthorized()`, `Forbidden()`, `NotFound()`, `UnprocessableEntity()`
- Returns `ApiResponse` objects that wrap data in a JSON envelope

> [!TIP]
> You rarely need to use `BaseController` directly. Use `Web\Controller` for websites and `Api\Controller` for APIs. They already include everything you need.

---

## 5. Attribute-Based Routing

In Strux, routes are defined using **PHP 8 Attributes** directly in your controller class. This means the route information lives right next to the code that handles it — you do not need to open a separate routes file.

> [!NOTE]
> If you prefer keeping routes in a separate file, that is also supported. You can define routes manually in your route files using the Router class. See the [Routing documentation](/docs/routing/basic) for details.

### `#[Prefix]` — URL Prefix for the Entire Controller

```php
#[Prefix('/admin')]
class AdminController extends Controller
{
    // All routes in this controller start with /admin
}
```

### `#[Route]` — Define a Web Route

```php
#[Route('/users', methods: ['GET'], name: 'users.index')]
public function index(): Response
{
    // Handles GET /users
}
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `path` | Yes | The URL path (e.g., `/users`, `/users/:id`) |
| `methods` | Yes | Allowed HTTP methods: `['GET']`, `['POST']`, `['GET', 'POST']` |
| `name` | No | A unique name for the route (used for URL generation) |

### `#[ApiRoute]` — Define an API Route

Same as `#[Route]` but for API endpoints:

```php
#[ApiRoute('/users', methods: ['GET'], name: 'api.users.index')]
public function index(): ApiResponse
{
    return $this->Ok(User::all());
}
```

### Route Parameters

URLs can have dynamic parts — called **route parameters**:

```php
#[Route('/users/:id', methods: ['GET'], name: 'users.show')]
public function show(int $id): Response
{
    $user = User::find($id);

    if (!$user) {
        return $this->redirect('/users');
    }

    return $this->view('users/show', ['user' => $user]);
}
```

The parameter name in the URL (`:id`) must match the parameter name in the method (`$id`). The framework automatically extracts the value from the URL and passes it to your method.

**Parameter type validation:**

| Type | Example | Matches |
|------|---------|---------|
| `:id` (int) | `/users/:id` | `/users/42` ✅, `/users/abc` ❌ |
| `string:slug` | `/blog/:slug` | `/blog/my-first-post` ✅ |
| `string:alpha` | `/country/:alpha` | `/users/France` ✅, `/users/France123` ❌ |
| `string:alnum` | `/code/:alnum` | `/code/ABC123` ✅ |
| `int:id` | `/product/int:id` | `/product/5` ✅ |

```php
// The framework validates types automatically
#[Route('/products/int:id')]
public function show(int $id): Response {}  // Only matches numeric IDs

#[Route('/blog/string:slug')]
public function show(string $slug): Response {}  // Matches any slug
```

> [!TIP]
> Use the colon syntax (`:id`) for route parameters, not the curly brace syntax (`{id}`). The colon syntax is the modern recommended format.

### Optional Parameters

Sometimes a parameter might not be there. For example, a blog category page might show all posts, or only posts in a specific category:

```php
#[Route('/blog/:category/page/int:page|?', methods: ['GET'], name: 'blog.category')]
public function byCategory(string $category, ?int $page = 1): Response
{
    // If page is not provided, it defaults to 1
    // URL: /blog/tech/page/3 → category='tech', page=3
    // URL: /blog/tech/page  → category='tech', page=1
}
```

The `|?` at the end marks the parameter as optional. The method parameter must have a default value (`= 1`).

### Named Routes

Giving a route a name lets you refer to it without hard-coding URLs:

```php
#[Route('/users/:id', methods: ['GET'], name: 'users.show')]
public function show(int $id): Response { ... }
```

Now you can generate URLs for this route anywhere:

```php
// In a controller
$url = $this->route('users.show', ['id' => 5]);
// Result: /users/5

$response = $this->toRoute('users.show', ['id' => 5]);
// Redirects to /users/5

// In a view template
<a href="<?= route('users.show', ['id' => $user->id]) ?>">View</a>
```

> [!TIP]
> Naming your routes is optional but highly recommended. If you ever change the URL path in the `#[Route]` attribute, all references to the named route will automatically use the new path.

---

## 6. The `#[ApiController]` Attribute

API controllers use a special marker attribute:

```php
#[ApiController]
class ArtworkController extends Controller
{
    // This controller is optimized for API use
}
```

The `#[ApiController]` attribute tells the framework:

- Only `ApiRoute` attributes are scanned (regular `#[Route]` attributes are ignored in API controllers)
- JSON error responses are preferred over HTML error pages

> [!NOTE]
> `#[ApiController]` is optional. You can use `ApiRoute` without it and still get JSON responses. The attribute simply restricts the controller to only handle API routes.

---

## 7. Content Negotiation Attributes

These attributes tell the API client what format you expect and what format you will return:

### `#[Consumes]`

Tells the framework what content type your controller expects to receive:

```php
#[Consumes('application/json')]
class ArtworkController extends Controller
{
    // This controller only accepts JSON input
}
```

### `#[Produces]`

Tells the framework what content type your controller will return:

```php
#[Produces('application/json')]
class ArtworkController extends Controller
{
    // This controller only returns JSON responses
}
```

> [!INFO]
> Content negotiation is optional. If you do not specify `#[Consumes]` or `#[Produces]`, the framework will accept and return any content type.

---

## 8. Available Properties in Controllers

Every controller has access to a set of built-in helper properties. The framework automatically provides them — you do not need to create them.

### Accessing the Current Request

```php
// Via the property
$email = $this->request->input('email');

// Or by injecting it in the method parameter
public function store(Request $request): Response
{
    $email = $request->input('email');
}
```

### Full Property Reference

| Property | Type | Description |
|----------|------|-------------|
| `$this->request` | `Request` | The current HTTP request |
| `$this->auth` | `AuthManager` | Authentication manager (login, register, user info) |
| `$this->session` | `SessionInterface` | Session data and management |
| `$this->flash` | `FlashInterface` | Flash messages (one-time notifications) |
| `$this->db` | `PDO` | Direct database connection |
| `$this->logger` | `LoggerInterface` | Logging messages to files |
| `$this->view` | `ViewInterface` | Template rendering engine |
| `$this->event` | `EventDispatcherInterface` | Dispatching events |
| `$this->forms` | `FormFactory` | Creating and handling forms |
| `$this->container` | `ContainerInterface` | The dependency injection container |

```php
class UserController extends Controller
{
    public function profile(): Response
    {
        // Access everything you need
        $user = $this->auth->user();
        $notifications = $this->session->get('notifications', []);
        $this->logger->info('User viewed profile', ['userId' => $user->id]);

        return $this->view('users/profile', [
            'user' => $user,
            'notifications' => $notifications,
        ]);
    }
}
```

> [!WARNING]
> The `$this->request` property and other helper properties are resolved lazily — they are only created when you first access them. This means there is no performance cost if you do not use them.

---

## 9. Response Helpers

Controllers can return different types of responses. Here is every way to send a response:

### View Responses (HTML Pages)

```php
// Render a template with data
return $this->view('users/index', ['users' => $users]);

// Render a template without data
return $this->view('home/index');
```

The first parameter is the template path (without the file extension). The second parameter is an array of data that will be available in the template.

### JSON Responses (API Data)

```php
// Simple JSON response
return $this->json(['status' => 'success', 'user' => $user]);

// JSON with custom status code
return $this->json(['error' => 'Not found'], 404);
```

### Redirect Responses (Send User to Another Page)

```php
// Simple redirect
return $this->redirect('/login');

// Redirect with a status code (301 = permanent, 302 = temporary)
return $this->redirect('/new-url', 301);

// Redirect to a named route
return $this->toRoute('users.show', ['id' => $user->id]);
```

### Redirect with Flash Messages

Flash messages are one-time notifications that appear on the next page load:

```php
// Set a success message and redirect
$this->flash->success('Profile updated!');
return $this->redirect('/profile');

// Shorthand: redirect with flash messages
return $this->redirectWith('/profile', [
    'success' => 'Profile updated!',
    'info' => 'Your changes have been saved.',
]);

// Using named routes with flash messages
return $this->toRoute('users.show', ['id' => $user->id], [
    'success' => 'User created!',
]);
```

### API Response Helpers

API controllers have dedicated response methods:

```php
// 200 OK
return $this->Ok($data);                    // { "success": true, "data": ..., "message": "Success" }
return $this->Ok($data, 'Custom message');  // { "success": true, "data": ..., "message": "Custom message" }

// 201 Created
return $this->Created($data);              // { "success": true, "data": ..., "message": "Resource created successfully" }

// 204 No Content
return $this->NoContent();                 // Empty response with 204 status

// 400 Bad Request
return $this->BadRequest('Invalid input'); // { "success": false, "message": "Invalid input", "errors": ... }

// 401 Unauthorized
return $this->Unauthorized('Login required');

// 403 Forbidden
return $this->Forbidden('Access denied');

// 404 Not Found
return $this->NotFound('Resource not found');

// 422 Unprocessable Entity (validation errors)
return $this->UnprocessableEntity($errors);
```

Each API response returns a JSON envelope:

```json
{
    "success": true,
    "message": "Artwork created successfully.",
    "data": { "id": 1, "title": "Starry Night" },
    "errors": null
}
```

> [!TIP]
> The API response envelope makes it easy for mobile apps and frontend frameworks to parse responses consistently. Every response has the same structure — only the content changes.

### Raw Response

For full control, create a `Response` object directly:

```php
return new Response('Hello World', 200);
return new Response(json_encode($data), 200, ['Content-Type' => 'application/json']);
```

---

## 10. Dependency Injection in Controllers

Strux uses **dependency injection** to provide your controllers with the services they need. Instead of creating objects manually, you just declare what you need and the framework provides it.

### Constructor Injection

Dependencies declared in the constructor are automatically provided by the container:

```php
use App\Domain\Catalog\Repository\ArtworkRepositoryInterface;

class ArtworkController extends Controller
{
    public function __construct(
        private readonly ArtworkRepositoryInterface $artworkRepo,
        private readonly LoggerInterface $logger,
    ) {
        parent::__construct();
    }

    #[Route('', methods: ['GET'], name: 'artworks.index')]
    public function index(): Response
    {
        $this->logger->info('Listing artworks');
        $artworks = $this->artworkRepo->listRecent(20);

        return $this->view('artworks/index', ['artworks' => $artworks]);
    }
}
```

> [!IMPORTANT]
> When you define a constructor in a controller, you MUST call `parent::__construct()`. This ensures the base controller's dependencies are also resolved.

### Method Injection

You can also inject dependencies directly into a method:

```php
use Psr\Log\LoggerInterface;

#[Route('/dashboard', methods: ['GET'], name: 'dashboard.index')]
public function index(LoggerInterface $logger, Request $request): Response
{
    $logger->info('Dashboard accessed');
    $userId = $request->getAttribute('userId');

    return $this->view('dashboard/index');
}
```

The framework resolves method parameters by type-hint. If a parameter is an interface or class that the container knows about, it will be injected automatically.

---

## 11. Making Responses Lazy

> [!INFO]
> This is an advanced optimization technique. Most applications do not need it.

Responses can be made **lazy** — meaning the response body is not computed until it is actually sent to the client. This is done by wrapping a callable (a function or closure) in a `LazyResponse`:

```php
use Strux\Component\Http\LazyResponse;

#[Route('/heavy-report', methods: ['GET'])]
public function heavyReport(): Response
{
    return new LazyResponse(function () {
        // This code does NOT run until the response is actually sent.
        // The controller returns immediately, freeing up PHP to handle
        // the next request while the response is "streaming."

        sleep(5); // Simulate a slow database query
        $data = $this->generateReport();
        return $this->view('reports/index', ['data' => $data]);
    });
}
```

**When would you use this?**

- Generating PDF reports that take a long time
- Processing large datasets that take seconds to compute
- Streaming responses to the browser chunk by chunk

> [!CAUTION]
> Lazy responses are not suitable for all situations. If you need to validate input or check permissions before doing work, do that BEFORE returning the `LazyResponse`. Do NOT put validation inside the lazy callback.

---

## 12. Middleware on Controllers

Middleware is code that runs **before** or **after** your controller method. Think of it as security guards that check things before letting the request through.

> [!NOTE]
> For a complete guide on creating middleware, see the [Middleware](/docs/middleware) documentation.

### Class-Level Middleware

Applies to every method in the controller:

```php
use Strux\Component\Http\Middleware\AuthorizationMiddleware;

#[Prefix('/dashboard')]
#[Middleware([AuthorizationMiddleware::class])]
class DashboardController extends Controller
{
    // ALL methods in this controller require authorization
}
```

### Method-Level Middleware

Applies only to a specific method:

```php
use Strux\Component\Http\Middleware\GuestMiddleware;

class AuthController extends Controller
{
    #[Route('/login', methods: ['GET', 'POST'], name: 'auth.login')]
    #[Middleware([GuestMiddleware::class])] // Only accessible to guests
    public function login(): Response { ... }

    #[Route('/logout', methods: ['POST'], name: 'auth.logout')]
    #[Middleware([AuthorizationMiddleware::class])] // Only accessible to logged-in users
    public function logout(): Response { ... }
}
```

### Multiple Middleware

You can apply multiple middleware at once:

```php
#[Middleware([
    AuthorizationMiddleware::class,
    RateLimitMiddleware::class,
    LoggingMiddleware::class,
])]
class AdminController extends Controller
{
    // All three middleware run before any method
}
```

---

## 13. Authorization with `#[Authorize]]

The `#[Authorize]` attribute controls who can access a controller or method based on roles and permissions:

> [!NOTE]
> For a complete guide on authentication and authorization, see the [Auth documentation](/docs/security/auth-intro).

```php
use Strux\Component\Http\Attribute\Authorize;

#[Prefix('/admin')]
#[Authorize(roles: ['admin'])]
class AdminController extends Controller
{
    // Only users with the 'admin' role can access any method

    #[Route('/reports', methods: ['GET'])]
    #[Authorize(permissions: ['view_reports'])]
    public function reports(): Response
    {
        // Requires BOTH admin role AND 'view_reports' permission
    }
}
```

> [!WARNING]
> `#[Authorize]` and `#[Middleware]` are two different things. Middleware runs code before the controller. Authorization checks a user's permissions. You typically use both together.

---

## 14. Request Handling

### Getting Input from the User

The `Request` object gives you access to everything the user sent:

```php
#[Route('/contact', methods: ['POST'], name: 'contact.store')]
public function store(Request $request): Response
{
    // Form input (POST data)
    $name = $request->input('name');
    $email = $request->input('email');
    $message = $request->input('message', 'No message'); // With default

    // Query string parameters (GET data)
    $page = $request->query('page', 1);

    // Get all input as an array
    $allData = $request->all();

    // Get only specific fields
    $filtered = $request->only(['name', 'email']);

    // Check if a field exists
    if ($request->has('subscribe')) {
        // Add to newsletter
    }

    return $this->redirect('/contact/success');
}
```

### Request DTOs with `#[RequestBody]`

For complex API requests, instead of manually extracting fields, you can define a **Request DTO** (Data Transfer Object) — a class that represents the expected request body:

```php
use Strux\Component\Http\Attribute\RequestBody;

class TicketCreateRequest
{
    public string $subject;
    public string $description;
    public ?string $priority = 'normal';
}

class TicketController extends Controller
{
    #[ApiRoute('', methods: ['POST'], name: 'api.tickets.store')]
    public function store(#[RequestBody] TicketCreateRequest $request): ApiResponse
    {
        // The framework automatically:
        // 1. Reads the JSON body
        // 2. Maps it to the TicketCreateRequest object
        // 3. Validates the data (if validation rules are defined)
        // 4. Passes the populated object to your method

        $ticket = new Ticket();
        $ticket->subject = $request->subject;
        $ticket->description = $request->description;
        $ticket->save();

        return $this->Created($ticket, 'Ticket created.');
    }
}
```

> [!TIP]
> Request DTOs are especially useful when a request has many fields. Instead of calling `$request->input('field')` ten times, you get a fully populated object with one parameter.

### Request Query DTOs with `#[RequestQuery]`

Similar to `#[RequestBody]`, but reads from query string parameters instead of the JSON body:

```php
use Strux\Component\Http\Attribute\RequestQuery;

class ArtworkFilterRequest
{
    public ?string $category;
    public ?string $status;
    public int $page = 1;
    public int $perPage = 20;
}

class ArtworkController extends Controller
{
    #[ApiRoute('', methods: ['GET'], name: 'api.artworks.index')]
    public function index(#[RequestQuery] ArtworkFilterRequest $filter): ApiResponse
    {
        // URL: /api/artworks?category=painting&page=2
        // $filter->category = 'painting'
        // $filter->page = 2
        // $filter->perPage = 20 (default)

        $query = Artwork::query();

        if ($filter->category) {
            $query->where('category', $filter->category);
        }

        $artworks = $query->paginate($filter->perPage);

        return $this->Ok($artworks);
    }
}
```

### File Uploads

```php
#[Route('/artworks', methods: ['POST'], name: 'artworks.store')]
public function store(Request $request): Response
{
    if ($request->hasFile('image')) {
        $file = $request->file('image');

        // Move to a directory
        $path = $file->moveTo('uploads/artworks');

        // Or get the contents
        $contents = $file->getContents();

        // Store with a new name
        $path = $file->storeAs('uploads/artworks', 'artwork_' . time() . '.jpg');
    }

    return $this->redirect('/artworks');
}
```

---

## 15. Magic Model Loading

Web controllers have a special feature: you can access models as if they are properties. The controller automatically figures out which model class you want based on the property name:

```php
class ArtworkController extends Controller
{
    #[Route('/artworks/:id', methods: ['GET'], name: 'artworks.show')]
    public function show(int $id): Response
    {
        // $this->artwork automatically loads App\Models\Artwork
        $artwork = $this->artwork->find($id);

        // The first time you access $this->artwork, it creates the model
        // Subsequent accesses reuse the same instance

        return $this->view('artworks/show', ['artwork' => $artwork]);
    }

    #[Route('/artworks', methods: ['GET'], name: 'artworks.index')]
    public function index(): Response
    {
        // You can query directly through the magic property
        $paintings = $this->artwork->where('category', 'painting')->get();

        return $this->view('artworks/index', ['artworks' => $paintings]);
    }
}
```

**How it works:**

| Controller Name | Magic Property | Resolved Model Class |
|-----------------|---------------|---------------------|
| `ArtworkController` | `$this->artwork` | `App\Models\Artwork` |
| `UserController` | `$this->user` | `App\Models\User` |
| `ProductController` | `$this->product` | `App\Models\Product` |
| `OrderController` | `$this->order` | `App\Models\Order` |

The framework takes the controller name, removes "Controller", converts it to lowercase, and looks for a matching model class. If the model does not exist, an exception is thrown.

> [!TIP]
> Magic model loading is entirely optional. You can always inject models directly or use `Model::find()` statically. Use whichever style makes your code more readable.

---

## 16. Response Caching with `#[Cache]`

You can cache API responses so that repeated requests do not need to hit the database:

```php
use Strux\Component\Http\Attribute\Cache;

class ProductController extends Controller
{
    #[ApiRoute('/int:id', methods: ['GET'], name: 'api.products.show')]
    #[Cache(ttl: 60)]
    public function show(int $id): ApiResponse
    {
        // This response is cached for 60 seconds
        // Subsequent requests within 60 seconds get the cached response
        // without executing this method

        $product = Product::find($id);

        if (!$product) {
            return $this->NotFound('Product not found.');
        }

        return $this->Ok($product);
    }
}
```

> [!WARNING]
> Caching is only for API responses (`ApiResponse`). Web controller responses (HTML pages) are not cached using this attribute.

---

## 17. Custom Response Status and Headers

### `#[ResponseStatus]`

Set the HTTP status code for a response:

```php
use Strux\Component\Http\Attribute\ResponseStatus;

#[ApiRoute('', methods: ['POST'], name: 'api.products.store')]
#[ResponseStatus(201)]
public function store(#[RequestBody] ProductCreateRequest $request): ApiResponse
{
    // All successful responses from this method will have status 201
}
```

### `#[ResponseHeader]`

Add custom headers to the response:

```php
use Strux\Component\Http\Attribute\ResponseHeader;

#[ApiRoute('/int:id', methods: ['GET'], name: 'api.artworks.show')]
#[ResponseHeader('X-App-Version', '1.5.0')]
#[ResponseHeader('X-RateLimit-Remaining', '99')]
public function show(int $id): ApiResponse
{
    // Response will include both custom headers
}
```

---

## 18. Logging in Controllers

Every controller has built-in logging helpers:

```php
class OrderController extends Controller
{
    #[Route('/orders/:id/cancel', methods: ['POST'], name: 'orders.cancel')]
    public function cancel(int $id): Response
    {
        $order = Order::find($id);

        if (!$order) {
            $this->logWarning('Attempted to cancel non-existent order', ['id' => $id]);
            return $this->redirect('/orders');
        }

        $order->status = 'cancelled';
        $order->save();

        $this->logInfo('Order cancelled', ['orderId' => $order->id, 'userId' => $this->auth->id()]);

        $this->flash->success('Order cancelled.');
        return $this->redirect('/orders');
    }
}
```

Available logging methods:
- `$this->logError($message, $context)` — For errors
- `$this->logWarning($message, $context)` — For warnings
- `$this->logInfo($message, $context)` — For general information

The `$context` parameter is an optional array of additional data to include in the log.

---

## 19. Validation in Controllers

> [!NOTE]
> For a complete guide on validation, see the [Validation documentation](/docs/orm/validation).

### Manual Validation

```php
use Strux\Component\Validator\Validator;
use Strux\Component\Validator\Rules\Required;
use Strux\Component\Validator\Rules\Email;

class AuthController extends Controller
{
    #[ApiRoute('/register', methods: ['POST'], name: 'api.auth.register')]
    public function register(Request $request): ApiResponse
    {
        $validator = new Validator($request->all());
        $validator->add('email', [new Required(), new Email()]);
        $validator->add('password', [new Required()]);

        if (!$validator->isValid()) {
            return $this->UnprocessableEntity($validator->getErrors());
        }

        // Process registration...
        return $this->Created($user, 'User registered.');
    }
}
```

### Model Validation (Automatic)

If your model defines validation rules (see [ORM Validation](/docs/orm/validation)), they run automatically when you call `save()`:

```php
class ArtworkController extends Controller
{
    #[Route('/artworks', methods: ['POST'], name: 'artworks.store')]
    public function store(Request $request): Response
    {
        $artwork = new Artwork($request->only(['title', 'description', 'price']));

        if (!$artwork->save()) {
            // Validation failed
            $this->flash->error('Please fix the errors.');
            return $this->redirectWith('/artworks/create', [
                'errors' => $artwork->getErrors(),
                'old' => $request->all(),
            ]);
        }

        $this->flash->success('Artwork created!');
        return $this->redirect('/artworks');
    }
}
```

---

## 20. Invokable Controllers

For simple, single-purpose endpoints, you can use an **invokable controller** — a controller with just one `__invoke()` method:

```php
class ContactFormController extends Controller
{
    public function __invoke(Request $request): Response
    {
        if ($request->method() === 'GET') {
            return $this->view('contact/form');
        }

        // Handle form submission
        $name = $request->input('name');
        $email = $request->input('email');

        // Send email, save to database, etc.

        $this->flash->success('Message sent!');
        return $this->redirect('/contact/thanks');
    }
}
```

Then in your routes:

```php
$router->get('/contact', ContactFormController::class);
$router->post('/contact', ContactFormController::class);
```

Or using attributes:

```php
#[Route('/contact', methods: ['GET', 'POST'])]
class ContactFormController extends Controller
{
    public function __invoke(): Response
    {
        // Handles both GET and POST
    }
}
```

> [!TIP]
> Invokable controllers are best for simple endpoints like contact forms, newsletter signups, or webhook handlers — anything that does not need multiple methods.

---

## 21. Large Web Controller Example

Here is a realistic controller showing many features working together:

```php
<?php

namespace App\Http\Controllers\Web;

use App\Domain\Catalog\Repository\ArtworkRepositoryInterface;
use Psr\Log\LoggerInterface;
use Strux\Component\Http\Attribute\Authorize;
use Strux\Component\Http\Controller\Web\Controller;
use Strux\Component\Http\Middleware\AuthorizationMiddleware;
use Strux\Component\Http\Response;
use Strux\Component\Routing\Attribute\Middleware;
use Strux\Component\Routing\Attribute\Prefix;
use Strux\Component\Routing\Attribute\Route;

#[Prefix('/dashboard')]
#[Middleware([AuthorizationMiddleware::class])]
#[Authorize]
class DashboardController extends Controller
{
    public function __construct(
        private readonly ArtworkRepositoryInterface $artworkRepo,
        private readonly LoggerInterface $logger,
    ) {
        parent::__construct();
    }

    #[Route('', methods: ['GET'], name: 'dashboard.index')]
    public function index(Request $request): Response
    {
        $this->logger->info('Dashboard accessed', [
            'userId' => $this->auth->id(),
        ]);

        $recentArtworks = $this->artworkRepo->listRecent(10);
        $stats = [
            'totalArtworks' => Artwork::count(),
            'totalUsers' => User::count(),
            'recentSales' => Order::where('status', 'completed')->count(),
        ];

        return $this->view('dashboard/index', [
            'recentArtworks' => $recentArtworks,
            'stats' => $stats,
        ]);
    }

    #[Route('/artworks', methods: ['GET'], name: 'dashboard.artworks')]
    public function artworks(Request $request): Response
    {
        $artworks = Artwork::with('user')
            ->orderBy('created_at', 'DESC')
            ->paginate(20);

        return $this->view('dashboard/artworks', [
            'artworks' => $artworks,
        ]);
    }

    #[Route('/artworks/:id/edit', methods: ['GET'], name: 'dashboard.artworks.edit')]
    public function editArtwork(string $id): Response
    {
        $artwork = Artwork::find($id);

        if (!$artwork) {
            $this->flash->error('Artwork not found.');
            return $this->redirect('/dashboard/artworks');
        }

        return $this->view('dashboard/artworks-edit', [
            'artwork' => $artwork,
            'categories' => Category::all(),
        ]);
    }

    #[Route('/artworks/:id', methods: ['POST'], name: 'dashboard.artworks.update')]
    public function updateArtwork(string $id, Request $request): Response
    {
        $artwork = Artwork::find($id);

        if (!$artwork) {
            $this->flash->error('Artwork not found.');
            return $this->redirect('/dashboard/artworks');
        }

        $artwork->title = $request->input('title');
        $artwork->price = $request->input('price');
        $artwork->categoryId = $request->input('categoryId');

        if ($request->hasFile('image')) {
            $path = $request->file('image')->moveTo('uploads/artworks');
            $artwork->imagePath = $path;
        }

        if ($artwork->save()) {
            $this->flash->success('Artwork updated!');
        } else {
            $this->flash->error('Please fix the errors.');
            return $this->redirectWith(
                $this->route('dashboard.artworks.edit', ['id' => $id]),
                ['errors' => $artwork->getErrors()]
            );
        }

        return $this->redirect('/dashboard/artworks');
    }

    #[Route('/purchases/:id', methods: ['GET'], name: 'dashboard.purchases.detail')]
    #[Authorize(permissions: ['view_purchases'])]
    public function purchaseDetail(string $id): Response
    {
        $purchase = Order::with('items.artwork')->find($id);

        if (!$purchase) {
            $this->flash->error('Purchase not found.');
            return $this->redirect('/dashboard');
        }

        return $this->view('dashboard/purchase-detail', [
            'purchase' => $purchase,
        ]);
    }
}
```

---

## 22. Large API Controller Example

```php
<?php

namespace App\Http\Controllers\Api;

use Psr\Log\LoggerInterface;
use Strux\Component\Http\ApiResponse;
use Strux\Component\Http\Attribute\Cache;
use Strux\Component\Http\Attribute\RequestBody;
use Strux\Component\Http\Attribute\ResponseHeader;
use Strux\Component\Http\Attribute\ResponseStatus;
use Strux\Component\Http\Controller\Api\Controller;
use Strux\Component\Routing\Attribute\ApiController;
use Strux\Component\Routing\Attribute\ApiRoute;
use Strux\Component\Routing\Attribute\Consumes;
use Strux\Component\Routing\Attribute\Middleware;
use Strux\Component\Routing\Attribute\Prefix;
use Strux\Component\Routing\Attribute\Produces;

#[ApiController]
#[Prefix('/api/tickets')]
#[Consumes('application/json')]
#[Produces('application/json')]
class TicketController extends Controller
{
    public function __construct(
        private readonly LoggerInterface $logger,
    ) {
        parent::__construct();
    }

    #[ApiRoute('', methods: ['GET'], name: 'api.tickets.index')]
    #[ResponseHeader('X-App-Version', '1.5.0')]
    public function index(): ApiResponse
    {
        $tickets = Ticket::query()
            ->with('status')
            ->with('priority')
            ->latest()
            ->all();

        return $this->Ok($tickets);
    }

    #[ApiRoute('/int:id', methods: ['GET'], name: 'api.tickets.show')]
    #[Cache(ttl: 60)]
    public function show(int $id): ApiResponse
    {
        $ticket = Ticket::with('status')->with('priority')->find($id);

        if (!$ticket) {
            return $this->NotFound('Ticket not found.');
        }

        return $this->Ok($ticket);
    }

    #[ApiRoute('', methods: ['POST'], name: 'api.tickets.store')]
    #[ResponseStatus(201)]
    public function store(
        #[RequestBody] TicketCreateRequest $request
    ): ApiResponse {
        $ticket = new Ticket();
        $ticket->subject = $request->subject;
        $ticket->description = $request->description;
        $ticket->priority = $request->priority ?? 'normal';
        $ticket->status = 'open';
        $ticket->save();

        $this->logger->info('Ticket created', ['ticketId' => $ticket->id]);

        return $this->Created($ticket, 'Ticket created successfully.');
    }

    #[ApiRoute('/int:id', methods: ['PUT'], name: 'api.tickets.update')]
    public function update(
        int $id,
        #[RequestBody] TicketUpdateRequest $request
    ): ApiResponse {
        $ticket = Ticket::find($id);

        if (!$ticket) {
            return $this->NotFound('Ticket not found.');
        }

        $ticket->subject = $request->subject ?? $ticket->subject;
        $ticket->status = $request->status ?? $ticket->status;
        $ticket->save();

        return $this->Ok($ticket, 'Ticket updated successfully.');
    }

    #[ApiRoute('/int:id', methods: ['DELETE'], name: 'api.tickets.delete')]
    #[ResponseStatus(204)]
    public function delete(int $id): ApiResponse
    {
        $ticket = Ticket::find($id);

        if (!$ticket) {
            return $this->NotFound('Ticket not found.');
        }

        $ticket->delete();

        return $this->NoContent();
    }
}
```

---

## 23. Controller Directory Structure

Controllers are organized by type in the application directory:

```
src/
  Http/
    Controllers/
      Web/
        HomeController.php
        AuthController.php
        ArtworkController.php
        DashboardController.php
      Api/
        AuthController.php
        TicketController.php
        ArtworkController.php
```

The framework scans these directories automatically when looking for controllers.

---

## 24. Best Practices

### Keep Controllers Thin

A controller should only do three things:

1. **Extract data** from the request (input, parameters, files)
2. **Call a service or model** to do the actual work
3. **Return a response**

```php
// GOOD: Controller is thin and delegates logic
public function store(Request $request): Response
{
    $data = $request->only(['title', 'description', 'price']);
    $this->artworkService->create($data);

    $this->flash->success('Artwork created!');
    return $this->redirect('/artworks');
}

// BAD: Controller has too much logic
public function store(Request $request): Response
{
    $validator = new Validator($request->all());
    // ... 20 lines of validation ...
    // ... 15 lines of file processing ...
    // ... 10 lines of email sending ...

    return $this->redirect('/artworks');
}
```

### Use Constructor Injection

Inject services in the constructor rather than fetching them from the container:

```php
// GOOD: Dependencies are explicit
public function __construct(
    private readonly ArtworkRepositoryInterface $artworkRepo,
) {
    parent::__construct();
}

// BAD: Hidden dependency
public function index(): Response
{
    $repo = $this->container->get(ArtworkRepositoryInterface::class);
}
```

### Name Routes Consistently

Use a consistent naming convention for routes:

```
{controller}.{action}       → artworks.index, artworks.show, artworks.store
api.{controller}.{action}   → api.artworks.index, api.artworks.show
dashboard.{controller}.{action} → dashboard.artworks.index
```

### One Method Per Action

Each controller method should handle exactly one action. Do not create "god methods" that do everything:

```go
// GOOD: Separate methods for separate actions
public function index(): Response { /* list */ }
public function create(): Response { /* show form */ }
public function store(Request $request): Response { /* save */ }
public function show(int $id): Response { /* detail */ }
public function edit(int $id): Response { /* edit form */ }
public function update(int $id, Request $request): Response { /* update */ }
public function delete(int $id): Response { /* delete */ }
```

### Use Request DTOs for Complex Input

If a method has more than 3-4 input fields, use a Request DTO with `#[RequestBody]` instead of individual `$request->input()` calls.

### Do Not Hardcode URLs

Always use named routes with `$this->route()` or `$this->toRoute()`:

```php
// BAD: Hardcoded URL — breaks if you change the route path
return $this->redirect('/users/5');

// GOOD: Uses named route — automatically updates
return $this->toRoute('users.show', ['id' => 5]);
```

> [!CAUTION]
> Hardcoding URLs is one of the most common sources of broken links after a refactor. Named routes prevent this entirely.

---

## 25. Summary

| Feature | Web Controller | API Controller |
|---------|---------------|---------------|
| Base class | `Web\Controller` | `Api\Controller` |
| Route attribute | `#[Route]` | `#[ApiRoute]` |
| Response type | `Response` (HTML) | `ApiResponse` (JSON) |
| View rendering | `$this->view()` | ❌ |
| JSON responses | `$this->json()` | `$this->Ok()`, `$this->Created()`, etc. |
| Redirects | `$this->redirect()`, `$this->toRoute()` | ❌ (stateless) |
| Flash messages | `$this->flash` | ❌ (stateless) |
| Session | `$this->session` | ❌ (stateless) |
| Magic model loading | ✅ via `__get()` | ✅ via `__get()` (inherited) |
| Response caching | ❌ | ✅ via `#[Cache]` |
| Content negotiation | ❌ | ✅ via `#[Consumes]`, `#[Produces]` |
| Error responses | HTML error pages | JSON error envelope |

Controllers are the heart of your application. They connect what the user sees (the route and request) to what the application does (models, services, business logic) and what the user gets back (the response). Keep them clean, keep them thin, and use the attributes to declare your routes, middleware, and authorization right where they belong.

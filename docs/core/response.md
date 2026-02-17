---
title: Response
slug: /response
description: Building HTTP responses in Strux.
---

# Response

## Overview

The `Response` object represents the outgoing HTTP response sent back to the client.

It provides a fluent and expressive API for:

- Setting status codes
- Managing headers
- Returning JSON
- Performing redirects
- Controlling caching behavior
- Converting to PSR-7 responses

Strux responses are framework-level abstractions that are later converted into **PSR-7 compliant responses** before being emitted to the browser.

:::info
Controllers should always return a `Response` instance (or data that Strux can convert into one).
:::

---

# Creating a Response

## Basic Response

```php
return new Response('Hello World');
````

By default:

* Status code: `200`
* Headers: empty
* Content-Type: inferred or set later

---

## Setting Status Code

```php
return (new Response('Created'))
    ->setStatusCode(201);
```

Valid HTTP status codes range from:

```
100–599
```

---

# Setting Headers

## Replace or Set Header

```php
$response->setHeader('X-App-Version', '1.0');
```

If the header exists, it will be replaced.

---

## Add Additional Header Values

```php
$response->addHeader('Cache-Control', 'no-cache');
```

This appends values instead of replacing them.

---

## Header Normalization

Headers are automatically normalized to proper HTTP format:

```
content-type → Content-Type
x-powered-by → X-Powered-By
```

You do not need to manually format casing.

---

# JSON Responses

Returning JSON is common in APIs.

```php
return (new Response())
    ->json(['status' => 'ok']);
```

Automatically:

* Sets `Content-Type: application/json`
* Encodes data safely
* Handles encoding errors

---

## Custom Status & Headers

```php
return (new Response())
    ->json(
        ['error' => 'Unauthorized'],
        401,
        ['X-Error-Code' => 'AUTH_001']
    );
```

---

---

# Redirect Responses

Redirect the client:

```php
return (new Response())
    ->redirect('/login');
```

Default status:

```
302 Found
```

---

## Custom Redirect Status

```php
return (new Response())
    ->redirect('/moved', 301);
```

Common redirect codes:

| Code | Meaning                               |
| ---- | ------------------------------------- |
| 301  | Permanent redirect                    |
| 302  | Temporary redirect                    |
| 303  | See Other                             |
| 307  | Temporary redirect (preserves method) |

---

---

# Caching Control

## Disable Caching

```php
$response->noCache();
```

Sets headers:

* `Cache-Control: no-store, no-cache`
* `Pragma: no-cache`
* `Expires: past date`

Recommended for:

* Authentication pages
* Sensitive data
* Admin panels

---

## Custom Cache Settings

```php
$response->setCache([
    'max_age' => 3600,
    'public'  => true,
]);
```

Supported options:

| Option          | Description              |
| --------------- | ------------------------ |
| `etag`          | Entity tag               |
| `last_modified` | DateTime or string       |
| `max_age`       | Cache lifetime (seconds) |
| `s_maxage`      | Shared cache lifetime    |
| `private`       | Marks response private   |

---

## Setting Last Modified

```php
$response->setLastModified(new DateTime());
```

Automatically converted to UTC and formatted properly.

---

---

# Content Management

## Set Content

```php
$response->setContent('<h1>Hello</h1>');
```

Content must be a string.

---

## Overwriting Content

Calling `setContent()` replaces previous content.

---

---

# Fluent Interface

All setters return the response instance:

```php
return (new Response())
    ->setStatusCode(200)
    ->setHeader('X-App', 'Strux')
    ->setContent('OK');
```

Encourages clean, readable controller logic.

---

# PSR-7 Conversion

Internally, Strux converts the Response into a PSR-7 response before sending it to the client.

This ensures:

* Middleware compatibility
* Standards compliance
* Interoperability with external libraries

Developers rarely need to handle this directly.

---

# Emission

After conversion:

1. Headers are sent
2. Status code is set
3. Body is streamed to output
4. Execution ends

This process is handled automatically by the framework’s ResponseEmitter.

---

# Controller Best Practices

### Always Return a Response

```php
public function index(): Response
{
    return new Response('Welcome');
}
```

---

### Use Semantic Status Codes

| Scenario         | Status |
| ---------------- | ------ |
| Success          | 200    |
| Resource created | 201    |
| Validation error | 422    |
| Unauthorized     | 401    |
| Forbidden        | 403    |
| Not found        | 404    |
| Server error     | 500    |

---

### Keep Controllers Thin

Controllers should:

* Prepare data
* Return Response
* Avoid header manipulation logic where possible

Business logic belongs in services.

---

# Common Patterns

## API Endpoint

```php
return (new Response())
    ->json(['users' => $users]);
```

---

## Validation Failure

```php
return (new Response())
    ->json(['errors' => $errors], 422);
```

---

## Redirect After Form Submit

```php
return (new Response())
    ->redirect('/dashboard');
```

---

## No Cache Admin Page

```php
return (new Response('<h1>Admin</h1>'))
    ->noCache();
```

---

# Security Considerations

* Never expose stack traces in production.
* Use proper status codes.
* Avoid reflecting unescaped user input.
* Use `noCache()` for sensitive endpoints.

---

# Immutability & Safety

While the Response object itself is mutable during construction, once emitted:

* Headers cannot be changed
* Status cannot be altered
* Output buffering cannot be reversed

Always finalize the response before returning it.

---

# When to Use Response vs Return Raw Data

| Return Type | Result              |
| ----------- | ------------------- |
| `Response`  | Full control        |
| `array`     | Converted to JSON   |
| `string`    | Wrapped in Response |

For advanced behavior, always use `Response`.

---

# Summary

The Response object provides:

* Status control
* Header management
* JSON handling
* Redirects
* Cache configuration
* PSR-7 interoperability

It is the final stage of the HTTP lifecycle and ensures your application communicates clearly, correctly, and securely with clients.
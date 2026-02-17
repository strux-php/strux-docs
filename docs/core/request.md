---
title: Request
slug: /request
description: Working with HTTP requests in Strux.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Request

## Overview

The `Request` object represents the current incoming HTTP request.

It provides a clean and expressive API for accessing:

- Query parameters
- Form data
- JSON payloads
- Headers
- Cookies
- Uploaded files
- Route parameters
- Server information

Strux is built on top of **PSR-7** (`ServerRequestInterface`), meaning the Request object is fully interoperable with middleware and other PSR-compliant libraries.

:::info
The Request object is immutable.  
Any modification returns a new instance.
:::

---

# Accessing Input

## Basic Input Retrieval

```php
$request->input('email');
````

Retrieves input from:

* Query string
* Parsed form body
* JSON payload (when applicable)

---

## Default Values

```php
$request->input('page', 1);
```

If the key does not exist, the default value is returned.

---

## Type Casting

```php
$request->input('page', 1, 'int');
$request->input('active', false, 'bool');
```

Supported types:

* `int`
* `float`
* `bool`
* `string`
* `array`

---

## Nested Input (Dot Notation)

```php
$request->input('user.address.city');
```

Useful for structured form submissions and JSON payloads.

---

## Checking for Input

```php
$request->has('email');
$request->has(['email', 'password']);
```

Returns `true` only if all keys exist.

---

# Query Parameters

Retrieve only query string values:

```php
$request->query('search');
```

Example:

```
/users?page=2&sort=name
```

---

# Retrieving All Input

```php
$request->all();
$request->allPost();
$request->allQuery();
```

| Method       | Description         |
| ------------ | ------------------- |
| `all()`      | Merges query + body |
| `allPost()`  | Parsed body only    |
| `allQuery()` | Query string only   |

---

# JSON Requests

For API endpoints:

```php
$data = $request->getJson();
```

Returns:

* Decoded object when valid
* `null` if empty or invalid

---

# Headers

Retrieve all headers:

```php
$request->headers();
```

Retrieve a specific header:

```php
$request->header('Authorization');
```

Returns:

* `null` if missing
* `string` for single value
* `array` for multiple values

---

# Cookies

```php
$request->cookie('session_id');
$request->cookies();
```

---

# Uploaded Files

Retrieve file:

```php
$request->file('avatar');
```

Check existence:

```php
$request->hasFile('avatar');
```

Supports single and multiple uploads.

---

# Route Parameters

Injected by the router.

```php
$request->routeParam('id');
$request->routeParams();
```

---

# Request Metadata

## HTTP Method

```php
$request->method();
$request->is('post');
```

---

## Path Matching

```php
$request->path();
$request->isPath('admin/*');
```

Useful in middleware and conditional routing logic.

---

## HTTPS Detection

```php
$request->isSecure();
```

---

## AJAX Detection

```php
$request->isAjax();
```

---

# Sanitized Input

Strux provides sanitization helpers:

```php
$request->safe()->only(['email']);
$request->safeAll();
```

---

# PSR-7 Integration

Strux enhances PSR-7 — it does not hide it.

You may interact with the request in three ways:

1. Strux wrapper methods
2. PSR methods via wrapper
3. Direct PSR-7 usage

---

# Server Parameters

<Tabs>
<TabItem value="wrapper" label="Strux Wrapper">

```php
$request->server('HTTP_HOST');
```

Clean and expressive.

</TabItem>

<TabItem value="psr-wrapper" label="PSR via Wrapper">

```php
$request->getServerParams();
```

Returns full array.

</TabItem>

<TabItem value="psr-direct" label="Direct PSR-7">

```php
$psrRequest->getServerParams();
```

Used in low-level middleware.

</TabItem>
</Tabs>

---

# Cookies (PSR Access)

<Tabs>
<TabItem value="wrapper" label="Strux Wrapper">

```php
$request->cookie('session_id');
```

</TabItem>

<TabItem value="psr-wrapper" label="PSR via Wrapper">

```php
$request->getCookieParams();
```

</TabItem>

<TabItem value="psr-direct" label="Direct PSR-7">

```php
$psrRequest->getCookieParams();
```

</TabItem>
</Tabs>

---

# Query Parameters (PSR Access)

<Tabs>
<TabItem value="wrapper" label="Strux Wrapper">

```php
$request->query('page');
```

</TabItem>

<TabItem value="psr-wrapper" label="PSR via Wrapper">

```php
$request->getQueryParams();
```

</TabItem>

<TabItem value="psr-direct" label="Direct PSR-7">

```php
$psrRequest->getQueryParams();
```

</TabItem>
</Tabs>

---

# Uploaded Files (PSR Access)

<Tabs>
<TabItem value="wrapper" label="Strux Wrapper">

```php
$request->file('avatar');
```

</TabItem>

<TabItem value="psr-wrapper" label="PSR via Wrapper">

```php
$request->getUploadedFiles();
```

</TabItem>

<TabItem value="psr-direct" label="Direct PSR-7">

```php
$psrRequest->getUploadedFiles();
```

</TabItem>
</Tabs>

---

# Attributes (Route & Middleware Data)

<Tabs>
<TabItem value="wrapper" label="Strux Wrapper">

```php
$request->routeParam('id');
```

</TabItem>

<TabItem value="psr-wrapper" label="PSR via Wrapper">

```php
$request->getAttribute('user');
```

</TabItem>

<TabItem value="psr-direct" label="Direct PSR-7">

```php
$psrRequest->getAttribute('user');
```

</TabItem>
</Tabs>

---

# Immutability & Middleware

When modifying request data:

```php
$request = $request->withAttribute('user', $user);
```

Always assign the returned instance.

---

# When to Use Each Layer

| Scenario             | Recommended Approach    |
| -------------------- | ----------------------- |
| Controller logic     | Strux wrapper methods   |
| Application services | Strux wrapper methods   |
| Middleware           | PSR methods via wrapper |
| Custom HTTP pipeline | Direct PSR-7            |

---

# Best Practices

* Always cast user input
* Never trust raw data
* Validate before using
* Sanitize output appropriately
* Respect immutability
* Use wrapper methods in application code

---

# Summary

The Request object provides:

* Unified input access
* Type-safe retrieval
* JSON parsing
* File handling
* Header & cookie access
* Route parameter retrieval
* PSR-7 interoperability

It forms the foundation of Strux’s HTTP layer — predictable, secure, and standards-compliant.
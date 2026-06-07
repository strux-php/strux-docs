---
slug: strux-v1-0-released
title: "Strux v1.0 is Officially Here! 🎉"
tags: [releases, announcement]
---

Today marks a monumental milestone for the Strux framework: **v1.0.0 is officially released!**

After months of development, testing, and structural refactoring—including a major transition to a robust directory resolver and a completely attribute-driven architecture—we are finally ready for production.

<!-- truncate -->

## What makes Strux different?

When we started building Strux, we had one goal: to leverage the full power of modern PHP 8 Attributes to eliminate boilerplate. We wanted a framework where you could define your routes, middleware, and database schemas directly on your classes. 

With v1.0, we have achieved that. 

### Key Features in v1.0

* **Attribute-Driven Routing & HTTP**: Say goodbye to massive routing files. Define `#[Route]`, `#[Prefix]`, and `#[Middleware]` right on your controllers.
* **Intelligent Dependency Injection**: A powerful zero-configuration DI container that auto-wires your services instantly.
* **Object-Oriented Forms**: We've expanded the form features to provide type-safe, reusable form abstraction.
* **Built-in Authentication**: Natively protected routes and secure session handling via Sentinels.

## Looking Forward

This is just the beginning. The core foundation is solid, but we are already hard at work on v1.1, which will bring massive improvements to the ORM, including relationship management and lifecycle hooks.

To get started with v1.0, head over to the [Installation guide](/docs/getting-started/installation)!

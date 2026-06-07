---
slug: strux-v1-1-8-mapper-and-migrations
title: "Strux v1.1.8: Migrations Engine & Data Mappers"
tags: [releases, changelog]
---

Welcome to **Strux v1.1.8**! We've been rapidly iterating on the `v1.1.x` branch, and this latest patch introduces some of the most requested developer experience (DX) features yet: the new Migrations Engine and the highly anticipated Data Mapper component.

<!-- truncate -->

## What's New in v1.1.8?

While technically a patch release, we couldn't wait until v1.2 to ship these incredible workflow enhancements.

### 🗄️ Database Migrations Engine
We have drastically enhanced the ORM and database schema attributes to power a brand new **Migration Engine**. Strux can now automatically read your Entity classes (like `User.php`) and generate complete SQL migrations based on your `#[Table]` and `#[Column]` attributes. You no longer have to manually write raw SQL migrations or sync massive schema files!

### 🔄 DTO Data Mapper Component
We've officially implemented the highly requested Data Mapper component. 

This component intelligently handles mapping data arrays directly to strongly-typed objects and DTOs using reflection and attributes. By using `#[MapTo]` and our robust `MapperInterface`, you can now hydrate your entities from messy HTTP requests automatically, completely eliminating the need to write endless manual variable assignments in your controllers.

### 🐛 Bug Fixes
* **SQL Dialect Patch**: Fixed a nasty SQL dialect Insert syntax error that affected certain database drivers.
* **Boolean Casting**: Fixed `_performInsert` and `_performUpdate` to correctly cast boolean types across all supported dialects.

You can upgrade to v1.1.8 immediately via Composer. Be sure to check out the new [Migrations Guide](/docs/database/migrations) to see the new engine in action!

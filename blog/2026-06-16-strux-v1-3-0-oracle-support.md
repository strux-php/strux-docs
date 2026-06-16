---
slug: strux-v1-3-0-oracle-support
title: "Strux v1.3.0: Enterprise Oracle Database Support"
tags: [releases, changelog]
---

Welcome to **Strux v1.3.0**! We've just rolled out a major enhancement to our dialect-agnostic ORM and Migration Engine: full support for the **Oracle Database**.

<!-- truncate -->

## What's New in v1.3.0?

We are continuously expanding Strux to be the most robust and flexible framework for enterprise applications.

### 🏛️ Oracle Dialect Support
Strux's ORM and Migration Engine now natively support the Oracle Database dialect. This means you can now define your models and run `db:migrate` or `db:upgrade` seamlessly on an Oracle environment.

Our smart dialect compiler automatically translates your generic `Field` attributes into Oracle-specific SQL syntax, handling all the nuances of sequences, boolean equivalents (like `NUMBER(1)`), and complex indexes under the hood.

Whether you are using MySQL, PostgreSQL, SQLite, Microsoft SQL Server, or now **Oracle**, Strux ensures your PHP code remains completely database-agnostic.

You can upgrade to v1.3.0 immediately via Composer. Be sure to check out the updated [Migrations Guide](/docs/database/migrations) for more details.

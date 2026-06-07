---
slug: strux-v1-1-the-enterprise-orm-update
title: "Strux v1.1: The Enterprise ORM Update"
tags: [releases, changelog]
---

We are incredibly excited to announce the release of **Strux v1.1**! This release is massive, focusing heavily on our Active Record implementation to bring enterprise-grade ORM features to the framework.

<!-- truncate -->

## The ORM Evolution

When v1.0 launched, we promised a stronger, more robust ORM. Over the past several months, we completely refactored the ORM to use fluent static methods and drastically improved the validation syntax to use brackets alongside brand new `Range` rules.

But we didn't stop there.

### What's New in v1.1?

* **Model Event System**: We've introduced a powerful model event system with lifecycle hooks. You can now easily hook into `creating`, `updating`, `saving`, and `deleting` events directly on your models.
* **Database Scaling & Dialects**: Strux now natively supports multiple SQL dialects. Alongside this, we've implemented a robust Query Cache to drastically speed up repeated database fetches in high-traffic applications.
* **Relationship Management**: We pushed massive updates to the ORM model system to natively support complex relationship management, query building, and pagination.
* **Built-in Model Validation**: Model validation is now baked directly into the Active Record lifecycle, ensuring bad data never even makes it to your database.

This update cements Strux as a serious contender for large-scale enterprise applications. Upgrade your dependencies and check out the new [ORM documentation](/docs/orm/models) today!

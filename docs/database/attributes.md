# Schema Attributes: Designing Your Database in PHP

In Strux, you design your database tables directly in your PHP code using **Attributes**. Think of attributes as "sticky notes" you put on your PHP properties and classes to tell the framework how to create and manage your database tables. This is called a **Code-First** approach.

> [!TIP]
> You never write raw `CREATE TABLE` SQL by hand. Your PHP Model IS the schema definition. The framework reads your attributes and generates the correct SQL for your specific database.

---

## 1. Complete Attribute Reference

Here is every schema attribute available, organized by what it does.

---

## 2. `#[Entity]` — The Class-Level Blueprint

Put this on your Model class to tell Strux how to map it to a database table.

```php
use Strux\Component\Database\Schema\Attributes\Entity;

#[Entity(
    table: 'users',       // The database table name
    database: 'mydb',     // The database name (for multi-database setups)
    connection: 'mysql',  // The connection name (for multi-connection setups)
    schema: 'public',     // The schema name (for PostgreSQL)
    readOnly: false,      // If true, this model cannot be written to
    mapper: null          // A custom mapper class for complex transformations
)]
class User extends Model
{
    // ...
}
```

### Parameters Explained

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `table` | `?string` | `null` | The name of the database table. If null, Strux automatically generates it from the class name (`User` -> `users`). |
| `database` | `?string` | `null` | The database name. Used when your connection has access to multiple databases. |
| `connection` | `?string` | `null` | The database connection name from your config file. Lets you use different databases for different models. |
| `schema` | `?string` | `null` | The schema name (PostgreSQL). Defaults to `public`. |
| `readOnly` | `bool` | `false` | If `true`, the model cannot create, update, or delete records. |
| `mapper` | `?string` | `null` | A class name for a custom mapper that transforms data between the database and your model. |

### Automatic Table Name Generation

If you don't specify a table name, Strux automatically generates one:

| Class Name | Generated Table Name |
|------------|---------------------|
| `User` | `users` |
| `BlogPost` | `blog_posts` |
| `ProductCategory` | `product_categories` |

The rule is simple: it converts PascalCase to snake_case and adds an "s" at the end.

> [!WARNING]
> If your class name ends in a word that doesn't pluralize well (like `Sheep` or `Series`), always specify the table name manually!

---

## 3. `#[Column]` — The Property-Level Column Definition

This is the most important attribute. It marks a PHP property as a database column and defines its characteristics.

```php
use Strux\Component\Database\Schema\Attributes\Column;
use Strux\Component\Database\Schema\Types\Field;

#[Column(
    name: 'user_email',        // Custom column name (optional)
    type: Field::string,        // The data type
    length: 255,                // Maximum length (for strings)
    precision: 10,              // Total digits (for decimals)
    scale: 2,                   // Decimal places (for decimals)
    nullable: false,            // Allow NULL values
    unique: false,              // Enforce unique values
    default: null,              // Default value
    enums: null,                // Allowed values (for enum type)
    currentTimestamp: false,    // Auto-set on create
    onUpdateCurrentTimestamp: false  // Auto-update on change
)]
public string $email;
```

### Parameters Explained

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `?string` | `null` | The actual column name in the database. If null, the PHP property name is used. |
| `type` | `?Field` | `null` | The data type (see Field Types below). |
| `length` | `?int` | `255` | Maximum length for strings (`VARCHAR`). |
| `precision` | `?int` | `10` | Total number of digits for `decimal` types. |
| `scale` | `?int` | `2` | Number of digits after the decimal point for `decimal` types. |
| `nullable` | `?bool` | `false` | Whether the column allows `NULL` values. |
| `unique` | `?bool` | `false` | Whether all values in this column must be unique. |
| `default` | `mixed` | `null` | The default value for the column. |
| `enums` | `?array` | `null` | An array of allowed string values. Only used when `type` is `Field::enum`. |
| `currentTimestamp` | `?bool` | `false` | If true, the database automatically sets this to the current timestamp when a row is created. |
| `onUpdateCurrentTimestamp` | `?bool` | `false` | If true, the database automatically updates this to the current timestamp whenever the row is modified. |

### Column Name Mapping

You can have different PHP property names and database column names:

```php
#[Column(name: 'usr_email_addr')]
public string $email; // PHP property is $email, database column is 'usr_email_addr'
```

### Default Values

You can set defaults at both the database level (via the attribute) and the PHP level:

```php
#[Column(type: Field::string, default: 'active')]
public string $status;

#[Column(type: Field::boolean)]
public bool $active = true;  // PHP-level default
```

> [!NOTE]
> Database-level defaults (in the `#[Column]` attribute) are used by the database schema. PHP-level defaults (assigned directly) are used when creating new model instances in code. When both are set, the PHP-level default takes precedence when creating models through the ORM.

---

## 4. `#[Id]` — The Primary Key

Every table needs a primary key — a unique identifier for each row. Mark it with `#[Id]`.

```php
use Strux\Component\Database\Schema\Attributes\Id;
use Strux\Component\Database\Schema\Attributes\Column;
use Strux\Component\Database\Schema\Types\Field;

#[Id, Column(type: Field::integer)]
public ?int $id = null;
```

### Parameters Explained

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `autoincrement` | `bool` | `true` | Whether the ID automatically increments with each new row. |
| `autoGenerate` | `string` | `'none'` | Auto-generation strategy. Options: `'none'`, `'uuid'`, `'ulid'`. |

### Auto-Incrementing Integer IDs (Default)

```php
#[Id, Column(type: Field::integer)]
public ?int $id = null;
```
- The database assigns an incrementing integer automatically.
- After saving, the ORM captures the new ID and sets it on your model.
- Best for most applications.

### UUID Primary Keys

```php
#[Id, Column(type: Field::uuid), Id(autoincrement: false, autoGenerate: 'uuid')]
public ?string $id = null;
```
- Automatically generates a UUID v4 string (like `550e8400-e29b-41d4-a716-446655440000`).
- The ORM generates the UUID before inserting into the database.
- Perfect for distributed systems where you need unique IDs without a central database.
- Stored as `CHAR(36)` in the database.

### ULID Primary Keys

```php
#[Id, Column(type: Field::ulid), Id(autoincrement: false, autoGenerate: 'ulid')]
public ?string $id = null;
```
- Automatically generates a ULID (Universally Unique Lexicographically Sortable Identifier) — like `01ARZ3NDEKTSV4RRFFQ69G5FAV`.
- Unlike UUIDs, ULIDs are **sortable by time**. Newer records always have "larger" IDs.
- Stored as `CHAR(26)` in the database.
- Great for time-series data and event sourcing.

### Composite Primary Keys

Some tables need multiple columns to uniquely identify a row. This is called a **composite primary key**.

```php
class OrderItem extends Model
{
    #[Id, Column(type: Field::integer)]
    public ?int $orderId = null;

    #[Id, Column(type: Field::integer)]
    public ?int $productId = null;

    #[Column(type: Field::integer)]
    public int $quantity;
}
```

> [!WARNING]
> With composite keys, `find()` and `destroy()` require arrays: `Model::find(['orderId' => 1, 'productId' => 5])`.

---

## 5. `#[Index]` — Speed Up Your Queries

Indexes are like the index at the back of a book. They help the database find rows without reading the entire table.

### Single-Column Index (on a Property)

```php
use Strux\Component\Database\Schema\Attributes\Index;

#[Column]
#[Index]  // Creates index on the 'status' column
public string $status;
```

### Named Index

```php
#[Column]
#[Index(name: 'idx_user_status')]
public string $status;
```

### Composite Index (on the Class)

When you search by multiple columns at the same time (e.g., `WHERE firstname = ? AND lastname = ?`), a composite index is faster than two separate indexes.

```php
#[Entity(table: 'users')]
#[Index(columns: ['firstname', 'lastname'], name: 'idx_user_full_name')]
class User extends Model
{
    // ...
}
```

> [!WARNING]
> Order matters in composite indexes! An index on `['firstname', 'lastname']` speeds up:
> - `WHERE firstname = ? AND lastname = ?` (both columns)
> - `WHERE firstname = ?` (just the first column)
> 
> But it does NOT help:
> - `WHERE lastname = ?` (just the second column)
>
> Always put the most-searched column first.

### Unique Index

```php
#[Column]
#[Index(unique: true)]
public string $email;
```

You can also use the shorthand `#[Unique]` attribute:

```php
use Strux\Component\Database\Schema\Attributes\Unique;

#[Column]
#[Unique]
public string $email;
```

### Multiple Indexes on One Column

```php
#[Column]
#[Index]                    // Regular index
#[Index(name: 'idx_hash')]  // Another index with a different name
public string $email;
```

---

## 6. `#[Unique]` — Enforce Uniqueness

A shorthand for creating a unique constraint on a single column.

```php
use Strux\Component\Database\Schema\Attributes\Unique;

#[Column]
#[Unique(indexName: 'unique_user_email')]
public string $email;
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `indexName` | `?string` | `null` | Optional custom name for the unique index. |

> [!TIP]
> `#[Unique]` is exactly equivalent to `#[Index(unique: true)]`. Use whichever you find more readable.

---

## 7. `#[RenamedFrom]` — Rename Columns Safely

Renaming a column in PHP normally looks like a "delete + create" to the migration engine, which would **drop the old column and lose all data**. `#[RenamedFrom]` tells the framework: "This column used to be called X. Just rename it."

```php
use Strux\Component\Database\Schema\Attributes\RenamedFrom;

#[Column]
#[RenamedFrom('home_address')]  // The old column name
public string $billingAddress;
```

### How it Works

When you run `db:migrate`, the engine sees:
- There is a column called `home_address` in the database.
- There is NOW a column called `billingAddress` in your PHP model.
- Without `#[RenamedFrom]`, it would drop `home_address` and create `billingAddress` (data loss!).
- With `#[RenamedFrom('home_address')]`, it generates `ALTER TABLE users RENAME COLUMN home_address TO billingAddress` (safe!).

> [!CAUTION]
> Always add `#[RenamedFrom]` BEFORE renaming the property in PHP. The attribute should reference the OLD column name that currently exists in the database.

---

## 8. `#[SoftDelete]` — Trash Instead of Delete

Soft deletes mark records as deleted without actually removing them from the database. This is like moving a file to the Recycle Bin instead of permanently deleting it.

```php
use Strux\Component\Database\Schema\Attributes\SoftDelete;

#[Entity(table: 'users')]
#[SoftDelete(column: 'deleted_at')]
class User extends Model
{
    // ...
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `column` | `string` | `'deleted_at'` | The column name used to track deletion status. |

### How it Works

When you call `$user->delete()` on a model using the `HasSoftDeletes` trait:
1. The model does NOT get removed from the database.
2. Instead, its `deleted_at` column is set to the current timestamp.
3. All normal queries automatically exclude "trashed" records (they add a `WHERE deleted_at IS NULL`).
4. You can restore trashed records at any time.

> [!TIP]
> You must also use the `HasSoftDeletes` trait in your Model class for soft deletes to work. The `#[SoftDelete]` attribute alone only defines the schema column.

---

## 9. `#[Timestamps]` — Automatic Time Tracking

Tells the framework that your model uses `created_at` and `updated_at` columns.

```php
use Strux\Component\Database\Schema\Attributes\Timestamps;

#[Entity(table: 'users')]
#[Timestamps(
    enabled: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
)]
class User extends Model
{
    // ...
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | `bool` | `true` | Whether timestamp tracking is active. |
| `createdAt` | `string` | `'created_at'` | The column name for the creation timestamp. |
| `updatedAt` | `string` | `'updated_at'` | The column name for the last-updated timestamp. |

### Custom Column Names

```php
#[Timestamps(
    createdAt: 'registered_at',
    updatedAt: 'modified_at'
)]
class User extends Model
{
    #[Column(type: Field::datetime, currentTimestamp: true)]
    public ?string $registeredAt = null;

    #[Column(type: Field::datetime, onUpdateCurrentTimestamp: true)]
    public ?string $modifiedAt = null;
}
```

> [!NOTE]
> The `#[Timestamps]` attribute works together with the `HasTimestamps` trait. The attribute configures the schema, and the trait provides the runtime behavior. Both the column attributes (`currentTimestamp` and `onUpdateCurrentTimestamp`) AND the trait are needed for full functionality.

---

## 10. `#[OrderBy]` — Default Ordering

Sets the default ordering for queries on this model.

```php
use Strux\Component\Database\Schema\Attributes\OrderBy;

class Product extends Model
{
    #[Column(type: Field::integer)]
    #[OrderBy(column: 'sort_order', direction: 'ASC')]
    public int $sortOrder;
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `column` | `string` | (required) | The column to order by. |
| `direction` | `string` | `'ASC'` | Sort direction: `'ASC'` or `'DESC'`. |

---

## 11. Complete Field Type Reference

The `Field` enum provides all supported column types. Strux automatically translates these into the correct SQL for your database.

### Integer Types

| Field Enum | Description | MySQL | PostgreSQL | SQLite |
|------------|-------------|-------|------------|--------|
| `Field::int` or `Field::integer` | Standard integer | `INT` | `INTEGER` | `INTEGER` |
| `Field::intUnsigned` or `Field::integerUnsigned` | Unsigned integer | `INT UNSIGNED` | `INTEGER` (no unsigned) | `INTEGER` |
| `Field::tinyInteger` | Tiny integer | `TINYINT` | `SMALLINT` | `INTEGER` |
| `Field::tinyIntegerUnsigned` | Unsigned tiny | `TINYINT UNSIGNED` | `SMALLINT` | `INTEGER` |
| `Field::smallInteger` | Small integer | `SMALLINT` | `SMALLINT` | `INTEGER` |
| `Field::smallIntegerUnsigned` | Unsigned small | `SMALLINT UNSIGNED` | `SMALLINT` | `INTEGER` |
| `Field::mediumInteger` | Medium integer | `MEDIUMINT` | `INTEGER` | `INTEGER` |
| `Field::mediumIntegerUnsigned` | Unsigned medium | `MEDIUMINT UNSIGNED` | `INTEGER` | `INTEGER` |
| `Field::bigInteger` | Big integer | `BIGINT` | `BIGINT` | `INTEGER` |
| `Field::bigIntegerUnsigned` | Unsigned big | `BIGINT UNSIGNED` | `BIGINT` | `INTEGER` |

> [!TIP]
> Use `Field::bigInteger` for financial amounts (in cents), API IDs from external services, or any value that could exceed 2.1 billion.

### String & Text Types

| Field Enum | Description | MySQL | PostgreSQL | SQLite |
|------------|-------------|-------|------------|--------|
| `Field::string` | Variable-length string | `VARCHAR(n)` | `VARCHAR(n)` | `VARCHAR(n)` |
| `Field::char` | Fixed-length string | `CHAR(n)` | `CHAR(n)` | `CHAR(n)` |
| `Field::text` | Long text | `TEXT` | `TEXT` | `TEXT` |
| `Field::mediumText` | Medium text | `MEDIUMTEXT` | `TEXT` | `TEXT` |
| `Field::longText` | Maximum text | `LONGTEXT` | `TEXT` | `TEXT` |

> [!NOTE]
> `Field::string` uses the `length` parameter (default 255). For strings longer than 255 characters, use `Field::text` instead.

### Numeric Types

| Field Enum | Description | MySQL | PostgreSQL | SQLite |
|------------|-------------|-------|------------|--------|
| `Field::decimal` | Exact decimal | `DECIMAL(p,s)` | `DECIMAL(p,s)` | `DECIMAL(p,s)` |
| `Field::float` | Floating point | `FLOAT` | `REAL` | `REAL` |
| `Field::double` | Double precision | `DOUBLE` | `DOUBLE PRECISION` | `REAL` |

> [!CAUTION]
> Never use `float` or `double` for monetary values. Rounding errors accumulate. Always use `decimal` for money.

### Date & Time Types

| Field Enum | Description | Format |
|------------|-------------|--------|
| `Field::date` | Date only | `YYYY-MM-DD` |
| `Field::dateTime` | Date and time | `YYYY-MM-DD HH:MM:SS` |
| `Field::time` | Time only | `HH:MM:SS` |
| `Field::timestamp` | Timestamp | `YYYY-MM-DD HH:MM:SS` |
| `Field::year` | Year | `YYYY` |

### Special Types

| Field Enum | Description | Storage |
|------------|-------------|---------|
| `Field::boolean` | True/false | MySQL: `TINYINT(1)`, Postgres: `BOOLEAN`, SQLite: `INTEGER` |
| `Field::json` | JSON data | MySQL: `JSON`, Postgres: `JSONB`, SQLite: `TEXT` |
| `Field::enum` | Enumerated values | MySQL: `ENUM()`, others: `VARCHAR` with CHECK |
| `Field::binary` | Binary data | MySQL: `BLOB`, Postgres: `BYTEA`, SQLite: `BLOB` |
| `Field::uuid` | UUID string | `CHAR(36)` |
| `Field::ulid` | ULID string | `CHAR(26)` |

### Using Enum Type

```php
#[Column(type: Field::enum, enums: ['pending', 'active', 'banned', 'deleted'])]
public string $status;
```

> [!WARNING]
> The `enums` parameter is only used when `type` is `Field::enum`. For other types, it is ignored.

---

## 12. Putting It All Together: A Complete Example

Here is a fully-featured Model demonstrating everything we have covered:

```php
<?php

namespace App\Domain\Identity\Entity;

use Strux\Component\Database\Schema\Attributes\Entity;
use Strux\Component\Database\Schema\Attributes\Column;
use Strux\Component\Database\Schema\Attributes\Id;
use Strux\Component\Database\Schema\Attributes\Index;
use Strux\Component\Database\Schema\Attributes\Unique;
use Strux\Component\Database\Schema\Attributes\RenamedFrom;
use Strux\Component\Database\Schema\Attributes\SoftDelete;
use Strux\Component\Database\Schema\Attributes\Timestamps;
use Strux\Component\Database\Schema\Types\Field;
use Strux\Component\Database\ORM\Model;

#[Entity(table: 'users')]
#[SoftDelete(column: 'deleted_at')]
#[Timestamps(enabled: true)]
#[Index(columns: ['firstname', 'lastname'], name: 'idx_users_fullname')]
class User extends Model
{
    #[Id, Column(type: Field::bigInteger)]
    public ?int $id = null;

    #[Column(name: 'first_name', type: Field::string, length: 100)]
    public string $firstname;

    #[Column(name: 'last_name', type: Field::string, length: 100)]
    public string $lastname;

    #[Column(type: Field::string, length: 255)]
    #[Unique]
    public string $email;

    #[Column(type: Field::string, length: 255)]
    public string $password;

    #[Column(type: Field::enum, enums: ['pending', 'active', 'banned'], default: 'pending')]
    public string $status = 'pending';

    #[Column(type: Field::boolean)]
    public bool $isAdmin = false;

    #[Column(type: Field::decimal, precision: 10, scale: 2, default: 0.00)]
    public float $balance = 0.00;

    #[Column(type: Field::json, nullable: true)]
    public ?array $preferences = null;

    #[Column(type: Field::datetime, currentTimestamp: true)]
    public ?string $createdAt = null;

    #[Column(type: Field::datetime, onUpdateCurrentTimestamp: true)]
    public ?string $updatedAt = null;

    // Renamed from 'home_address' -> safe migration
    #[Column(type: Field::text, nullable: true)]
    #[RenamedFrom('home_address')]
    public ?string $billingAddress = null;
}
```

> [!TIP]
> You do not need ALL of these attributes on every model. Start simple and add attributes as you need them. A basic model might only need `#[Id]` and a few `#[Column]` attributes.

---

## 13. Quick Reference Card

| Attribute | Where to put it | What it does |
|-----------|-----------------|--------------|
| `#[Entity]` | Class | Maps the model to a database table |
| `#[Column]` | Property | Marks a property as a database column |
| `#[Id]` | Property | Marks the primary key |
| `#[Index]` | Property or Class | Creates a database index |
| `#[Unique]` | Property | Shorthand for a unique index |
| `#[RenamedFrom]` | Property | Safely renames a column |
| `#[SoftDelete]` | Class | Enables soft deletion |
| `#[Timestamps]` | Class | Enables automatic timestamps |
| `#[OrderBy]` | Property | Sets default query ordering |

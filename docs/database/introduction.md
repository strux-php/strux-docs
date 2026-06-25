# Database Layer: Introduction

Welcome to the Strux Database Layer. This is the engine that powers everything related to storing, retrieving, and managing your application's data. Whether you are using MySQL, PostgreSQL, SQLite, SQL Server, or Oracle, Strux provides a unified, elegant interface that works the same way regardless of which database you choose.

> [!NOTE]
> Strux is fully **database-agnostic**. You write your code once, and it works on any supported database. Switch from MySQL to PostgreSQL by changing a single line in your `.env` file.

---

## 1. How the Database Layer is Organized

The database layer has three main parts that work together like a well-oiled machine:

| Part | What it does |
|------|--------------|
| **Database Connection** (`Database` class) | Manages the connection to your database. It reads your configuration, creates PDO connections, and handles read/write splitting. |
| **ORM & Models** (`Model` class) | The bridge between your PHP code and your database tables. Each Model represents a table, and each Model instance represents a row in that table. |
| **Schema & Migrations** | Tools for creating, modifying, and version-controlling your database structure. You define your schema in PHP, and Strux generates the SQL. |

---

## 2. How Database Connections Work

### The Configuration File

Database settings are defined in a PHP class that implements `ConfigInterface`. This config class is shipped with the skeleton app at `src/Config/Database.php` and returns the connection array from a `toArray()` method:

```php
<?php

namespace App\Config;

use PDO;
use Strux\Component\Config\ConfigInterface;

class Database implements ConfigInterface
{
    public function toArray(): array
    {
        return [
            'default' => env('DB_CONNECTION', 'sqlite'),

            'connections' => [
                'sqlite' => [
                    'driver' => 'sqlite',
                    'path' => env('DB_PATH', ROOT_PATH . '/var/database/app.db'),
                    'prefix' => '',
                    'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
                ],

                'mysql' => [
                    'driver' => 'mysql',
                    'host' => env('DB_HOST', '127.0.0.1'),
                    'port' => env('DB_PORT', '3306'),
                    'database' => env('DB_DATABASE'),
                    'username' => env('DB_USERNAME'),
                    'password' => env('DB_PASSWORD'),
                    'unix_socket' => env('DB_SOCKET', ''),
                    'charset' => 'utf8mb4',
                    'collation' => 'utf8mb4_unicode_ci',
                    'prefix' => '',
                    'strict' => true,
                    'engine' => null,
                ],

                'mariadb' => [
                    'driver' => 'mariadb',
                    'host' => env('DB_HOST', '127.0.0.1'),
                    'port' => env('DB_PORT', '3306'),
                    'database' => env('DB_DATABASE'),
                    'username' => env('DB_USERNAME'),
                    'password' => env('DB_PASSWORD'),
                    'unix_socket' => env('DB_SOCKET', ''),
                    'charset' => 'utf8mb4',
                    'collation' => 'utf8mb4_unicode_ci',
                    'prefix' => '',
                    'strict' => true,
                    'engine' => null,
                ],

                'pgsql' => [
                    'driver' => 'pgsql',
                    'host' => env('DB_HOST', '127.0.0.1'),
                    'port' => env('DB_PORT', '5432'),
                    'database' => env('DB_DATABASE'),
                    'username' => env('DB_USERNAME'),
                    'password' => env('DB_PASSWORD'),
                    'charset' => 'utf8',
                    'prefix' => '',
                    'schema' => 'public',
                ],

                'sqlsrv' => [
                    'driver' => 'sqlsrv',
                    'host' => env('DB_HOST', 'localhost'),
                    'port' => env('DB_PORT', '1433'),
                    'database' => env('DB_DATABASE'),
                    'username' => env('DB_USERNAME'),
                    'password' => env('DB_PASSWORD'),
                    'charset' => 'utf8',
                    'prefix' => '',
                ],

                'oracle' => [
                    'driver' => 'oracle',
                    'host' => env('DB_HOST', '127.0.0.1'),
                    'port' => env('DB_PORT', '1521'),
                    'database' => env('DB_DATABASE', 'XEPDB1'),
                    'username' => env('DB_USERNAME'),
                    'password' => env('DB_PASSWORD'),
                    'charset' => env('DB_CHARSET', 'AL32UTF8'),
                    'prefix' => '',
                ],
            ],

            'fetch' => PDO::FETCH_ASSOC,
            'global_options' => [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_EMULATE_PREPARES => false,
            ],
        ];
    }
}
```

> [!TIP]
> Use the `.env` file to switch databases without touching your code. Just change `DB_CONNECTION=mysql` to `DB_CONNECTION=pgsql` and update the connection details.

### Read/Write Splitting

For high-traffic applications, you can configure separate read and write connections. This means all `SELECT` queries go to one database server (or multiple), while `INSERT`, `UPDATE`, and `DELETE` queries go to another (typically the primary server).

```php
'mysql' => [
    'driver' => 'mysql',
    'read' => [
        'host' => ['192.168.1.1', '192.168.1.2'], // Multiple read replicas
    ],
    'write' => [
        'host' => ['192.168.1.100'],
    ],
    'database' => 'strux',
    'username' => 'root',
    'password' => '',
],
```

> [!NOTE]
> If you do not specify separate read/write hosts, Strux uses the same connection for both. This is perfectly fine for most applications.

### How the Database Class Connects

The `Database` class is responsible for creating PDO connections. Here is what happens step by step:

1. Your application starts and the `Database` service is created.
2. It reads your configuration to determine the default driver (e.g., `mysql`).
3. It looks up the connection settings for that driver.
4. It builds a DSN (Data Source Name) string — the address that PDO uses to find your database.
5. It creates a new `PDO` instance with the DSN, username, and password.
6. It applies any driver-specific settings (charset for MySQL, foreign keys for SQLite, schema for Postgres).
7. It stores the connection in memory so the ORM can use it.

> [!TIP]
> The `Database` class is automatically resolved by the dependency injection container. You rarely need to interact with it directly — just use the Model or Query Builder.

---

## 3. Supported Database Drivers

Strux supports six database drivers out of the box. Here is what you need to know about each one:

### MySQL / MariaDB

The most popular open-source database. Great for general-purpose applications.

| Feature | Notes |
|---------|-------|
| Default port | 3306 |
| DSN format | `mysql:host=...;dbname=...;charset=...` |
| Boolean storage | `TINYINT(1)` (0 or 1) |
| Enum support | Native `ENUM()` type |
| JSON support | Native `JSON` column type |
| UUID storage | `CHAR(36)` |
| Auto-increment | Native |

### PostgreSQL

A powerful, feature-rich open-source database. Excellent for complex queries and data integrity.

| Feature | Notes |
|---------|-------|
| Default port | 5432 |
| DSN format | `pgsql:host=...;dbname=...` |
| Boolean storage | Native `BOOLEAN` type (true/false) |
| Enum support | Falls back to `VARCHAR` with CHECK constraint |
| JSON support | Native `JSONB` column type |
| UUID storage | Native `UUID` type |
| Auto-increment | Uses `SERIAL` or `IDENTITY` |

### SQLite

A lightweight, file-based database. Perfect for development, testing, and small applications.

| Feature | Notes |
|---------|-------|
| Default port | None (file-based) |
| DSN format | `sqlite:/path/to/database.sqlite` |
| Boolean storage | `INTEGER` (0 or 1) |
| Enum support | Falls back to `VARCHAR` |
| JSON support | Stored as `TEXT` |
| UUID storage | `CHAR(36)` |
| Auto-increment | `INTEGER PRIMARY KEY` |
| Special feature | Can use `:memory:` for in-memory databases |

> [!CAUTION]
> SQLite does not support concurrent writes well. For production applications with many users, use MySQL or PostgreSQL instead.

### SQL Server

Microsoft's enterprise database. Common in corporate environments.

| Feature | Notes |
|---------|-------|
| Default port | 1433 |
| DSN format | `sqlsrv:Server=...;Database=...` |
| Boolean storage | `BIT` (0 or 1) |
| Auto-increment | `IDENTITY` property |

### Oracle

Enterprise database commonly found in large organizations.

| Feature | Notes |
|---------|-------|
| Default port | 1521 |
| DSN format | `oci:dbname=//host:port/database` |
| Auto-increment | Uses sequences |

### Switching Drivers

To switch from MySQL to PostgreSQL, you only need to change two things:

1. **Environment**: Update your `.env` file.
2. **Configuration**: Optionally update your `config/database.php` if you need different settings.

> [!IMPORTANT]
> While Strux handles SQL dialect differences automatically, some features may behave slightly differently across databases. For example, MySQL's `ENUM` type is converted to `VARCHAR` with constraints on PostgreSQL and SQLite. The ORM handles all of this invisibly.

---

## 4. PDO Connection Options

PDO (PHP Data Objects) is the underlying PHP extension that Strux uses to talk to databases. Here are the default options:

```php
[
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,      // Throw exceptions on errors
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,  // Return results as associative arrays
    PDO::ATTR_EMULATE_PREPARES => false,                // Use real prepared statements
]
```

You can override these globally in your config file:

```php
'global_options' => [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_WARNING,    // Soft errors
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_OBJ, // Return results as objects
    PDO::ATTR_EMULATE_PREPARES => true,            // Emulate prepared statements (for some MySQL setups)
],
```

> [!WARNING]
> Setting `PDO::ATTR_EMULATE_PREPARES` to `true` can make your application vulnerable to SQL injection in certain edge cases. Keep it `false` unless you have a specific reason to change it.

---

## 5. The `Expression` Class

Sometimes you need to write raw SQL expressions that the ORM should not try to escape or quote. The `Expression` class marks a value as "already safe" SQL.

```php
use Strux\Component\Database\Expression;

// Tell the ORM to use a raw SQL expression instead of a quoted value
$query->where('created_at', '>', new Expression('NOW()'));
```

> [!CAUTION]
> Only use `Expression` with values you trust. It bypasses all SQL injection protection.

---

## 6. Environment Variables Reference

Here is every environment variable you can use to configure your database:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_CONNECTION` | Database driver (`mysql`, `pgsql`, `sqlite`, `sqlsrv`, `oracle`) | `mysql` |
| `DB_HOST` | Database server hostname | `127.0.0.1` |
| `DB_PORT` | Database server port | Driver-specific |
| `DB_DATABASE` | Database name | `strux` |
| `DB_USERNAME` | Database username | `root` |
| `DB_PASSWORD` | Database password | (empty) |
| `DB_CHARSET` | Character set (MySQL) | `utf8mb4` |
| `DB_DSN` | Full DSN string (SQLite override) | (optional) |
| `DB_PATH` | Path to SQLite file (SQLite) | `storage/database.sqlite` |
| `DB_FOREIGN_KEYS` | Enable foreign key constraints (SQLite) | `true` |

> [!TIP]
> You can set `DB_DSN` to any valid PDO DSN to completely bypass Strux's DSN builder. This is useful for exotic configurations or cloud database URLs.

---

## 7. Common Tasks

### Checking if the Database is Connected

```php
use Strux\Component\Database\Database;

/** @var Database $db */
$db = container(Database::class);
$connection = $db->getConnection('write'); // Returns PDO instance
```

### Getting the Raw PDO Instance

```php
$pdo = $db->getConnection('write');
$pdo->query('SELECT 1'); // Execute raw SQL directly
```

### Closing a Connection

```php
$db->closeConnection('write'); // Close the write connection
```

### Using Multiple Database Connections

```php
// Strux supports connecting to different databases for different models.
// Configure multiple connections and use the #[Entity] attribute:
use Strux\Component\Database\Schema\Attributes\Entity;

#[Entity(connection: 'mysql')]
class User extends Model
{
    // This model uses the MySQL connection
}

#[Entity(connection: 'pgsql')]
class Analytics extends Model
{
    // This model uses the PostgreSQL connection
}
```

---

## 8. Architecture Diagram

Here is how the database layer fits together:

```
Your Code (Controllers, Services, etc.)
          |
          v
    Model (Active Record)
          |
          v
  HasQueryBuilder Trait
    (Query Builder - fluent API)
          |
          v
    Dialect Classes
   (MySQL, Postgres, SQLite, etc.)
    - Build SQL strings
    - Quote identifiers
    - Handle type differences
          |
          v
    Database Class
   (Connection Manager)
    - Read/Write splitting
    - PDO connection pooling
          |
          v
    PDO (PHP Data Objects)
          |
          v
    Your Database
   (MySQL, PostgreSQL, SQLite, etc.)
```

---

## 9. Next Steps

Now that you understand the database layer, here is where to go next:

| Topic | Where to find it |
|-------|------------------|
| Defining your table structure | [Schema Attributes](attributes.md) |
| Creating and modifying tables | [Migrations](migrations.mdx) |
| Working with data using Models | [ORM Models](../orm/models.mdx) |
| Building complex queries | [Query Builder](../orm/query-builder.mdx) |
| Defining relationships between tables | [Relationships](../orm/relationships.mdx) |

> [!NOTE]
> Strux uses a **Code-First** approach. You define your database schema in PHP using attributes, and the framework generates the SQL for you. You never write raw `CREATE TABLE` statements by hand.

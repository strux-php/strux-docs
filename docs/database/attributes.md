# ORM Attributes: Data Formatting

Strux's ORM is built entirely on PHP 8 Attributes, making it incredibly expressive. Aside from defining schema columns and relationships, the ORM provides powerful attributes to format and transform your data as it goes in and out of the database.

## The `#[Reformat]` Attribute

The `#[Reformat]` attribute is designed to apply simple PHP functions or class methods to a value *before* it is returned to your application or *before* it is saved to the database.

It takes two optional parameters: `get` and `set`.

### Usage Example
A common use-case is ensuring that user emails are always strictly lowercase, or names are properly capitalized.

```php
use Strux\Component\Database\Schema\Attributes\Column;
use Strux\Component\Database\ORM\Attributes\Reformat;

#[Column]
#[Reformat(get: 'ucwords')] // Automatically capitalizes the first letter of each word when read
public ?string $name = null;

#[Column]
#[Reformat(get: 'strtolower', set: 'strtolower')] // Lowercases when read AND when saved
public ?string $email = null;
```

> [!TIP]
> **Null Safety:** The `#[Reformat]` attribute is completely null-safe. If the value in the database is `null`, the ORM will safely skip the formatting function, preventing any `TypeError` crashes!

## The `#[Transform]` Attribute

While `#[Reformat]` is great for simple string manipulations, the `#[Transform]` attribute handles deeper data type conversions. It allows you to automatically cast database values (like JSON strings or Date fields) into native PHP arrays or objects.

### Supported Types
The `#[Transform]` attribute utilizes the `DataType` enum, which supports types like:
- `DataType::ARRAY`
- `DataType::JSON`
- `DataType::DATETIME`

### Usage Example
If you store a user's preferences as a JSON string in the database, you can use `#[Transform]` to automatically parse it into a PHP array when you read it, and re-encode it back to JSON when you save it.

```php
use Strux\Component\Database\Schema\Attributes\Column;
use Strux\Component\Database\ORM\Attributes\Transform;
use Strux\Component\Database\Schema\Types\DataType;

#[Column]
#[Transform(DataType::ARRAY)]
public ?array $preferences = null;
```

With this attribute, you never have to manually call `json_decode()` or `json_encode()` in your controllers again. The ORM handles it completely invisibly.

> [!NOTE]
> Just like `#[Reformat]`, the `#[Transform]` attribute is highly resilient and properly handles `null` values without throwing errors.

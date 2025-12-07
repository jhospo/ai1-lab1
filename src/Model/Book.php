<?php
namespace App\Model;

use App\Service\Config;
use PDO;

class Book
{
    private ?int $id = null;
    private ?string $title = null;
    private ?string $author = null;
    private ?string $description = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(?int $id): self
    {
        $this->id = $id;
        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(?string $title): self
    {
        $this->title = $title;
        return $this;
    }

    public function getAuthor(): ?string
    {
        return $this->author;
    }

    public function setAuthor(?string $author): self
    {
        $this->author = $author;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public static function fromArray(array $array): self
    {
        $book = new self();
        $book->fill($array);
        return $book;
    }

    public function fill(array $array): self
    {
        if (isset($array['id']) && !$this->getId()) {
            $this->setId((int)$array['id']);
        }
        if (isset($array['title'])) {
            $this->setTitle($array['title']);
        }
        if (isset($array['author'])) {
            $this->setAuthor($array['author']);
        }
        if (isset($array['description'])) {
            $this->setDescription($array['description']);
        }
        return $this;
    }

    private static function getPdo(): PDO
    {
        return new PDO(
            Config::get('db_dsn'),
            Config::get('db_user'),
            Config::get('db_pass')
        );
    }

    public static function findAll(): array
    {
        $pdo = self::getPdo();
        $sql = 'SELECT * FROM books ORDER BY id DESC';
        $statement = $pdo->prepare($sql);
        $statement->execute();

        $books = [];
        $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            $books[] = self::fromArray($row);
        }

        return $books;
    }

    public static function find(int $id): ?self
    {
        $pdo = self::getPdo();
        $sql = 'SELECT * FROM books WHERE id = :id';
        $statement = $pdo->prepare($sql);
        $statement->execute(['id' => $id]);

        $row = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }

        return self::fromArray($row);
    }

    public function save(): void
    {
        $pdo = self::getPdo();

        if (!$this->getId()) {
            $sql = 'INSERT INTO books (title, author, description) VALUES (:title, :author, :description)';
            $statement = $pdo->prepare($sql);
            $statement->execute([
                'title' => $this->getTitle(),
                'author' => $this->getAuthor(),
                'description' => $this->getDescription(),
            ]);
            $this->setId((int)$pdo->lastInsertId());
        } else {
            $sql = 'UPDATE books SET title = :title, author = :author, description = :description WHERE id = :id';
            $statement = $pdo->prepare($sql);
            $statement->execute([
                'title' => $this->getTitle(),
                'author' => $this->getAuthor(),
                'description' => $this->getDescription(),
                'id' => $this->getId(),
            ]);
        }
    }

    public function delete(): void
    {
        if (!$this->getId()) {
            return;
        }

        $pdo = self::getPdo();
        $sql = 'DELETE FROM books WHERE id = :id';
        $statement = $pdo->prepare($sql);
        $statement->execute(['id' => $this->getId()]);

        $this->setId(null);
        $this->setTitle(null);
        $this->setAuthor(null);
        $this->setDescription(null);
    }
}

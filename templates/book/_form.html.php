<?php
/** @var \App\Model\Book|null $book */

$title       = $book?->getTitle()       ?? '';
$author      = $book?->getAuthor()      ?? '';
$description = $book?->getDescription() ?? '';
?>

<div class="form-group">
    <label for="title">Title</label>
    <input
            type="text"
            id="title"
            name="book[title]"
            value="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>"
    >
</div>

<div class="form-group">
    <label for="author">Author</label>
    <input
            type="text"
            id="author"
            name="book[author]"
            value="<?= htmlspecialchars($author, ENT_QUOTES, 'UTF-8') ?>"
    >
</div>

<div class="form-group">
    <label for="description">Description</label>
    <textarea
            id="description"
            name="book[description]"
    ><?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?></textarea>
</div>

<div class="form-group">
    <label></label>
    <input type="submit" value="Submit">
</div>

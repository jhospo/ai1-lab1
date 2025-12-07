<?php

$title = 'Books List';
$bodyClass = 'index';

ob_start(); ?>
    <h1>Books List</h1>

    <a href="<?= $router->generatePath('book-create') ?>">Create new</a>

    <ul class="index-list">
        <?php foreach ($books as $book): ?>
            <li>
                <h3><?= htmlspecialchars($book->getTitle(), ENT_QUOTES, 'UTF-8') ?></h3>
                <p><?= htmlspecialchars($book->getAuthor(), ENT_QUOTES, 'UTF-8') ?></p>
                <ul class="action-list">
                    <li><a href="<?= $router->generatePath('book-show', ['id' => $book->getId()]) ?>">Details</a></li>
                    <li><a href="<?= $router->generatePath('book-edit', ['id' => $book->getId()]) ?>">Edit</a></li>
                </ul>
            </li>
        <?php endforeach; ?>
    </ul>
<?php
$main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';

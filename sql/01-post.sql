create table post
(
    id      integer not null
        constraint post_pk
            primary key autoincrement,
    subject text not null,
    content text not null
);
CREATE TABLE books (
                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                       title TEXT NOT NULL,
                       author TEXT NOT NULL,
                       description TEXT
);

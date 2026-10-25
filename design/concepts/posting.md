# Posting

## Purpose

Make authored content persistently available to others.

## Principle

A user with a piece of media can publish it, creating a persistent post that others can access.

## Types
```types
external User
external Item
```
## State
```state
a set of Posts with
  an author User
  a media Item
  a caption String

Rule: each media identifies at most one Post
```

## Actions 
```actions

createPost(user: User, media: Item, caption: String): returns (post: Post)
  where no Post with given media exists
  then
    create a new Post with author set to user,
    media set to given media,
    and caption set to given caption
    returns post

deletePost(post: Post): returns ()
  where post exists
  then
    remove post
    returns

editCaption(post: Post, caption: String): returns ()
  where post exists
  then
    replace post's caption with given caption
    returns
```


## Queries

```queries
_get(post: Post) : optional (user: User, media: Item, caption: String)
  answers the user, media, and caption of the given post if it exists
  answers no row if the post does not exist

_postsBy(user: User) : many (post: Post, media: Item, caption: String)
  Returns all Posts cataloged by the user.

_getByMedia(media: Item): optional (post: Post)
  answers the Post with the given media if it exists
  answers no row if no Post has the given media
```

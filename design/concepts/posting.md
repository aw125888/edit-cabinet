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
```

## Actions 
```actions
createPost(user: User, media: Item, caption: String): returns (post: Post)
  where true
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
```
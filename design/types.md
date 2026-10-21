# EDIT CABINET Types

```types
concrete Video
  A URL identifying video media cataloged in EDIT CABINET.

concrete TagCategory
  One of EDIT CABINET's supported tag categories.
```

```instances
instantiate Registering

instantiate Authenticating with
  User is Registering.User

instantiate Sessioning with
  Subject is Registering.User

instantiate Posting with
  User is Registering.User
  Item is Video

instantiate Tagging with
  Item is Posting.Post
  Category is TagCategory

instantiate Collecting with
  User is Registering.User
  Item is Posting.Post
```
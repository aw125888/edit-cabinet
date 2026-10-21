# EDIT CABINET Types

```types
concrete Account
  A stable identity for an EDIT CABINET account.

concrete Video
  A URL identifying video media cataloged in EDIT CABINET.

concrete TagCategory
    One of EDIT CABINET"s supported categories
```

```instances
instantiate Posting with
  User is Account
  Item is Video

instantiate Tagging with 
    Item is Posting.Post 
    Category is TagCategory

instantiate Collecting with
  User is Account
  Item is Posting.Post

instantiate Registering

instantiate Authenticating with
  User is Registering.User

instantiate Sessioning with
  Subject is Registering.User
```




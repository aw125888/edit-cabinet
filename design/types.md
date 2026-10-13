# EDIT CABINET Types

```types
concrete Account
  A stable identity for an EDIT CABINET account.

concrete Video
  A URL identifying video media cataloged in EDIT CABINET.
```

```instances
instantiate Posting with
  User is Account
  Item is Video
```
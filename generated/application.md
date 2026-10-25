<!-- Generated from the Application assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# Application — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Authenticating

Defined in [Authenticating](../design/concepts/Authenticating.md), line 1.

#### Actions

- `set(user: User, password: String) : returns (user: User)`
  - Refuses `INVALID_PASSWORD`: A password must have 8 to 128 characters.
  - Refuses `PASSWORD_SET`: This account already has a password.
- `authenticate(user: User, password: String) : returns (user: User)`
  - Refuses `INVALID_CREDENTIALS`: The username or password is incorrect.

#### Queries

- `_acceptable(password: String) : one (acceptable: Flag)`

#### Instances

- `Authenticating` — instance of `Authenticating` — [EDIT CABINET Types](../design/types.md), line 14.
  - `User` is `Registering.User` — [EDIT CABINET Types](../design/types.md), line 15.

### Collecting

Defined in [Collecting](../design/concepts/Collecting.md), line 1.

#### Actions

- `createFolder(user: User, name: String) : returns (folder: Folder)`
- `deleteFolder(folder: Folder) : returns ()`
- `addToFolder(folder: Folder, item: Item) : returns (entry: FolderItem)`
- `removeFromFolder(folder: Folder, item: Item) : returns ()`
- `removeFromAllFolders(item: Item) : returns ()`
- `renameFolder(folder: Folder, name: String) : returns ()`

#### Queries

- `_foldersFor(user: User) : many (folder: Folder, name: String)`
- `_itemsIn(folder: Folder) : many (item: Item)`
- `_getFolder(folder: Folder) : many (user: User, name: String)`
- `_folderNamed(user: User, name: String) : optional (folder: Folder)`
- `_itemInFolder(folder: Folder, item: Item) : optional (entry: FolderItem)`

#### Instances

- `Collecting` — instance of `Collecting` — [EDIT CABINET Types](../design/types.md), line 28.
  - `Item` is `Posting.Post` — [EDIT CABINET Types](../design/types.md), line 30.
  - `User` is `Registering.User` — [EDIT CABINET Types](../design/types.md), line 29.

### Posting

Defined in [Posting](../design/concepts/posting.md), line 1.

#### Actions

- `createPost(user: User, media: Item, caption: String) : returns (post: Post)`
- `deletePost(post: Post) : returns ()`
- `editCaption(post: Post, caption: String) : returns ()`

#### Queries

- `_get(post: Post) : optional (user: User, media: Item, caption: String)`
- `_postsBy(user: User) : many (post: Post, media: Item, caption: String)`
- `_getByMedia(media: Item) : optional (post: Post)`
- `_count() : one (count: Number)`

#### Instances

- `Posting` — instance of `Posting` — [EDIT CABINET Types](../design/types.md), line 20.
  - `Item` is `Video` — [EDIT CABINET Types](../design/types.md), line 22.
  - `User` is `Registering.User` — [EDIT CABINET Types](../design/types.md), line 21.

### Registering

Defined in [Registering](../design/concepts/Registering.md), line 1.

#### Actions

- `register(username: String) : returns (user: User)`
  - Refuses `INVALID_USERNAME`: A username must have 3 to 32 letters, digits, underscores, or hyphens.
  - Refuses `USERNAME_TAKEN`: That username is taken.

#### Queries

- `_byUsername(username: String) : optional (user: User)`
- `_username(user: User) : optional (username: String)`

#### Instances

- `Registering` — instance of `Registering` — [EDIT CABINET Types](../design/types.md), line 12.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(subject: Subject) : returns (session: Session, expiresAt: DateTime)`
- `use(session: Session) : returns (subject: Subject)`
  - Refuses `NOT_SIGNED_IN`: Your session has ended. Sign in again.
- `end(session: Session) : returns (session: Session)`
  - Refuses `NOT_SIGNED_IN`: Your session has ended. Sign in again.

#### Instances

- `Sessioning` — instance of `Sessioning` — [EDIT CABINET Types](../design/types.md), line 17.
  - `Subject` is `Registering.User` — [EDIT CABINET Types](../design/types.md), line 18.

### Tagging

Defined in [Tagging](../design/concepts/Tagging.md), line 1.

#### Actions

- `createTag(name: String, category: Category) : returns (tag: Tag)`
- `tagItem(item: Item, tag: Tag) : returns (assignment: TagAssignment)`
- `untagItem(assignment: TagAssignment) : returns ()`
- `untagAll(item: Item) : returns ()`

#### Queries

- `_itemsFor(tag: Tag) : many (item: Item)`
- `_findTag(name: String, category: Category) : optional (tag: Tag)`
- `_tagsFor(item: Item) : many (assignment: TagAssignment, tag: Tag, name: String, category: Category)`

#### Instances

- `Tagging` — instance of `Tagging` — [EDIT CABINET Types](../design/types.md), line 24.
  - `Category` is `TagCategory` — [EDIT CABINET Types](../design/types.md), line 26.
  - `Item` is `Posting.Post` — [EDIT CABINET Types](../design/types.md), line 25.

## Application types

Concrete types:

- `TagCategory` — [EDIT CABINET Types](../design/types.md), line 7.
- `Video` — [EDIT CABINET Types](../design/types.md), line 4.

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### the contents of folder (folder)

Authored path: `Slot.FolderContents`.
- Covered by [Slot](../design/compositions/Slot.md), line 13.

```former
Former "the contents of folder (folder)" — inputs (folder); bindings (item, user, username, media, caption); promises exactly one record — forms:
  a record of
    items: each Collecting._itemsIn (folder) has (item)
      form a record of
        details: a record of
          where Posting._get (post: item) has (caption, media, user)
          where Registering._username (user) has (username)
          caption
          media
          username
        post: item
```

### the folders for user (user)

Authored path: `Slot.UserFolders`.
- Covered by [Slot](../design/compositions/Slot.md), line 9.

```former
Former "the folders for user (user)" — inputs (user); bindings (folder, name); promises exactly one record — forms:
  a record of
    folders: each Collecting._foldersFor (user) has (folder, name)
      form a record of
        folder
        name
```

### the items for tag (tag)

Authored path: `Search.ItemsForTag`.
- Covered by [Search](../design/compositions/Search.md), line 5.

```former
Former "the items for tag (tag)" — inputs (tag); bindings (item); promises exactly one record — forms:
  a record of
    items: each Tagging._itemsFor (tag) has (item)
      form a record of
        item
```

### the posts for user (user)

Authored path: `Manage.UserPosts`.
- Covered by [Manage](../design/compositions/Manage.md), line 29.

```former
Former "the posts for user (user)" — inputs (user); bindings (post, media, caption, assignment, tag, name, category); promises exactly one record — forms:
  a record of
    posts: each Posting._postsBy (user) has (caption, media, post)
      form a record of
        caption
        media
        post
        tags: each Tagging._tagsFor (item: post) has (assignment, category, name, tag)
          form a record of
            assignment
            category
            name
            tag
```

### the search result for post (post)

Authored path: `Search.PostResult`.
- Covered by [Search](../design/compositions/Search.md), line 9.

```former
Former "the search result for post (post)" — inputs (post); bindings (user, username, media, caption, tag, name, category); promises exactly one record — forms:
  a record of
    where Posting._get (post) has (caption, media, user)
    where Registering._username (user) has (username)
    caption
    media
    post
    tags: each Tagging._tagsFor (item: post) has (category, name, tag)
      form a record of
        category
        name
        tag
    username
```

## Reactions

### Catalog.AttachCatalogTag:tag-exists

Authored path: `Catalog.AttachCatalogTag`.
- Covered by [Catalog](../design/compositions/Catalog.md), line 5.
- Covered by [Catalog](../design/compositions/Catalog.md), line 11.

```reaction
when RequestBoundary.request (category, name, path: "/catalog/tag", post, requestId)
where
  Tagging._findTag (category, name) has (tag)
then
  Tagging.tagItem (item: post, tag)
```

### Catalog.AttachCatalogTag:tag-exists#2

Authored path: `Catalog.AttachCatalogTag`.
- Covered by [Catalog](../design/compositions/Catalog.md), line 5.
- Covered by [Catalog](../design/compositions/Catalog.md), line 11.

```reaction
when Tagging.tagItem (item: post, tag, assignment), asked by Catalog.AttachCatalogTag:tag-exists
where
  earlier, RequestBoundary.request (category, name, path: "/catalog/tag", post, requestId)
then
  RequestBoundary.respond (assignment, requestId)
```

### Catalog.AttachCatalogTag:tag-missing

Authored path: `Catalog.AttachCatalogTag`.
- Covered by [Catalog](../design/compositions/Catalog.md), line 5.
- Covered by [Catalog](../design/compositions/Catalog.md), line 11.

```reaction
when RequestBoundary.request (category, name, path: "/catalog/tag", post, requestId)
where
  no Tagging._findTag (category, name)
then
  Tagging.createTag (category, name)
```

### Catalog.AttachCatalogTag:tag-missing#2

Authored path: `Catalog.AttachCatalogTag`.
- Covered by [Catalog](../design/compositions/Catalog.md), line 5.
- Covered by [Catalog](../design/compositions/Catalog.md), line 11.

```reaction
when Tagging.createTag (category, name, tag: newTag), asked by Catalog.AttachCatalogTag:tag-missing
where
  earlier, RequestBoundary.request (category, name, path: "/catalog/tag", post, requestId)
then
  Tagging.tagItem (item: post, tag: newTag)
```

### Catalog.AttachCatalogTag:tag-missing#3

Authored path: `Catalog.AttachCatalogTag`.
- Covered by [Catalog](../design/compositions/Catalog.md), line 5.
- Covered by [Catalog](../design/compositions/Catalog.md), line 11.

```reaction
when Tagging.tagItem (item: post, tag: newTag, assignment), asked by Catalog.AttachCatalogTag:tag-missing#2
where
  earlier, RequestBoundary.request (category, name, path: "/catalog/tag", post, requestId)
then
  RequestBoundary.respond (assignment, requestId)
```

### Catalog.CreateCatalogPost

Authored path: `Catalog.CreateCatalogPost`.
- Covered by [Catalog](../design/compositions/Catalog.md), line 3.
- Covered by [Catalog](../design/compositions/Catalog.md), line 10.

```reaction
when RequestBoundary.request (caption, media, path: "/catalog/post", requestId, session)
then
  Sessioning.use (session)
```

### Catalog.CreateCatalogPost:media-already-cataloged#2

Authored path: `Catalog.CreateCatalogPost`.
- Covered by [Catalog](../design/compositions/Catalog.md), line 3.
- Covered by [Catalog](../design/compositions/Catalog.md), line 10.

```reaction
when Sessioning.use (session, subject: user), asked by Catalog.CreateCatalogPost
where
  earlier, RequestBoundary.request (caption, media, path: "/catalog/post", requestId, session)
  Posting._getByMedia (media)
then
  RequestBoundary.respond (error: "MEDIA_ALREADY_CATALOGED", requestId)
```

### Catalog.CreateCatalogPost:media-available#2

Authored path: `Catalog.CreateCatalogPost`.
- Covered by [Catalog](../design/compositions/Catalog.md), line 3.
- Covered by [Catalog](../design/compositions/Catalog.md), line 10.

```reaction
when Sessioning.use (session, subject: user), asked by Catalog.CreateCatalogPost
where
  earlier, RequestBoundary.request (caption, media, path: "/catalog/post", requestId, session)
  no Posting._getByMedia (media)
then
  Posting.createPost (caption, media, user)
```

### Catalog.CreateCatalogPost:media-available#3

Authored path: `Catalog.CreateCatalogPost`.
- Covered by [Catalog](../design/compositions/Catalog.md), line 3.
- Covered by [Catalog](../design/compositions/Catalog.md), line 10.

```reaction
when Posting.createPost (caption, media, user, post), asked by Catalog.CreateCatalogPost:media-available#2
where
  earlier, RequestBoundary.request (caption, media, path: "/catalog/post", requestId, session)
then
  RequestBoundary.respond (post, requestId)
```

### Catalog.GetCatalogCount

Authored path: `Catalog.GetCatalogCount`.
- Covered by [Catalog](../design/compositions/Catalog.md), line 7.
- Covered by [Catalog](../design/compositions/Catalog.md), line 12.

```reaction
when RequestBoundary.request (path: "/catalog/count", requestId)
where
  Posting._count () has (count)
then
  RequestBoundary.respond (count, requestId)
```

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

### Manage.AddTag

Authored path: `Manage.AddTag`.
- Covered by [Manage](../design/compositions/Manage.md), line 14.
- Covered by [Manage](../design/compositions/Manage.md), line 23.

```reaction
when RequestBoundary.request (category, name, path: "/manage/tag/add", post, requestId, session)
then
  Sessioning.use (session)
```

### Manage.AddTag:not-owned#2

Authored path: `Manage.AddTag`.
- Covered by [Manage](../design/compositions/Manage.md), line 14.
- Covered by [Manage](../design/compositions/Manage.md), line 23.

```reaction
when Sessioning.use (session, subject: user), asked by Manage.AddTag
where
  earlier, RequestBoundary.request (category, name, path: "/manage/tag/add", post, requestId, session)
  no Posting._get (post) has (user)
then
  RequestBoundary.respond (error: "FORBIDDEN", requestId)
```

### Manage.AddTag:owned-tag-exists#2

Authored path: `Manage.AddTag`.
- Covered by [Manage](../design/compositions/Manage.md), line 14.
- Covered by [Manage](../design/compositions/Manage.md), line 23.

```reaction
when Sessioning.use (session, subject: user), asked by Manage.AddTag
where
  earlier, RequestBoundary.request (category, name, path: "/manage/tag/add", post, requestId, session)
  Posting._get (post) has (user)
  Tagging._findTag (category, name) has (tag)
then
  Tagging.tagItem (item: post, tag)
```

### Manage.AddTag:owned-tag-exists#3

Authored path: `Manage.AddTag`.
- Covered by [Manage](../design/compositions/Manage.md), line 14.
- Covered by [Manage](../design/compositions/Manage.md), line 23.

```reaction
when Tagging.tagItem (item: post, tag, assignment), asked by Manage.AddTag:owned-tag-exists#2
where
  earlier, RequestBoundary.request (category, name, path: "/manage/tag/add", post, requestId, session)
then
  RequestBoundary.respond (assignment, requestId)
```

### Manage.AddTag:owned-tag-missing#2

Authored path: `Manage.AddTag`.
- Covered by [Manage](../design/compositions/Manage.md), line 14.
- Covered by [Manage](../design/compositions/Manage.md), line 23.

```reaction
when Sessioning.use (session, subject: user), asked by Manage.AddTag
where
  earlier, RequestBoundary.request (category, name, path: "/manage/tag/add", post, requestId, session)
  Posting._get (post) has (user)
  no Tagging._findTag (category, name)
then
  Tagging.createTag (category, name)
```

### Manage.AddTag:owned-tag-missing#3

Authored path: `Manage.AddTag`.
- Covered by [Manage](../design/compositions/Manage.md), line 14.
- Covered by [Manage](../design/compositions/Manage.md), line 23.

```reaction
when Tagging.createTag (category, name, tag: newTag), asked by Manage.AddTag:owned-tag-missing#2
where
  earlier, RequestBoundary.request (category, name, path: "/manage/tag/add", post, requestId, session)
then
  Tagging.tagItem (item: post, tag: newTag)
```

### Manage.AddTag:owned-tag-missing#4

Authored path: `Manage.AddTag`.
- Covered by [Manage](../design/compositions/Manage.md), line 14.
- Covered by [Manage](../design/compositions/Manage.md), line 23.

```reaction
when Tagging.tagItem (item: post, tag: newTag, assignment), asked by Manage.AddTag:owned-tag-missing#3
where
  earlier, RequestBoundary.request (category, name, path: "/manage/tag/add", post, requestId, session)
then
  RequestBoundary.respond (assignment, requestId)
```

### Manage.DeletePost

Authored path: `Manage.DeletePost`.
- Covered by [Manage](../design/compositions/Manage.md), line 16.
- Covered by [Manage](../design/compositions/Manage.md), line 27.

```reaction
when RequestBoundary.request (path: "/manage/delete", post, requestId, session)
then
  Sessioning.use (session)
```

### Manage.DeletePost:not-owned#2

Authored path: `Manage.DeletePost`.
- Covered by [Manage](../design/compositions/Manage.md), line 16.
- Covered by [Manage](../design/compositions/Manage.md), line 27.

```reaction
when Sessioning.use (session, subject: user), asked by Manage.DeletePost
where
  earlier, RequestBoundary.request (path: "/manage/delete", post, requestId, session)
  no Posting._get (post) has (user)
then
  RequestBoundary.respond (error: "FORBIDDEN", requestId)
```

### Manage.DeletePost:owned#2

Authored path: `Manage.DeletePost`.
- Covered by [Manage](../design/compositions/Manage.md), line 16.
- Covered by [Manage](../design/compositions/Manage.md), line 27.

```reaction
when Sessioning.use (session, subject: user), asked by Manage.DeletePost
where
  earlier, RequestBoundary.request (path: "/manage/delete", post, requestId, session)
  Posting._get (post) has (user)
then
  Tagging.untagAll (item: post)
```

### Manage.DeletePost:owned#3

Authored path: `Manage.DeletePost`.
- Covered by [Manage](../design/compositions/Manage.md), line 16.
- Covered by [Manage](../design/compositions/Manage.md), line 27.

```reaction
when Tagging.untagAll (item: post), asked by Manage.DeletePost:owned#2
then
  Collecting.removeFromAllFolders (item: post)
```

### Manage.DeletePost:owned#4

Authored path: `Manage.DeletePost`.
- Covered by [Manage](../design/compositions/Manage.md), line 16.
- Covered by [Manage](../design/compositions/Manage.md), line 27.

```reaction
when Collecting.removeFromAllFolders (item: post), asked by Manage.DeletePost:owned#3
then
  Posting.deletePost (post)
```

### Manage.DeletePost:owned#5

Authored path: `Manage.DeletePost`.
- Covered by [Manage](../design/compositions/Manage.md), line 16.
- Covered by [Manage](../design/compositions/Manage.md), line 27.

```reaction
when Posting.deletePost (post), asked by Manage.DeletePost:owned#4
where
  earlier, RequestBoundary.request (path: "/manage/delete", post, requestId, session)
then
  RequestBoundary.respond (requestId)
```

### Manage.EditCaption

Authored path: `Manage.EditCaption`.
- Covered by [Manage](../design/compositions/Manage.md), line 13.
- Covered by [Manage](../design/compositions/Manage.md), line 21.

```reaction
when RequestBoundary.request (caption, path: "/manage/caption", post, requestId, session)
then
  Sessioning.use (session)
```

### Manage.EditCaption:not-owned#2

Authored path: `Manage.EditCaption`.
- Covered by [Manage](../design/compositions/Manage.md), line 13.
- Covered by [Manage](../design/compositions/Manage.md), line 21.

```reaction
when Sessioning.use (session, subject: user), asked by Manage.EditCaption
where
  earlier, RequestBoundary.request (caption, path: "/manage/caption", post, requestId, session)
  no Posting._get (post) has (user)
then
  RequestBoundary.respond (error: "FORBIDDEN", requestId)
```

### Manage.EditCaption:owned#2

Authored path: `Manage.EditCaption`.
- Covered by [Manage](../design/compositions/Manage.md), line 13.
- Covered by [Manage](../design/compositions/Manage.md), line 21.

```reaction
when Sessioning.use (session, subject: user), asked by Manage.EditCaption
where
  earlier, RequestBoundary.request (caption, path: "/manage/caption", post, requestId, session)
  Posting._get (post) has (user)
then
  Posting.editCaption (caption, post)
```

### Manage.EditCaption:owned#3

Authored path: `Manage.EditCaption`.
- Covered by [Manage](../design/compositions/Manage.md), line 13.
- Covered by [Manage](../design/compositions/Manage.md), line 21.

```reaction
when Posting.editCaption (caption, post), asked by Manage.EditCaption:owned#2
where
  earlier, RequestBoundary.request (caption, path: "/manage/caption", post, requestId, session)
then
  RequestBoundary.respond (requestId)
```

### Manage.GetPosts

Authored path: `Manage.GetPosts`.
- Covered by [Manage](../design/compositions/Manage.md), line 12.
- Covered by [Manage](../design/compositions/Manage.md), line 19.

```reaction
when RequestBoundary.request (path: "/manage/posts", requestId, session)
then
  Sessioning.use (session)
```

### Manage.GetPosts#2

Authored path: `Manage.GetPosts`.
- Covered by [Manage](../design/compositions/Manage.md), line 12.
- Covered by [Manage](../design/compositions/Manage.md), line 19.

```reaction
when Sessioning.use (session, subject: user), asked by Manage.GetPosts
where
  earlier, RequestBoundary.request (path: "/manage/posts", requestId, session)
then
  RequestBoundary.respond (requestId, result: former "the posts for user (user)" with (user))
```

### Manage.RemoveTag

Authored path: `Manage.RemoveTag`.
- Covered by [Manage](../design/compositions/Manage.md), line 15.
- Covered by [Manage](../design/compositions/Manage.md), line 25.

```reaction
when RequestBoundary.request (assignment, path: "/manage/tag/remove", post, requestId, session)
then
  Sessioning.use (session)
```

### Manage.RemoveTag:not-owned#2

Authored path: `Manage.RemoveTag`.
- Covered by [Manage](../design/compositions/Manage.md), line 15.
- Covered by [Manage](../design/compositions/Manage.md), line 25.

```reaction
when Sessioning.use (session, subject: user), asked by Manage.RemoveTag
where
  earlier, RequestBoundary.request (assignment, path: "/manage/tag/remove", post, requestId, session)
  no Posting._get (post) has (user)
then
  RequestBoundary.respond (error: "FORBIDDEN", requestId)
```

### Manage.RemoveTag:owned-assignment#2

Authored path: `Manage.RemoveTag`.
- Covered by [Manage](../design/compositions/Manage.md), line 15.
- Covered by [Manage](../design/compositions/Manage.md), line 25.

```reaction
when Sessioning.use (session, subject: user), asked by Manage.RemoveTag
where
  earlier, RequestBoundary.request (assignment, path: "/manage/tag/remove", post, requestId, session)
  Posting._get (post) has (user)
  Tagging._tagsFor (item: post) has (assignment)
then
  Tagging.untagItem (assignment)
```

### Manage.RemoveTag:owned-assignment#3

Authored path: `Manage.RemoveTag`.
- Covered by [Manage](../design/compositions/Manage.md), line 15.
- Covered by [Manage](../design/compositions/Manage.md), line 25.

```reaction
when Tagging.untagItem (assignment), asked by Manage.RemoveTag:owned-assignment#2
where
  earlier, RequestBoundary.request (assignment, path: "/manage/tag/remove", post, requestId, session)
then
  RequestBoundary.respond (requestId)
```

### Search.SearchPost

Authored path: `Search.SearchPost`.
- Covered by [Search](../design/compositions/Search.md), line 7.
- Covered by [Search](../design/compositions/Search.md), line 13.

```reaction
when RequestBoundary.request (path: "/search/post", post, requestId)
then
  RequestBoundary.respond (requestId, result: former "the search result for post (post)" with (post))
```

### Search.SearchTag:tag-exists

Authored path: `Search.SearchTag`.
- Covered by [Search](../design/compositions/Search.md), line 3.
- Covered by [Search](../design/compositions/Search.md), line 12.

```reaction
when RequestBoundary.request (category, name, path: "/search/tag", requestId)
where
  Tagging._findTag (category, name) has (tag)
then
  RequestBoundary.respond (requestId, results: former "the items for tag (tag)" with (tag))
```

### Search.SearchTag:tag-missing

Authored path: `Search.SearchTag`.
- Covered by [Search](../design/compositions/Search.md), line 3.
- Covered by [Search](../design/compositions/Search.md), line 12.

```reaction
when RequestBoundary.request (category, name, path: "/search/tag", requestId)
where
  no Tagging._findTag (category, name)
then
  RequestBoundary.respond (requestId, results: (items: []))
```

### Slot.AddToFolder

Authored path: `Slot.AddToFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 5.
- Covered by [Slot](../design/compositions/Slot.md), line 25.

```reaction
when RequestBoundary.request (folder, path: "/slot/add", post, requestId, session)
then
  Sessioning.use (session)
```

### Slot.AddToFolder:already-added#2

Authored path: `Slot.AddToFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 5.
- Covered by [Slot](../design/compositions/Slot.md), line 25.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.AddToFolder
where
  Collecting._foldersFor (user) has (folder)
  earlier, RequestBoundary.request (folder, path: "/slot/add", post, requestId, session)
  Collecting._itemInFolder (folder, item: post)
then
  RequestBoundary.respond (error: "ALREADY_IN_FOLDER", requestId)
```

### Slot.AddToFolder:available#2

Authored path: `Slot.AddToFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 5.
- Covered by [Slot](../design/compositions/Slot.md), line 25.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.AddToFolder
where
  Collecting._foldersFor (user) has (folder)
  earlier, RequestBoundary.request (folder, path: "/slot/add", post, requestId, session)
  no Collecting._itemInFolder (folder, item: post)
then
  Collecting.addToFolder (folder, item: post)
```

### Slot.AddToFolder:available#3

Authored path: `Slot.AddToFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 5.
- Covered by [Slot](../design/compositions/Slot.md), line 25.

```reaction
when Collecting.addToFolder (folder, item: post, entry), asked by Slot.AddToFolder:available#2
where
  earlier, RequestBoundary.request (folder, path: "/slot/add", post, requestId, session)
then
  RequestBoundary.respond (entry, requestId)
```

### Slot.AddToFolder:not-owned#2

Authored path: `Slot.AddToFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 5.
- Covered by [Slot](../design/compositions/Slot.md), line 25.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.AddToFolder
where
  earlier, RequestBoundary.request (folder, path: "/slot/add", post, requestId, session)
  no Collecting._foldersFor (user) has (folder)
then
  RequestBoundary.respond (error: "FORBIDDEN", requestId)
```

### Slot.CreateFolder

Authored path: `Slot.CreateFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 3.
- Covered by [Slot](../design/compositions/Slot.md), line 24.

```reaction
when RequestBoundary.request (name, path: "/slot/folder/create", requestId, session)
then
  Sessioning.use (session)
```

### Slot.CreateFolder:available-name#2

Authored path: `Slot.CreateFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 3.
- Covered by [Slot](../design/compositions/Slot.md), line 24.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.CreateFolder
where
  earlier, RequestBoundary.request (name, path: "/slot/folder/create", requestId, session)
  no Collecting._folderNamed (name, user)
then
  Collecting.createFolder (name, user)
```

### Slot.CreateFolder:available-name#3

Authored path: `Slot.CreateFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 3.
- Covered by [Slot](../design/compositions/Slot.md), line 24.

```reaction
when Collecting.createFolder (name, user, folder), asked by Slot.CreateFolder:available-name#2
where
  earlier, RequestBoundary.request (name, path: "/slot/folder/create", requestId, session)
then
  RequestBoundary.respond (folder, requestId)
```

### Slot.CreateFolder:duplicate-name#2

Authored path: `Slot.CreateFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 3.
- Covered by [Slot](../design/compositions/Slot.md), line 24.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.CreateFolder
where
  earlier, RequestBoundary.request (name, path: "/slot/folder/create", requestId, session)
  Collecting._folderNamed (name, user)
then
  RequestBoundary.respond (error: "FOLDER_NAME_TAKEN", requestId)
```

### Slot.DeleteFolder

Authored path: `Slot.DeleteFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 19.
- Covered by [Slot](../design/compositions/Slot.md), line 30.

```reaction
when RequestBoundary.request (folder, path: "/slot/folder/delete", requestId, session)
then
  Sessioning.use (session)
```

### Slot.DeleteFolder:not-owned#2

Authored path: `Slot.DeleteFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 19.
- Covered by [Slot](../design/compositions/Slot.md), line 30.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.DeleteFolder
where
  earlier, RequestBoundary.request (folder, path: "/slot/folder/delete", requestId, session)
  no Collecting._getFolder (folder) has (user)
then
  RequestBoundary.respond (error: "FORBIDDEN", requestId)
```

### Slot.DeleteFolder:owned#2

Authored path: `Slot.DeleteFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 19.
- Covered by [Slot](../design/compositions/Slot.md), line 30.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.DeleteFolder
where
  earlier, RequestBoundary.request (folder, path: "/slot/folder/delete", requestId, session)
  Collecting._getFolder (folder) has (user)
then
  Collecting.deleteFolder (folder)
```

### Slot.DeleteFolder:owned#3

Authored path: `Slot.DeleteFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 19.
- Covered by [Slot](../design/compositions/Slot.md), line 30.

```reaction
when Collecting.deleteFolder (folder), asked by Slot.DeleteFolder:owned#2
where
  earlier, RequestBoundary.request (folder, path: "/slot/folder/delete", requestId, session)
then
  RequestBoundary.respond (requestId)
```

### Slot.GetFolder

Authored path: `Slot.GetFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 11.
- Covered by [Slot](../design/compositions/Slot.md), line 27.

```reaction
when RequestBoundary.request (folder, path: "/slot/folder", requestId, session)
then
  Sessioning.use (session)
```

### Slot.GetFolder:not-owned#2

Authored path: `Slot.GetFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 11.
- Covered by [Slot](../design/compositions/Slot.md), line 27.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.GetFolder
where
  earlier, RequestBoundary.request (folder, path: "/slot/folder", requestId, session)
  no Collecting._foldersFor (user) has (folder)
then
  RequestBoundary.respond (error: "FORBIDDEN", requestId)
```

### Slot.GetFolder:owned#2

Authored path: `Slot.GetFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 11.
- Covered by [Slot](../design/compositions/Slot.md), line 27.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.GetFolder
where
  Collecting._foldersFor (user) has (folder)
  earlier, RequestBoundary.request (folder, path: "/slot/folder", requestId, session)
then
  RequestBoundary.respond (requestId, result: former "the contents of folder (folder)" with (folder))
```

### Slot.GetFolders

Authored path: `Slot.GetFolders`.
- Covered by [Slot](../design/compositions/Slot.md), line 7.
- Covered by [Slot](../design/compositions/Slot.md), line 26.

```reaction
when RequestBoundary.request (path: "/slot/folders", requestId, session)
then
  Sessioning.use (session)
```

### Slot.GetFolders#2

Authored path: `Slot.GetFolders`.
- Covered by [Slot](../design/compositions/Slot.md), line 7.
- Covered by [Slot](../design/compositions/Slot.md), line 26.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.GetFolders
where
  earlier, RequestBoundary.request (path: "/slot/folders", requestId, session)
then
  RequestBoundary.respond (requestId, result: former "the folders for user (user)" with (user))
```

### Slot.RemoveFromFolder

Authored path: `Slot.RemoveFromFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 15.
- Covered by [Slot](../design/compositions/Slot.md), line 28.

```reaction
when RequestBoundary.request (folder, path: "/slot/remove", post, requestId, session)
then
  Sessioning.use (session)
```

### Slot.RemoveFromFolder:not-owned#2

Authored path: `Slot.RemoveFromFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 15.
- Covered by [Slot](../design/compositions/Slot.md), line 28.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.RemoveFromFolder
where
  earlier, RequestBoundary.request (folder, path: "/slot/remove", post, requestId, session)
  no Collecting._foldersFor (user) has (folder)
then
  RequestBoundary.respond (error: "FORBIDDEN", requestId)
```

### Slot.RemoveFromFolder:owned#2

Authored path: `Slot.RemoveFromFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 15.
- Covered by [Slot](../design/compositions/Slot.md), line 28.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.RemoveFromFolder
where
  Collecting._foldersFor (user) has (folder)
  earlier, RequestBoundary.request (folder, path: "/slot/remove", post, requestId, session)
then
  Collecting.removeFromFolder (folder, item: post)
```

### Slot.RemoveFromFolder:owned#3

Authored path: `Slot.RemoveFromFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 15.
- Covered by [Slot](../design/compositions/Slot.md), line 28.

```reaction
when Collecting.removeFromFolder (folder, item: post), asked by Slot.RemoveFromFolder:owned#2
where
  earlier, RequestBoundary.request (folder, path: "/slot/remove", post, requestId, session)
then
  RequestBoundary.respond (requestId)
```

### Slot.RenameFolder

Authored path: `Slot.RenameFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 17.
- Covered by [Slot](../design/compositions/Slot.md), line 29.

```reaction
when RequestBoundary.request (folder, name, path: "/slot/folder/rename", requestId, session)
then
  Sessioning.use (session)
```

### Slot.RenameFolder:available-name#2

Authored path: `Slot.RenameFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 17.
- Covered by [Slot](../design/compositions/Slot.md), line 29.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.RenameFolder
where
  Collecting._foldersFor (user) has (folder)
  earlier, RequestBoundary.request (folder, name, path: "/slot/folder/rename", requestId, session)
  no Collecting._folderNamed (name, user)
then
  Collecting.renameFolder (folder, name)
```

### Slot.RenameFolder:available-name#3

Authored path: `Slot.RenameFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 17.
- Covered by [Slot](../design/compositions/Slot.md), line 29.

```reaction
when Collecting.renameFolder (folder, name), asked by Slot.RenameFolder:available-name#2
where
  earlier, RequestBoundary.request (folder, name, path: "/slot/folder/rename", requestId, session)
then
  RequestBoundary.respond (requestId)
```

### Slot.RenameFolder:duplicate-name#2

Authored path: `Slot.RenameFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 17.
- Covered by [Slot](../design/compositions/Slot.md), line 29.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.RenameFolder
where
  Collecting._foldersFor (user) has (folder)
  earlier, RequestBoundary.request (folder, name, path: "/slot/folder/rename", requestId, session)
  Collecting._folderNamed (name, user)
then
  RequestBoundary.respond (error: "FOLDER_NAME_TAKEN", requestId)
```

### Slot.RenameFolder:not-owned#2

Authored path: `Slot.RenameFolder`.
- Covered by [Slot](../design/compositions/Slot.md), line 17.
- Covered by [Slot](../design/compositions/Slot.md), line 29.

```reaction
when Sessioning.use (session, subject: user), asked by Slot.RenameFolder
where
  earlier, RequestBoundary.request (folder, name, path: "/slot/folder/rename", requestId, session)
  no Collecting._foldersFor (user) has (folder)
then
  RequestBoundary.respond (error: "FORBIDDEN", requestId)
```

### reusable.accounts.identifying.Me

Authored path: `reusable.accounts.identifying.Me`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 5.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 8.

```reaction
when RequestBoundary.request (path: "/auth/me", requestId, session)
then
  Sessioning.use (session)
```

### reusable.accounts.identifying.Me#2

Authored path: `reusable.accounts.identifying.Me`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 5.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 8.

```reaction
when Sessioning.use (session, subject: user), asked by reusable.accounts.identifying.Me
where
  Registering._username (user) has (username)
  earlier, RequestBoundary.request (path: "/auth/me", requestId, session)
then
  RequestBoundary.respond (requestId, username)
```

### reusable.accounts.leaving.SignOut

Authored path: `reusable.accounts.leaving.SignOut`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 11.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 14.

```reaction
when RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  Sessioning.end (session)
```

### reusable.accounts.leaving.SignOut#2

Authored path: `reusable.accounts.leaving.SignOut`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 11.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 14.

```reaction
when Sessioning.end (session), asked by reusable.accounts.leaving.SignOut
where
  earlier, RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  RequestBoundary.respond (requestId)
```

### reusable.passwords.entering.Register:accepted

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
where
  Authenticating._acceptable (password) has (acceptable: true)
then
  Registering.register (username)
```

### reusable.passwords.entering.Register:accepted#2

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when Registering.register (username, user), asked by reusable.passwords.entering.Register:accepted
where
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  Authenticating.set (password, user)
```

### reusable.passwords.entering.Register:accepted#3

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when Authenticating.set (password, user), asked by reusable.passwords.entering.Register:accepted#2
then
  Sessioning.start (subject: user)
```

### reusable.passwords.entering.Register:accepted#4

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.passwords.entering.Register:accepted#3
where
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  RequestBoundary.respond (expiresAt, requestId, session, user)
```

### reusable.passwords.entering.Register:refused

Authored path: `reusable.passwords.entering.Register`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 5.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 12.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
where
  Authenticating._acceptable (password) has (acceptable: false)
then
  RequestBoundary.respond (error: "INVALID_PASSWORD", requestId)
```

### reusable.passwords.entering.SignIn:known

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when RequestBoundary.request (password, path: "/auth/login", requestId, username)
where
  Registering._byUsername (username) has (user)
then
  Authenticating.authenticate (password, user)
```

### reusable.passwords.entering.SignIn:known#2

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when Authenticating.authenticate (password, user), asked by reusable.passwords.entering.SignIn:known
then
  Sessioning.start (subject: user)
```

### reusable.passwords.entering.SignIn:known#3

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.passwords.entering.SignIn:known#2
where
  earlier, RequestBoundary.request (password, path: "/auth/login", requestId, username)
then
  RequestBoundary.respond (expiresAt, requestId, session, user)
```

### reusable.passwords.entering.SignIn:unknown

Authored path: `reusable.passwords.entering.SignIn`.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 7.
- Covered by [Passwords](../design/compositions/reusable/passwords.md), line 13.

```reaction
when RequestBoundary.request (password, path: "/auth/login", requestId, username)
where
  no Registering._byUsername (username)
then
  RequestBoundary.respond (error: "INVALID_CREDENTIALS", requestId)
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/auth/login` — requires `password`, `username`
- `/auth/logout` — requires `session`
- `/auth/me` — requires `session`
- `/auth/register` — requires `password`, `username`
- `/catalog/post` — requires `caption`, `media`, `session`
- `/catalog/tag` — requires `category`, `name`, `post`
- `/manage/caption` — requires `caption`, `post`, `session`
- `/manage/delete` — requires `post`, `session`
- `/manage/posts` — requires `session`
- `/manage/tag/add` — requires `category`, `name`, `post`, `session`
- `/manage/tag/remove` — requires `assignment`, `post`, `session`
- `/search/post` — requires `post`
- `/search/tag` — requires `category`, `name`
- `/slot/add` — requires `folder`, `post`, `session`
- `/slot/folder` — requires `folder`, `session`
- `/slot/folder/create` — requires `name`, `session`
- `/slot/folder/delete` — requires `folder`, `session`
- `/slot/folder/rename` — requires `folder`, `name`, `session`
- `/slot/folders` — requires `session`
- `/slot/remove` — requires `folder`, `post`, `session`

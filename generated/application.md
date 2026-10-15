<!-- Generated from the Application assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# Application — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Posting

Defined in [Posting](../design/concepts/posting.md), line 1.

#### Actions

- `createPost(user: User, media: Item, caption: String) : returns (post: Post)`
- `deletePost(post: Post) : returns ()`
- `editCaption(post: Post, caption: String) : returns ()`

#### Queries

- `_get(post: Post) : optional (user: User, media: Item, caption: String)`

#### Instances

- `Posting` — instance of `Posting` — [EDIT CABINET Types](../design/types.md), line 15.
  - `Item` is `Video` — [EDIT CABINET Types](../design/types.md), line 17.
  - `User` is `Account` — [EDIT CABINET Types](../design/types.md), line 16.

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
- `_tagsFor(item: Item) : many (tag: Tag, name: String, category: Category)`

#### Instances

- `Tagging` — instance of `Tagging` — [EDIT CABINET Types](../design/types.md), line 19.
  - `Category` is `TagCategory` — [EDIT CABINET Types](../design/types.md), line 21.
  - `Item` is `Posting.Post` — [EDIT CABINET Types](../design/types.md), line 20.

## Application types

Concrete types:

- `Account` — [EDIT CABINET Types](../design/types.md), line 4.
- `TagCategory` — [EDIT CABINET Types](../design/types.md), line 10.
- `Video` — [EDIT CABINET Types](../design/types.md), line 7.

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

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

### the search result for post (post)

Authored path: `Search.PostResult`.
- Covered by [Search](../design/compositions/Search.md), line 9.

```former
Former "the search result for post (post)" — inputs (post); bindings (user, media, caption, tag, name, category); promises exactly one record — forms:
  a record of
    where Posting._get (post) has (caption, media, user)
    caption
    media
    post
    tags: each Tagging._tagsFor (item: post) has (category, name, tag)
      form a record of
        category
        name
        tag
    user
```

## Reactions

### Catalog.AttachCatalogTag:tag-exists

Authored path: `Catalog.AttachCatalogTag`.
- Covered by [Catalog](../design/compositions/Catalog.md), line 5.
- Covered by [Catalog](../design/compositions/Catalog.md), line 9.

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
- Covered by [Catalog](../design/compositions/Catalog.md), line 9.

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
- Covered by [Catalog](../design/compositions/Catalog.md), line 9.

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
- Covered by [Catalog](../design/compositions/Catalog.md), line 9.

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
- Covered by [Catalog](../design/compositions/Catalog.md), line 9.

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
- Covered by [Catalog](../design/compositions/Catalog.md), line 8.

```reaction
when RequestBoundary.request (caption, media, path: "/catalog/post", requestId, user)
then
  Posting.createPost (caption, media, user)
```

### Catalog.CreateCatalogPost#2

Authored path: `Catalog.CreateCatalogPost`.
- Covered by [Catalog](../design/compositions/Catalog.md), line 3.
- Covered by [Catalog](../design/compositions/Catalog.md), line 8.

```reaction
when Posting.createPost (caption, media, user, post), asked by Catalog.CreateCatalogPost
where
  earlier, RequestBoundary.request (caption, media, path: "/catalog/post", requestId, user)
then
  RequestBoundary.respond (post, requestId)
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

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/catalog/post` — requires `caption`, `media`, `user`
- `/catalog/tag` — requires `category`, `name`, `post`
- `/search/post` — requires `post`
- `/search/tag` — requires `category`, `name`

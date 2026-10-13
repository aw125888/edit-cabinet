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

#### Instances

- `Posting` — instance of `Posting` — [EDIT CABINET Types](../design/types.md), line 12.
  - `Item` is `Video` — [EDIT CABINET Types](../design/types.md), line 14.
  - `User` is `Account` — [EDIT CABINET Types](../design/types.md), line 13.

## Application types

Concrete types:

- `Account` — [EDIT CABINET Types](../design/types.md), line 4.
- `Video` — [EDIT CABINET Types](../design/types.md), line 7.

## Reactions

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


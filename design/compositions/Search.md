# Search

A user [searches for items associated with a tag](reaction:Search.SearchTag) by providing the tag's name and category. If the tag exists, the search returns the items associated with that tag. If the tag does not exist, the search returns no items.

The [items for a tag](former:Search.ItemsForTag) formats all items associated with a given tag as a collection for the search response.

After identifying a matching post, the application [retrieves the post for display](reaction:Search.SearchPost).

The [search result for a post](former:Search.PostResult) combines the post's user, media, and caption with all tags associated with that post.

```endpoints
Search.SearchTag at /search/tag
Search.SearchPost at /search/post
```
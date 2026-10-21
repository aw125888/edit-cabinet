# Search

A user [searches for items associated with a tag](reaction:Search.SearchTag) by providing the tag's name and category. If the tag exists, the search returns the items associated with that tag. If the tag does not exist, the search returns no items.

The [items for a tag](former:Search.ItemsForTag) formats all items associated with a given tag as a collection for the search response.

After identifying a matching post, the application [retrieves the post for display](reaction:Search.SearchPost).

The [search result for a post](former:Search.PostResult) gets the post's media, caption, and owner from `Posting._get`, resolves the owner's public username with `Registering._username`, and combines that metadata with all tags associated with the post from `Tagging._tagsFor`. The result exposes the cataloger's username rather than the internal user identity.

```endpoints
Search.SearchTag at /search/tag
Search.SearchPost at /search/post
```
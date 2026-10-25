# Catalog

A user [creates a catalog post](reaction:Catalog.CreateCatalogPost) by supplying the post's media and caption information.

After a post has been created, the application [attaches a requested tag](reaction:Catalog.AttachCatalogTag). If the tag already exists, its existing identity is assigned to the post. If it does not exist, the tag is created first and then assigned to the post.

The application [gets the total number of cataloged posts](reaction:Catalog.GetCatalogCount) to display the current size of the archive.

```endpoints
Catalog.CreateCatalogPost at /catalog/post
Catalog.AttachCatalogTag at /catalog/tag
Catalog.GetCatalogCount at /catalog/count
```
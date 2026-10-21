# Slot

A signed-in user [creates a personal folder](reaction:Slot.CreateFolder) by providing a folder name. The folder is owned by the user identified by their session.

A signed-in user [slots a post into a folder](reaction:Slot.AddToFolder) by selecting a folder and a post. The post is added only when the folder belongs to that user.

A signed-in user [views their folders](reaction:Slot.GetFolders) to see the personal folders they have created.

The [folders for a user](former:Slot.UserFolders) formats all folders owned by the given user for display.

A signed-in user [views the contents of a folder](reaction:Slot.GetFolder) only when that folder belongs to them.

The [contents of a folder](former:Slot.FolderContents) gets each saved post's media, caption, and owner from `Posting._get`, resolves the owner's public username with `Registering._username`, and formats the post for display. The result exposes the cataloger's username rather than the internal user identity.

A signed-in user [removes a post from a folder](reaction:Slot.RemoveFromFolder) only when the folder belongs to them.

A signed-in user [renames a folder](reaction:Slot.RenameFolder) only when the folder belongs to them.

A signed-in user [deletes a folder](reaction:Slot.DeleteFolder) only when the folder belongs to them.

Folder ownership is determined from `Sessioning.use`, not from a user supplied by the request. Attempts to view or modify another user's folder are refused with `FORBIDDEN`.

```endpoints
Slot.CreateFolder at /slot/folder/create
Slot.AddToFolder at /slot/add
Slot.GetFolders at /slot/folders
Slot.GetFolder at /slot/folder
Slot.RemoveFromFolder at /slot/remove
Slot.RenameFolder at /slot/folder/rename
Slot.DeleteFolder at /slot/folder/delete
```
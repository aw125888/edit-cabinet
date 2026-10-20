# Slot

A user [creates a personal folder](reaction:Slot.CreateFolder) by providing a folder name. The folder is owned by that user.

A user [slots a post into a folder](reaction:Slot.AddToFolder) by selecting a folder and a post. The post is added to that folder.

A user [views their folders](reaction:Slot.GetFolders) to see the personal folders they have created.

The [folders for a user](former:Slot.UserFolders) formats all folders owned by the given user for display.

A user [views the contents of a folder](reaction:Slot.GetFolder) to see the posts saved in that folder.

The [contents of a folder](former:Slot.FolderContents) formats the posts contained in a folder with their media, caption, and author information for display.

A user [removes a post from a folder](reaction:Slot.RemoveFromFolder) when they no longer want that post saved in the folder.

A user [renames a folder](reaction:Slot.RenameFolder) to change how their saved posts are organized.

A user [deletes a folder](reaction:Slot.DeleteFolder) when they no longer want that folder.

```endpoints
Slot.CreateFolder at /slot/folder/create
Slot.AddToFolder at /slot/add
Slot.GetFolders at /slot/folders
Slot.GetFolder at /slot/folder
Slot.RemoveFromFolder at /slot/remove
Slot.RenameFolder at /slot/folder/rename
Slot.DeleteFolder at /slot/folder/delete

```
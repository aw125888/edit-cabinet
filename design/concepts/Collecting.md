# Collecting

## Purpose

Enable users to maintain personal organizations of items.

## Principle

A user can create a named folder and add items to it, allowing the items to be organized together. Items can be removed from folders.

## Types

```types
external User
external Item
```

## State

```state
a set of Folders with
  an owner User
  a name String

a set of FolderItems with
  a folder Folder
  an item Item

Rule: each owner and name identifies at most one Folder.
Rule: each folder and item identifies at most one FolderItem.
```

## Actions
```actions
createFolder(user: User, name: String): returns (folder: Folder)
  where no Folder with given user and name exists
  then
    create a new Folder with owner set to user
    and name set to given name
    returns folder

deleteFolder(folder: Folder): returns ()
  where folder exists
  then
    remove folder
    and remove all FolderItems for folder
    returns

addToFolder(folder: Folder, item: Item): returns (entry: FolderItem)
  where folder exists and no FolderItem with given folder and item exists
  then
    create a FolderItem with given folder and item
    returns entry

removeFromFolder(folder: Folder, item: Item): returns ()
  where FolderItem with given folder and item exists
  then
    remove that FolderItem
    returns

removeFromAllFolders(item: Item): returns ()
  where true
  then
    remove every FolderItem with given item
    returns

renameFolder(folder: Folder, name: String): returns ()
  where folder exists and its owner has no other Folder with given name
  then
    replace folder's name with given name
    returns
```

## Queries

```queries
_foldersFor(user: User): many (folder: Folder, name: String)
  answers every Folder owned by the given user
  ordered by folder

_itemsIn(folder: Folder): many (item: Item)
  answers every item contained in the given folder
  ordered by item
```

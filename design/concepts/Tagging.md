# Tagging

## Purpose

Associate items with reusable descriptive labels.

## Principle

A label within a category can be associated with multiple items. Labels can be added to or removed from an item.

## Types

```types
external Item
external Category
```

## State

```state
a set of Tags with
  a name String
  a category Category
  unique name and category

a set of TagAssignments with
  an item Item
  a tag Tag
  unique item and tag
```

## Actions

```actions
createTag(name: String, category: Category): returns (tag: Tag)
  where Tag with given name and category does not exist
  then
    create a new Tag with given name and category
    returns tag

tagItem(item: Item, tag: Tag): returns (assignment: TagAssignment)
  where tag exists and TagAssignment with given item and tag does not exist
  then
    create a new TagAssignment with given item and tag
    returns assignment

untagItem(assignment: TagAssignment): returns ()
  where assignment exists
  then
    remove assignment
    returns

untagAll(item: Item): returns ()
  where true
  then
    remove all TagAssignments with given item
    returns
```

## Queries

```queries
_itemsFor(tag: Tag) : many (item: Item)
  answers each item associated with the given tag,
  ordered deterministically by item

_findTag(name: String, category: Category): optional (tag: Tag)
    answers tag with given name and category if exists within Tags, else no row when no such Tag exists
```
# Manage

Authenticated users can manage the Posts they cataloged. A user can edit their captions, add or remove tags, and delete their Posts. Managing a Post never exposes information about who has collected it or which folders contain it.

The interface allows at most five tags in each category and requires a managed Post to retain at least one tag.

Changing a Post's tags changes the categorization of that Post wherever it is displayed, including when another user has saved the Post in a folder. It does not modify another user's folders or other Posts' tag assignments.

When a Post is deleted, its tags and folder references are also removed so that Tagging and Collecting do not retain references to a nonexistent Post.

```endpoints
Manage.GetPosts at /manage/posts
Manage.EditCaption at /manage/caption
Manage.AddTag at /manage/tag/add
Manage.RemoveTag at /manage/tag/remove
Manage.DeletePost at /manage/delete
```

The [get posts endpoint](reaction:Manage.GetPosts) uses the session to identify the signed-in user, then returns the Posts cataloged by that user together with their current tags.

The [edit caption endpoint](reaction:Manage.EditCaption) uses the session to identify the signed-in user and checks the Post with `Posting._get`. If the Post belongs to that user, it updates the caption with `Posting.editCaption`. If the Post does not belong to the user, the request is refused with `FORBIDDEN`.

The [add tag endpoint](reaction:Manage.AddTag) uses the session to identify the signed-in user and checks the Post with `Posting._get`. If the Post belongs to that user, it reuses the Tag with the requested name and category if one already exists, or creates the Tag if it does not, then associates that Tag with the Post. If the Post does not belong to the user, the request is refused with `FORBIDDEN`.

The [remove tag endpoint](reaction:Manage.RemoveTag) uses the session to identify the signed-in user and checks the Post with `Posting._get`. It also verifies that the requested TagAssignment belongs to that Post. If both checks succeed, it removes that TagAssignment. Otherwise, the request is refused with `FORBIDDEN`.

The [delete post endpoint](reaction:Manage.DeletePost) uses the session to identify the signed-in user and checks the Post with `Posting._get`. If the Post belongs to that user, it removes the Post's tag assignments with `Tagging.untagAll`, removes the Post from all folders with `Collecting.removeFromAllFolders`, and finally deletes the Post with `Posting.deletePost`. If the Post does not belong to the user, the request is refused with `FORBIDDEN`.

The [user posts view](former:Manage.UserPosts) forms the Posts cataloged by a user, including each Post's identity, media, caption, and current tags. It does not expose folder or collection information.
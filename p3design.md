# P3 Design Notebook

## Post Ownership and Attribution

Posts are owned by the user who catalogs them. However, each post's metadata displays **"Cataloged by"** rather than "owner" or "author" because archivists are not equivalent to creators. Someone cataloging an edit is not necessarily the creator of that edit. This distinction allows the application to enforce ownership for management purposes without falsely attributing creative authorship.

## Page Divisions

The home page primarily displays actions that lead to the Catalog and Search pages. Personal views, including My Personal Collections and My Edits, are available through the profile menu.

This decision distinguishes actions from ownership. No personal account owns the Search or Catalog action, while each account is linked to its own collections and cataloged edits. Separating these views reflects that difference.

## Managing Cataloged Posts

Users can edit the captions or delete Posts that they cataloged. They can also add and remove tags, as long as the minimum and maximum tag requirements are respected. This functionality is handled through the Vue frontend and the Manage composition.

## Post Deletion and Cleanup

Deleting a Post also requires cleaning up its associated Tagging and Collecting references. Otherwise, deleted Posts could leave behind tag assignments or folder references that point to content that no longer exists.

## Private Collections and Engagement

Collections and folder saves are private, and no engagement analytics are made available.

This decision has two motivations. First, Edit Cabinet is an archive rather than a social media platform. It is designed as a partner to video-hosting platforms such as TikTok, Instagram, and YouTube. Likes, comments, and save counts belong to those platforms and are not necessary features within the archive.

Second, Post owners in Edit Cabinet are owners in the cataloging sense rather than necessarily in the creative sense. Because the person who catalogs an edit may not be its creator, engagement analytics would not necessarily be personal to the cataloger either.

## Cataloger Identity

The cataloger's username functions as attribution, not as a public profile. Its purpose is to identify who added an edit to the archive rather than create another social-media identity around that user.

## URL-Based Video Media

Video media remains URL-based. Originally, the vision for Edit Cabinet included hosting and playing videos directly within the site. As the project developed, Edit Cabinet shifted toward functioning as a partner to video-hosting platforms rather than an independent video-host
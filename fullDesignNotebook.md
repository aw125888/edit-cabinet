# EDIT CABINET — Final Design Document

## P1: Initial Design

### Note on Choosing the Name EDIT CABINET

This application is not meant to be a substitute for social media. It is not a “TikTok” or “Instagram” copy that exclusively hosts edits. Rather, EDIT CABINET is an edit-specific site that attempts to represent edits as a series of relationships. It can be thought of as a sort of archive. The term “Cabinet” attempts to linguistically express that difference: the site’s primary role is as an organizer rather than a socialite.

---

## P2: Design Notes

### Implementation Plan

My P2 MVP focuses on the Catalog → Search user journey.

I planned to implement it incrementally:

1. Implement and test the Posting concept.
2. Implement and test the Tagging concept.
3. Compose the Catalog endpoints.
4. Connect Catalog to a minimal Vue frontend.
5. Implement the reads and composition needed for Search.
6. Connect Search to Vue and test the complete user journey.

### Significant Decisions and Changes

#### Narrowing the P2 Scope

The full product includes individual user profiles and user authentication. Furthermore, the full product includes the Slot concept, which allows users to save edits into personalized folders. P2's MVP focuses on a specific central user journey that demonstrates EDIT CABINET's main goal of correctly archiving edits and surfacing them according to the connections they make. In P3, these additional features will be added, along with visual polish.

#### Multi-Tag Cataloging

In order to work within the Sync-Engine framework, instead of writing a for loop within a reaction during multi-tagging (iterating through each tag and attaching it to the Post), Catalog uses a TypeScript for loop in the frontend. The loop goes through each tag and makes a request to attach that tag to the Post.

#### Tag Uniqueness and Case Insensitivity

I made the decision to make each tag case-insensitive. Tags are created by the user and thus may be subject to unpredictable variation. This is useful in the sense that edits can be archived in a very personal way; however, details such as letter case, which have no effect on the semantic meaning of a tag, should not cause separate tags to be created. For example, `Minimalism`, `MINIMALISM`, and `minimalism` are all treated as the same tag.

#### Search and Ranking

A search is submitted with a set containing at least one tag. The frontend searches each selected tag and requests information from the backend about the Posts associated with each tag. It then sorts the Posts by match count and surfaces each Post and its metadata in order of the number of matching tags.

### Validation

I tested Posting and Tagging independently with Bun tests, including successful actions and error cases such as duplicate tags, duplicate assignments, nonexistent tags, and nonexistent assignments. I also added tests for case-insensitive tag lookup and uniqueness.

I then added integration tests for Catalog and Search. Catalog tests check both creating missing tags and reusing existing tags. Search tests check finding Posts by an existing tag, returning no Posts for a nonexistent tag, and retrieving a Post's media, caption, user, and complete tag set.

I also manually tested the full application through Vue by cataloging an edit and searching for it by tags.

### Challenges and Interesting Moments

#### Understanding Sync-Engine Composition

Sync-Engine took some time to get used to. It was really interesting to work with its “auto-checking system,” which clearly separated concepts from composition and made sure that no concepts relied on one another. It also really hammered in the more abstract concepts taught in class, since our code specifically had to be structured this way.

### Remaining Work for P3

- Authentication & User Profiles
- Slot/folder functionality
- Video upload/storage rather than accepting a video URL
- Frontend styling

---

## P3: Design Notebook

### Post Ownership and Attribution

Posts are owned by the user who catalogs them. However, each Post's metadata displays **“Cataloged By”** rather than “owner” or “author” because archivists are not equivalent to creators. Someone cataloging an edit is not necessarily the creator of that edit. This distinction allows the application to enforce ownership for management purposes without falsely attributing creative authorship.

### Page Divisions

The home page primarily displays actions that lead to the Catalog and Search pages. Personal views, including My Personal Collections and My Edits, are available through the profile menu.

This decision distinguishes actions from ownership. No personal account owns the Search or Catalog action, while each account is linked to its own collections and cataloged edits. Separating these views reflects that difference.

### Managing Cataloged Posts

Users can edit the captions or delete Posts that they cataloged. They can also add and remove tags, as long as the minimum and maximum tag requirements are respected. This functionality is handled through the Vue frontend and the Manage composition.

### Post Deletion and Cleanup

Deleting a Post also requires cleaning up its associated Tagging and Collecting references. Otherwise, deleted Posts could leave behind tag assignments or folder references that point to content that no longer exists.

### Private Collections and Engagement

Collections and folder saves are private, and no engagement analytics are made available.

This decision has two motivations. First, EDIT CABINET is an archive rather than a social media platform. It is designed as a partner to video-hosting platforms such as TikTok, Instagram, and YouTube. Likes, comments, and save counts belong to those platforms and are not necessary features within the archive.

Second, Post owners in EDIT CABINET are owners in the cataloging sense rather than necessarily in the creative sense. Because the person who catalogs an edit may not be its creator, engagement analytics would not necessarily be personal to the cataloger either.

### Cataloger Identity

The cataloger's username functions as attribution, not as a public profile. Its purpose is to identify who added an edit to the archive rather than create another social-media identity around that user.

### URL-Based Video Media

Video media remains URL-based. Originally, the vision for EDIT CABINET included hosting and playing videos directly within the site. As the project developed, EDIT CABINET shifted toward functioning as a partner to video-hosting platforms rather than an independent video host.

---

## P4: Final Design

### Final Design Changes

My final design differs from my initial concept design in P1 in three main ways.

#### EDIT CABINET as a Partner Archive

While P1 and P2 did not officially address EDIT CABINET's status as an independent video-hosting website or a partner archive to established video-hosting sites, P3 and P4 committed to this decision.

While the concept of an archive of edits is quite novel, the concept of a social-media video-hosting application is not. It seemed far more fresh and interesting to commit to creating the archive. As a result, video media remains URL-based rather than being uploaded and hosted directly within EDIT CABINET.

#### Addition of Manage

P1 only anticipated three compositions: **Slot, Catalog, and Search**. A fourth composition, **Manage**, was created so that users could edit the videos they cataloged by changing their captions, tags, or both. This provides more flexibility for users.

#### Catalogers Rather Than Creators

The idea of users of EDIT CABINET as catalogers, rather than creators, was established as the project developed. Initially, it was assumed that those who cataloged an edit also owned the edit in a creative sense.

However, as EDIT CABINET shifted to become a video-URL-populated platform rather than a video-hosting platform, it also made sense to distinguish that anyone can catalog an edit. Ownership is established by the link and is therefore the responsibility of the video-hosting sites.

Each Post's metadata therefore displays **“Cataloged By”** rather than “owner” or “author.” Someone cataloging an edit is not necessarily the creator of that edit.

A duplicate-link check was also created so that no link can be cataloged more than once.

### Changes From P3 Visual Design

I spent a lot of time on visual decisions in P3, so visual changes are minimal going from P3 to P4.

#### Dynamic Archive Count

A dynamic piece of subtext was added to the home screen displaying the total number of edits cataloged site-wide. This creates a more community-like feel across the site.

#### Action Colors

I changed the **Add Tag** and **Create Folder** actions from red to green to communicate the act of creation rather than deletion, an act with which red is more commonly associated.

#### Navigation Terminology

Finally, I changed the profile navigator's **“My Cabinet”** to **“Slotted By Me”** and **“My Edits”** to **“Cataloged By Me,”** as I believed these labels fit their purposes more clearly.
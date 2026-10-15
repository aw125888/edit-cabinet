# P2 Design Notes

## Implementation Plan

My P2 MVP focuses on the Catalog → Search user journey.

I planned to implement it incrementally:

1. Implement and test the Posting concept
2. Implement and test the Tagging concept
3. Compose the Catalog endpoints
4. Connect Catalog to a minimal Vue frontend
5. Implement the reads and composition needed for Search
6. Connect Search to Vue and test the complete user journey

## Significant Decisions and Changes

### Narrowing the P2 Scope

The full product includes individual user profiles and user authentication. Furthermore, the full product includes the Slot concept, which allows users to save edits into personalized folders. P2's MVP focuses on a specific central user journey that demonstrates EDIT CABINET's main goal of correctly archiving edits and surfacing them according to the connections they make. In P3, these additional features will be added, along with visual polish.

### Multi-Tag Cataloging

In order to work within the Sync-Engine framework, instead of writing a for loop within a reaction during multi-tagging (iterating through each tag and attaching it to the Post), Catalog uses a TypeScript for loop in the frontend. The loop goes through each tag and makes a request to attach that tag to the Post.

### Tag Uniqueness and Case Insensitivity

I made the decision to make each tag case-insensitive. Tags are created by the user and thus may be subject to unpredictable variation. This is useful in the sense that edits can be archived in a very personal way; however, details such as letter case, which have no effect on the semantic meaning of a tag, should not cause separate tags to be created. For example, `Minimalism`, `MINIMALISM`, and `minimalism` are all treated as the same tag.

### Search and Ranking

A search is submitted with a set containing at least one tag. The frontend searches each selected tag and requests information from the backend about the Posts associated with each tag. It then sorts the Posts by match count and surfaces each Post and its metadata in order of the number of matching tags.

## Validation

I tested Posting and Tagging independently with Bun tests, including successful actions and error cases such as duplicate tags, duplicate assignments, nonexistent tags, and nonexistent assignments. I also added tests for case-insensitive tag lookup and uniqueness.

I then added integration tests for Catalog and Search. Catalog tests check both creating missing tags and reusing existing tags. Search tests check finding Posts by an existing tag, returning no Posts for a nonexistent tag, and retrieving a Post's media, caption, user, and complete tag set.

I also manually tested the full application through Vue by cataloguing an edit and searching for it by tags. 

## Challenges and Interesting Moments

### Understanding Sync-Engine Composition

Sync-Engine took some time to get used to. It was really interesting to work with its "auto-checking system," which clearly separated concepts from composition and made sure that no concepts relied on one another. It also really hammered in the more abstract concepts taught in class, since our code specifically had to be structured this way.

## Remaining Work for P3

- Authentication & User Profiles
- Slot/folder functionality
- Video upload/storage rather than accepting a video URL
- Frontend styling
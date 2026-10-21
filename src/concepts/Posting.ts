import type { Collection, Db} from "mongodb"; 


export interface Post<User extends string, Item extends string> {
    _id: string; 
    author: User; 
    media: Item; 
    caption: string; 
}

export class PostingConcept<User extends string, Item extends string> {
    private readonly posts: Collection<Post<User, Item>>;
    constructor(db: Db) {
        this.posts = db.collection<Post<User, Item>>("posting.posts"); 
    }

    async createPost({user, media, caption}: {user: User; media: Item; caption: string}): Promise<{post: string}> {
        const post: Post<User, Item> = {
            _id: crypto.randomUUID(), 
            author: user,
            media: media, 
            caption: caption
        }; 

        await this.posts.insertOne(post); 
        return {post: post._id};
    }

    async deletePost({post}: {post: string}): Promise<{}>
 {

        const postExists = await this.posts.findOne({_id: post});
        if (postExists) {
            await this.posts.deleteOne({_id: post});
            return {}; 
        }
        else {
            throw new Error(`Post with ID ${post} does not exist.`);
        }
    }

    async editCaption({post, caption}: {post: string; caption: string}): Promise<{}> {
        const postExists = await this.posts.findOne({_id: post});
        if (postExists) {
            await this.posts.updateOne({_id: post}, {$set: {caption: caption}});
            return {};
        } else {
            throw new Error(`Post with ID ${post} does not exist.`);
        }

    }

    async _get(
        { post }: { post: string }
        ): Promise<{ user: User; media: Item; caption: string }[]> {
        
            const found = await this.posts.findOne({ _id: post });

        if (found === null) {
            return [];
        }

        return [{
            user: found.author,
            media: found.media,
            caption: found.caption,
        }];
        }

    async _postsBy(
  { user }: { user: User }
): Promise<{ post: string; media: Item; caption: string }[]> {
  const found = await this.posts
    .find({ author: user })
    .toArray();

  return found.map((post) => ({
    post: post._id,
    media: post.media,
    caption: post.caption,
  }));
}



}


import { Prisma, PrismaClient } from "@prisma/client";
import express from "express";
import { postRepository as repository, schema } from "../redis/repository";
import client from "../elastisearch/client";
import { run } from "../kafka/producer";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.post(`/signup`, async (req, res) => {
  const { name, email, posts } = req.body;

  const postData = posts?.map((post: Prisma.PostCreateInput) => {
    return { title: post?.title, content: post?.content };
  });

  const result = await prisma.user.create({
    data: {
      name,
      email,
      posts: {
        create: postData,
      },
    },
  });
  res.json(result);
});

app.post(`/post`, async (req, res) => {
  const { title, content, authorEmail } = req.body;
  const result = await prisma.post.create({
    data: {
      title,
      content,
      author: { connect: { email: authorEmail } },
    },
  });
  res.json(result);
});

app.put("/post/:id/views", async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.update({
      where: { id: Number(id) },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    res.json(post);
  } catch (error) {
    res.json({ error: `Post with ID ${id} does not exist in the database` });
  }
});

app.put("/publish/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const postData = await prisma.post.findUnique({
      where: { id: Number(id) },
      select: {
        published: true,
      },
    });

    const updatedPost = await prisma.post.update({
      where: { id: Number(id) || undefined },
      data: { published: !postData?.published },
    });
    res.json(updatedPost);
  } catch (error) {
    res.json({ error: `Post with ID ${id} does not exist in the database` });
  }
});

app.delete(`/post/:id`, async (req, res) => {
  const { id } = req.params;
  const post = await prisma.post.delete({
    where: {
      id: Number(id),
    },
  });
  res.json(post);
});

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get("/user/:id/drafts", async (req, res) => {
  const { id } = req.params;

  const drafts = await prisma.user
    .findUnique({
      where: {
        id: Number(id),
      },
    })
    .posts({
      where: { published: false },
    });

  res.json(drafts);
});

app.get(`/post/:id`, async (req, res) => {
  const { id }: { id?: string } = req.params;

  const post = await prisma.post.findUnique({
    where: { id: Number(id) },
  });
  res.json(post);
});

app.get(`/post`, async (req, res) => {
  const { searchString } = req.query;

  const body = await client.search({
    index: "posts",
    body: {
      query: {
        match: { title: String(searchString) },
      },
    },
  });
  console.log(body.hits.hits);

  res.json(body);
});

app.get("/feed", async (req, res) => {
  const { searchString, skip, take, orderBy } = req.query;

  run().catch(console.error);

  const cached = await repository.search().returnAll();

  if (cached.length !== 0) {
    console.log("Cache found!");
  }

  const or: Prisma.PostWhereInput = searchString
    ? {
        OR: [
          { title: { contains: searchString as string } },
          { content: { contains: searchString as string } },
        ],
      }
    : {};

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      ...or,
    },
    include: { author: true },
    take: Number(take) || undefined,
    skip: Number(skip) || undefined,
    orderBy: {
      updatedAt: orderBy as Prisma.SortOrder,
    },
  });

  //Elasticache should execute when new data inserted
  /* client.indices.create({
    index: "posts",
    mappings: {
      properties: {
        id: { type: 'integer' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        title: { type: 'text' },  
        content: { type: 'text' },
        published: { type: 'boolean' },
        viewCount: { type: 'integer' },
        authorId: { type: 'integer' }
      }
    }
  },  { ignore: [400] })

  const operations = posts.flatMap(doc => [{ index: { _index: 'posts' } }, doc])

  const bulkResponse = await client.bulk({ refresh: true, operations })

  if (bulkResponse.errors) {
    const erroredDocuments = []
    // The items array has the same order of the dataset we just indexed.
    // The presence of the `error` key indicates that the operation
    // that we did for the document has failed.
    bulkResponse.items.forEach((action, i) => {
      const operation = Object.keys(action)[0]
      if (action[operation].error) {
        erroredDocuments.push({
          // If the status is 429 it means that you can retry the document,
          // otherwise it's very likely a mapping error, and you should
          // fix the document before to try it again.
          status: action[operation].status,
          error: action[operation].error,
          operation: operations[i * 2],
          document: operations[i * 2 + 1]
        })
      }
    })
    console.log(erroredDocuments)
  }

  const count = await client.count({ index: 'posts' })

  const postsResult = {};
  posts.forEach((element) => {
  postsResult[element.id] = JSON.stringify(element);
});
 */

  if (cached.length === 0) {
    posts.map((post) => {
      repository.save(post);
    });
  }

  res.json(cached.length > 0 ? cached : posts);
});

const server = app.listen(4000, () =>
  console.log(`
🚀 Server ready at: http://localhost:4000
⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api`)
);

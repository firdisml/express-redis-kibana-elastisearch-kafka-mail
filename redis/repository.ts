import { Schema, Repository } from 'redis-om'
import { redis } from './client'

const schema = new Schema('posts', {

  id: { type: 'number' },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
  title: { type: 'string' },  
  content: { type: 'string' },
  published: { type: 'boolean' },
  viewCount: { type: 'number' },
  authorId: { type: 'number' }

})

export const postRepository = new Repository(schema, redis)

await postRepository.createIndex()
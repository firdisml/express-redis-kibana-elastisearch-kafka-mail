import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: "myQueue",
    brokers: ['localhost:29092']
})

const producer = kafka.producer()

export const run = async () => {
    await producer.connect()

    await producer.send({
        topic: 'Post',
        messages: [{ value: "Post is successfully created!" }]
    })

    console.log("Message Successfully sent")
}
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: "myQueue",
    brokers: ['localhost:29092']
})

const producer = kafka.producer()

export const run = async () => {
    await producer.connect()

    await producer.send({
        topic: 'Email',
        messages: [{ value: "This is email" }]
    })

    console.log("Successfully sent")
}
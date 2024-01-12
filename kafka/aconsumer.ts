import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: "myQueue",
    brokers: ['localhost:29092']
})

const consumer = kafka.consumer({groupId: "Post"})

export const run = async () => {
    await consumer.connect()
    await consumer.subscribe({ topic: "Post", fromBeginning: true})

    await consumer.run({
        eachMessage: async ({ partition, message }) => {
            console.log(message.value.toString())
        }
    })

    console.log("Message Ready To Be Recevied!")
}

run();

//Run consumer separately
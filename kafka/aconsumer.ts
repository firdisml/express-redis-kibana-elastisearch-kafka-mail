import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: "myQueue",
    brokers: ['localhost:29092']
})

const consumer = kafka.consumer({groupId: "Email"})

export const run = async () => {
    await consumer.connect()
    await consumer.subscribe({ topic: "Email", fromBeginning: true})

    await consumer.run({
        eachMessage: async ({ partition, message }) => {
            console.log(message.value.toString())
        }
    })

    console.log("Recevied")
}

run();

//Run consumer separately
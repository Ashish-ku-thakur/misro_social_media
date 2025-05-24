const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let chennel = null;

const EXCHANGE_NAME = "facebook_events";

async function connectToRabbitMQ() {
  logger.info("connectToRabbitMQ function starting...");

  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    chennel = await connection.createChannel();

    await chennel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

    logger.info("connected To RabbitMQ function");
  } catch (error) {
    logger.error("Error to connectToRabbitMQ function starting...", error);
  }
}

async function consumeEvent(routingKey, callback) {
  if (!chennel) {
    await connectToRabbitMQ();
  }

  const q = await chennel.assertQueue("", { exclusive: true });
  await chennel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

  chennel.consume(q.queue, (msg) => {
    if (msg !== null) {
      const content = JSON.parse(msg.content.toString());
      callback(content);
      chennel.ack(msg);
    }

    logger.info(`Subscribed to event: ${routingKey}`);
  });
}

module.exports = { connectToRabbitMQ,  consumeEvent };

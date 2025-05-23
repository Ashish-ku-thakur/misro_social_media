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

async function publishEvent(routingKey, message) {
  if (!chennel) {
    await connectToRabbitMQ();
  }

  chennel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );
logger.info(`Event Published :${routingKey}`);
  
}

module.exports = {connectToRabbitMQ, publishEvent};

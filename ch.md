version: '3.8'

services:
  api-gateway:
    build:
    context: ./api-gateway  // 
    container_name: api-gateway
    depends_on:
      - identity-service
      - post-service
      - media-service
      - search-service
      - redis
    ports:
      - "3000:3000"
    env_file:
      - ./api-gateway/.env
    volumes:
      - ./api-gateway:/usr/src/app
      - /usr/src/app/node_modules

    identity-service:
      build:
      context: ./identity-service //
      container_name: identity-service
      depends_on:
        - mongo
        - redis
      ports:
        - "3001:3001"
      env_file:
        - ./identity-service/.env
      volumes:
        - ./identity-service:/usr/src/app
        - /usr/src/app/node_modules

    post-service:
      build:
      context: ./post-service //
      container_name: post-service
      depends_on:
        - mongo
        - redis
        - rabbitmq
      ports:
        - "3002:3002"
      env_file:
        - ./post-service/.env
      volumes:
        - ./post-service:/usr/src/app
        - /usr/src/app/node_modules

    media-service:
      build:
      context: ./media-service
      container_name: media-service
      depends_on:
        - mongo
        - redis
        - rabbitmq
      ports:
        - "3003:3003"
      env_file:
        - ./media-service/.env
      volumes:
        - ./media-service:/usr/src/app
        - /usr/src/app/node_modules

    search-service:
      build:
      context: ./search-service
      container_name: search-service
      depends_on:
        - mongo
        - redis
        - rabbitmq
      ports:
        - "3004:3004"
      env_file:
        - ./search-service/.env
      volumes:
        - ./search-service:/usr/src/app
        - /usr/src/app/node_modules

  mongo:
    image: mongo:6
    container_name: mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:7
    container_name: redis
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3-management
    container_name: rabbit
    ports:
      - "5672:5672"
      - "15672:15672"
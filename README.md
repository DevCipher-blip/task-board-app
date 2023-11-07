# GraphQL task board

## Trace a card move through the API

The browser under [mini_trello_fe/](mini_trello_fe/) communicates with the backend under [mini_trello_be/](mini_trello_be/). Follow a card move from UI state through its GraphQL mutation and back to persisted board/list data.

A virtual environment is generated state, so recreate it from the backend requirements rather than distributing it as source. For a stronger engineering walkthrough, demonstrate a failed mutation, reordering persistence, and access to another user's board; drag-and-drop alone does not establish consistency or authorization.

For persistent Django sessions, supply `DJANGO_SECRET_KEY` (or `SECRET_KEY`) in the process environment. Local development uses a fresh temporary signing key when neither is set.

## Table of Contents

- [About](#about)
- [Node.js Version Requirement](#nodejs-version-requirement)
- [Postman Collection](#postman-collection)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Using Docker](#using-docker)
- [Accessing the Frontend](#accessing-the-frontend)

## About

Mini Trello is a lightweight project management tool that provides a user-friendly interface for organizing tasks and projects. It is built with modern web technologies, making it easy to set up and customize to your needs.

## Node.js Version Requirement

Mini Trello requires Node.js version 18 to run. Ensure that you have Node.js 18 or a compatible version installed on your system.

## Postman Collection

Explore the Mini Trello API using the Postman collection:

- [Mini Trello Postman Collection](https://api.postman.com/collections/11916570-f6c530d6-541c-4b1d-bf33-419029fdb1a4?access_key=PMAT-01HEMYG2PMA7D87FQAGS4BJ1MR)

## Repository Structure

Mini Trello is contained within a single repository, making it convenient to manage both the frontend and backend components, along with the Docker Compose configuration, all in one place.

### Frontend and Backend

- The frontend code is located in the `/mini_trello_fe` directory within this repository.
- The backend code is located in the `/mini_trello_be` directory within this repository.

### Docker Compose

The Docker Compose configuration file, which orchestrates the deployment of the frontend, backend, and any necessary services, can be found in the root directory of this repository.

This structure allows for easy management and deployment of the entire Mini Trello application from a single repository.

## Tech Stack

Mini Trello is built using the following technologies:

- **Frontend:**

  - React

- **Backend:**

  - GraphQL
  - Python

- **Database:**

  - Amazon DynamoDB Local

- **Deployment:**
  - Docker

This tech stack forms the foundation of Mini Trello, providing a powerful and scalable platform for managing your tasks and projects.

## Getting Started

To run Mini Trello locally, you can use Docker Compose. Make sure you have the following prerequisites installed on your system:

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Using Docker

1. Clone the Mini Trello repository:

   ```bash
   git clone https://github.com/DevCipher-blip/task-board-app.git
   cd mini-trello
   ```

2. Build and start the containers:

   ```bash
   docker-compose build
   docker-compose up -d
   ```

This will create and start Docker containers for the frontend, backend, and DynamoDB services defined in the `docker-compose.yml` file.

## Accessing the Frontend

After successfully running the project with Docker, you can access the Mini Trello frontend by opening your web browser and navigating to [http://localhost:3000](http://localhost:3000). This is where you can interact with the user-friendly interface and manage your tasks and projects.

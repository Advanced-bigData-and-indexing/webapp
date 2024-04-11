# Enhanced Distributed JSON Object Management System (E-DJOMS) Webapp

Author: Dhruv Parthasarathy
NUID: 002919280

[![Unit Test and Build](https://github.com/Advanced-bigData-and-indexing/webapp/actions/workflows/test-and-build.yml/badge.svg)](https://github.com/Advanced-bigData-and-indexing/webapp/actions/workflows/test-and-build.yml)

[![Integration Test](https://github.com/Advanced-bigData-and-indexing/webapp/actions/workflows/integration-test.yml/badge.svg)](https://github.com/Advanced-bigData-and-indexing/webapp/actions/workflows/integration-test.yml)

## Overview

The E-DJOMS Webapp is a modern backend infrastructure designed for the efficient storage, retrieval, and management of JSON data. By combining the capabilities of Redis, Elasticsearch, RabbitMQ, and OAuth 2.0, the system offers a comprehensive solution for handling complex JSON structures, providing robust search capabilities, asynchronous processing, and secure API access within distributed environments.

### Key Features
- Redis-based data storage with relationship maintenance.
- Full-text search capabilities powered by Elasticsearch.
- Decoupled services and scalability offered by RabbitMQ.
- Secure authentication and authorization through OAuth 2.0.
- Adherence to microservices architecture for independent scaling and deployment.
- Consistent and atomic transactions to ensure data integrity.

The application is designed to cater to high-demand sectors like finance, social networking, and supply chain management, where complex data relationships and fast access are paramount.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js
- npm (Node Package Manager)

### Clone the Repository

Clone the project repository to your local machine using the following SSH command:
```
git clone https://github.com/Advanced-bigData-and-indexing/webapp.git
```

### Running the Application

- Install all dependencies with `npm i`.
- Execute all test cases using `npx jest`.
- Launch the development environment with `npm run dev`.
- Verify the system's health with `sh testHealthz.sh`.

## Features

- Utilization of `zod` for schema validation ensuring strong typing and error checking.

## API Endpoints
<!-- List out the API endpoints and their purposes -->

## Output
<!-- Provide any output, performance metrics, or screenshots that are relevant -->

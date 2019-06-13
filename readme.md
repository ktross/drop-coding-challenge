# Drop Coding Challenge

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [API Endpoints](#api-endpoints)
  3.1 [Insomnia Workspace](#insomnia-workspace)
  4.1 [cURL Requests](#curl-requests)
4. [Example HTTP Requests](#example-http-requests)

## Prerequisites

* [Node.js 10.x](https://nodejs.org/en/download/)

## Getting Started

1. Clone this repository: `git clone https://github.com/ktross/drop-coding-challenge.git`
2. Install Node modules: `npm install`
3. Run Node app: `node api.js`

By default, node will listen for requests on **port 3000**. To quit the application, press `ctrl+c`.

## API Endpoints

| URL               | Method | URL Params | Data Params       | Description                    |
| ----------------- | ------ | ---------- | ----------------- | ------------------------------ |
| /jobs             | GET    |            |                   | Get all jobs                   |
| /jobs             | POST   |            | (string) payload  | Create job                     |
| /jobs/:id         | GET    | (int) id   |                   | Get specified job              |
| /jobs/:id         | DELETE | (int) id   |                   | Delete specified job           |
| /jobs/:id/results | GET    | (int) id   |                   |  Get results for specified job |

## Example HTTP Requests

### Insomnia Workspace

If you're using [Insomnia](https://insomnia.rest/), you can import the workspace found at **insomnia.json**. This includes all of the requests below.

### cURL Requests

GET /jobs
```
curl --request GET \
  --url http://127.0.0.1:3000/jobs
```

POST /jobs
```
curl --request POST \
  --url http://127.0.0.1:3000/jobs \
  --header 'content-type: application/json' \
  --data '{ "payload": "https://www.google.com" }'
```

GET /jobs/:id
```
curl --request GET \
  --url http://127.0.0.1:3000/jobs/1
```

DELETE /jobs/:id
```
curl --request DELETE \
  --url http://127.0.0.1:3000/jobs/1
```

GET /jobs/:id/results
```
curl --request GET \
  --url http://127.0.0.1:3000/jobs/1/results
```
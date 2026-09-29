Architecture overview (placeholder)

The Visual AI Agent monorepo is organized as a set of loosely-coupled services and frontend assets:

- extension: Chrome extension (client-side) communicating with the backend for heavy processing
- backend: FastAPI microservice exposing REST/HTTP endpoints (and later gRPC/WS where needed)
- dashboard: React-based admin/operator UI
- database: PostgreSQL as the primary durable store
- docker: Compose and Dockerfiles to coordinate local development and production builds

TODO: Expand this file with component diagrams, data flow, and sequence diagrams.

Visual AI Agent

A production-grade monorepo foundation for the Visual AI Agent project.

This repository is a scaffold only. Business logic and features will be implemented in subsequent tasks.

Monorepo layout

visual-ai-agent/
  extension/        # Chrome Extension (Manifest V3)
  backend/          # FastAPI backend (Python)
    app/
      api/
      models/
      services/
      core/
      database/
  dashboard/        # React dashboard (Vite)
  docker/           # Dockerfiles and compose
  docs/             # Architecture and design docs

Quick start

1. Inspect subproject READMEs for per-component instructions.
2. Use Docker placeholders in docker/ for containerization planning.
3. No logic is implemented yet — this is a scaffolding step.

Contributing

Follow repository conventions and add work as feature branches. Keep the repo clean — add only meaningful starter code until features are specified.

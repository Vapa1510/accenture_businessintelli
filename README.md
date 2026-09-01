<div align="center">

# NovaMart KPI Engine

> **Full-Stack Business Intelligence Platform with Natural Language Analytics**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)

</div>

---

A production-grade **Business Intelligence KPI Engine** that transforms natural language business queries into actionable metrics, interactive dashboards, and AI-powered insights. Built with a FastAPI backend, React frontend, and deployed on Vercel.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Natural Language KPI Queries** | Ask business questions in plain English; the engine translates them into SQL/KPI computations |
| **Interactive Dashboard** | Real-time data visualizations with drill-down analytics and responsive charts |
| **Multi-KPI Engine** | Revenue, margin, growth rate, customer metrics — all computed on-demand |
| **Production Deployment** | Deployed on Vercel with serverless API functions and edge caching |
| **Design System** | Comprehensive UI/UX component catalog with consistent design language |

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────┐
│                  FRONTEND (React)                    │
│   Dashboard  │  KPI Cards  │  Chart Visualizations   │
└───────────────────────┬─────────────────────────────┘
                        │ REST API
┌───────────────────────┴─────────────────────────────┐
│                  BACKEND (FastAPI)                    │
│   NL Parser  │  KPI Engine  │  Data Aggregation      │
└───────────────────────┬─────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────┐
│              DATA LAYER (PostgreSQL / CSV)            │
│           Retail Analytics Dataset (NovaMart)         │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```text
accenture_businessintelli/
├── api/                        # Vercel serverless API functions
├── backend/                    # FastAPI backend application
│   ├── kpi_engine/             # Core KPI computation engine
│   ├── nl_parser/              # Natural language query parser
│   └── data/                   # Data models and datasets
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page-level layouts
│   │   └── hooks/              # Custom React hooks
│   └── public/
├── docker-compose.yml          # One-command local setup
├── vercel.json                 # Vercel deployment config
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variable template
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker (optional)

### Local Development

```bash
# Clone
git clone https://github.com/Vapa1510/accenture_businessintelli.git
cd accenture_businessintelli

# Backend
cp .env.example .env
pip install -r requirements.txt
cd backend && uvicorn main:app --reload

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

### Docker

```bash
docker-compose up -d
```

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
<sub>Built with ❤️ by <a href="https://github.com/Vapa1510">Vansh</a></sub>
</div>

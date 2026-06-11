# Inventory & Order Management System

A simplified production-ready full-stack Inventory & Order Management System built for a Software Engineer technical assessment.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy
- **Frontend:** React + Vite
- **Database:** PostgreSQL
- **Containerization:** Docker
- **Orchestration:** Docker Compose

## Features

### Product Management

- Add products
- View all products
- View product details by ID
- Update products
- Delete products
- Unique SKU validation
- Non-negative stock validation

### Customer Management

- Add customers
- View all customers
- View customer details by ID
- Delete customers
- Unique email validation

### Order Management

- Create orders for one or more products
- View all orders
- View order details by ID
- Cancel orders
- Backend-calculated total amount
- Inventory validation before placing order
- Automatic stock reduction after successful order creation
- Stock restoration when an order is cancelled

### Dashboard

- Total products
- Total customers
- Total orders
- Low-stock product count

## Project Structure

```txt
inventory-order-management/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── styles.css
│   │   └── components/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Local Setup with Docker Compose

1. Create a local environment file.

```bash
cp .env.example .env
```

2. Update `.env` values if needed.

3. Build and run all services.

```bash
docker compose up --build
```

4. Open the application.

```txt
Frontend: http://localhost:3000
Backend API: http://localhost:8000
Swagger Docs: http://localhost:8000/docs
```

## Backend API Endpoints

### Health

```txt
GET /health
```

### Dashboard

```txt
GET /dashboard/summary
```

### Products

```txt
POST /products
GET /products
GET /products/{id}
PUT /products/{id}
DELETE /products/{id}
```

### Customers

```txt
POST /customers
GET /customers
GET /customers/{id}
DELETE /customers/{id}
```

### Orders

```txt
POST /orders
GET /orders
GET /orders/{id}
DELETE /orders/{id}
```

## Example Product Request

```json
{
  "name": "Wireless Mouse",
  "sku": "MOUSE-001",
  "price": 799.00,
  "quantity_in_stock": 25
}
```

## Example Customer Request

```json
{
  "full_name": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone": "+91 9876543210"
}
```

## Example Order Request

```json
{
  "customer_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

## Business Rules Implemented

- Product SKU must be unique.
- Customer email must be unique.
- Product quantity cannot be negative.
- Orders cannot be placed if inventory is insufficient.
- Creating an order automatically reduces product stock.
- Order total is calculated by the backend.
- API validation and proper HTTP status codes are implemented.

## Docker Hub Backend Image

After building the backend image locally:

```bash
docker build -t your-dockerhub-username/inventory-backend:latest ./backend
docker login
docker push your-dockerhub-username/inventory-backend:latest
```

Add the pushed image link to your final submission.

## Deployment Guide

### Backend on Render

1. Push the repository to GitHub.
2. Create a PostgreSQL database on Render or another free PostgreSQL provider.
3. Create a new Web Service on Render.
4. Select Docker deployment using `backend/Dockerfile`.
5. Add environment variables:
   - `DATABASE_URL`
   - `FRONTEND_ORIGINS`
   - `APP_ENV=production`
6. Deploy and copy the public backend URL.

### Frontend on Vercel

1. Import the GitHub repository into Vercel.
2. Set the root directory to `frontend`.
3. Add environment variable:
   - `VITE_API_BASE_URL=https://your-backend-url.onrender.com`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy and copy the public frontend URL.

## Final Submission Checklist

- GitHub repository link
- Docker Hub backend image link
- Live frontend URL
- Live backend API URL

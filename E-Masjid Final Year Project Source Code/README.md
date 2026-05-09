## E‑Masjid System (MERN)

### Quick start

#### 1) Backend

- **Install**:

```bash
cd backend
npm install
```

- **Configure env**: copy/update values in `backend/.env`
  - **Mongo**: `MONGODB_URI=...`
  - **JWT**: `JWT_SECRET=...`
  - **Stripe (test)**: `STRIPE_SECRET_KEY=...`, `STRIPE_WEBHOOK_SECRET=...`
  - **Email (dev)**: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
  - **Frontend URL**: `CLIENT_URL=http://localhost:5173`

- **Seed sample data (optional)**:

```bash
npm run seed
```

- **Run**:

```bash
npm run dev
```

Backend health: `http://localhost:5000/api/health`

#### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

### Stripe (test mode)

- **Checkout is created** by `POST /api/donations/online` and the browser is redirected to Stripe Checkout.
- **Webhook** endpoint: `POST /api/donations/webhook`
  - Must be configured in Stripe dashboard and use the raw request body.

### Session timeout (1 hour)

- Backend JWT expiry is controlled by `JWT_EXPIRE` in `backend/.env` (default `1h`).
- Frontend stores the token in `localStorage` as `authToken`.

### Weekly backups (MongoDB)

- If using **MongoDB Atlas**, configure automated backups in Atlas.
- For self-hosted MongoDB, use a scheduled job to run `mongodump` weekly and copy the archive to safe storage.


# API Documentation - Find Your Food

This document describes how to use the Supabase backend for the Find Your Food application.

## Database Schema

### Table: `free_food_events`

| Column | Type | Description | Required |
|--------|------|-------------|----------|
| `id` | UUID | Primary key, auto-generated | Auto |
| `event_name` | TEXT | Name of the free food event | ✅ Yes |
| `diet_type` | TEXT | Dietary restrictions (e.g., "vegetarian", "vegan", "gluten-free") | No |
| `cuisine` | TEXT | Type of cuisine (e.g., "Thai", "Mexican", "Italian") | No |
| `location` | JSONB | Map coordinates in format `{"lat": number, "lng": number}` | ✅ Yes |
| `photo` | TEXT | Base64 encoded image string | No |
| `created_at` | TIMESTAMP | Auto-generated timestamp | Auto |
| `updated_at` | TIMESTAMP | Auto-updated timestamp | Auto |

### Example Location Format
```json
{
  "lat": 40.3480,
  "lng": -74.6550
}
```

## API Endpoints

Base URL: `http://localhost:3000` (or your deployed URL)

### 1. Get All Events

**GET** `/api/events`

Returns a list of all free food events.

**Response:**
```json
[
  {
    "id": "d155676d-d7ee-43f3-acff-2c1238ede758",
    "event_name": "Thai Food Night at Frist Campus Center",
    "diet_type": "vegetarian",
    "cuisine": "Thai",
    "location": {
      "lat": 40.348,
      "lng": -74.655
    },
    "photo": null,
    "created_at": "2025-11-22T16:43:48.376162+00:00",
    "updated_at": "2025-11-22T16:43:48.376162+00:00"
  }
]
```

**cURL Example:**
```bash
curl http://localhost:3000/api/events
```

---

### 2. Get Single Event

**GET** `/api/events/:id`

Returns a specific event by ID.

**Parameters:**
- `id` (UUID) - The event ID

**Response:**
```json
{
  "id": "d155676d-d7ee-43f3-acff-2c1238ede758",
  "event_name": "Thai Food Night at Frist Campus Center",
  "diet_type": "vegetarian",
  "cuisine": "Thai",
  "location": {
    "lat": 40.348,
    "lng": -74.655
  },
  "photo": null,
  "created_at": "2025-11-22T16:43:48.376162+00:00",
  "updated_at": "2025-11-22T16:43:48.376162+00:00"
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/events/d155676d-d7ee-43f3-acff-2c1238ede758
```

---

### 3. Create New Event

**POST** `/api/events`

Creates a new free food event.

**Request Body:**
```json
{
  "event_name": "Thai Food Night at Frist Campus Center",
  "diet_type": "vegetarian",  // Optional: null or omit if no restrictions
  "cuisine": "Thai",           // Optional: null or omit if not specified
  "location": {                // Required: must have lat and lng
    "lat": 40.3480,
    "lng": -74.6550
  },
  "photo": null                // Optional: base64 encoded string or null
}
```

**Required Fields:**
- `event_name` (string)
- `location` (object with `lat` and `lng` as numbers)

**Optional Fields:**
- `diet_type` (string or null)
- `cuisine` (string or null)
- `photo` (string or null)

**Response:**
```json
{
  "id": "d155676d-d7ee-43f3-acff-2c1238ede758",
  "event_name": "Thai Food Night at Frist Campus Center",
  "diet_type": "vegetarian",
  "cuisine": "Thai",
  "location": {
    "lat": 40.348,
    "lng": -74.655
  },
  "photo": null,
  "created_at": "2025-11-22T16:43:48.376162+00:00",
  "updated_at": "2025-11-22T16:43:48.376162+00:00"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "Free Pizza at Nassau Hall",
    "diet_type": null,
    "cuisine": "Italian",
    "location": {"lat": 40.3487, "lng": -74.6590},
    "photo": null
  }'
```

---

### 4. Update Event

**PUT** `/api/events/:id`

Updates an existing event. You can update any combination of fields.

**Parameters:**
- `id` (UUID) - The event ID

**Request Body:**
```json
{
  "event_name": "Updated Event Name",  // Optional
  "diet_type": "vegan",                 // Optional
  "cuisine": "Mexican",                 // Optional
  "location": {"lat": 40.3500, "lng": -74.6600},  // Optional
  "photo": "base64_encoded_string_here"  // Optional
}
```

**Response:**
```json
{
  "id": "d155676d-d7ee-43f3-acff-2c1238ede758",
  "event_name": "Updated Event Name",
  "diet_type": "vegan",
  "cuisine": "Mexican",
  "location": {
    "lat": 40.35,
    "lng": -74.66
  },
  "photo": "base64_encoded_string_here",
  "created_at": "2025-11-22T16:43:48.376162+00:00",
  "updated_at": "2025-11-22T17:00:00.000000+00:00"
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/events/d155676d-d7ee-43f3-acff-2c1238ede758 \
  -H "Content-Type: application/json" \
  -d '{
    "cuisine": "Mexican",
    "diet_type": "vegan"
  }'
```

---

### 5. Delete Event

**DELETE** `/api/events/:id`

Deletes an event by ID.

**Parameters:**
- `id` (UUID) - The event ID

**Response:**
```json
{
  "message": "Event deleted successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/events/d155676d-d7ee-43f3-acff-2c1238ede758
```

---

### 6. Health Check

**GET** `/api/health`

Checks if the server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

## Error Responses

All endpoints may return errors in this format:

```json
{
  "error": "Error message here",
  "details": "Detailed error information"
}
```

**Common Error Codes:**
- `400` - Bad Request (missing required fields, invalid data format)
- `404` - Not Found (event ID doesn't exist)
- `500` - Internal Server Error (database or server error)

**Example Error Response:**
```json
{
  "error": "Failed to create event",
  "details": "Missing required fields"
}
```

---

## Data Format Examples

### Minimal Event (only required fields)
```json
{
  "event_name": "Free Lunch",
  "location": {"lat": 40.3480, "lng": -74.6550}
}
```

### Complete Event (all fields)
```json
{
  "event_name": "Thai Food Night at Frist Campus Center",
  "diet_type": "vegetarian",
  "cuisine": "Thai",
  "location": {"lat": 40.3480, "lng": -74.6550},
  "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### Event with No Dietary Restrictions
```json
{
  "event_name": "Free Pizza Party",
  "diet_type": null,
  "cuisine": "Italian",
  "location": {"lat": 40.3487, "lng": -74.6590},
  "photo": null
}
```

---

## Supabase Connection

The backend uses Supabase for data storage. To connect:

1. **Environment Variables** (in `.env` file):
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=3000
   ```

2. **Table Name**: `free_food_events`

3. **Row Level Security**: Enabled with public read/write access (for development)

---

## Common Use Cases

### Fetch all events for display
```javascript
const response = await fetch('http://localhost:3000/api/events');
const events = await response.json();
```

### Create a new event
```javascript
const newEvent = {
  event_name: "Free Breakfast",
  diet_type: "vegetarian",
  cuisine: "American",
  location: { lat: 40.3480, lng: -74.6550 },
  photo: null
};

const response = await fetch('http://localhost:3000/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newEvent)
});

const createdEvent = await response.json();
```

### Update an event
```javascript
const updates = {
  cuisine: "Mexican",
  diet_type: "vegan"
};

const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updates)
});
```

### Delete an event
```javascript
const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
  method: 'DELETE'
});
```

---

## Notes for AI Assistants

When working with this API:
- Always use the exact field names as shown (e.g., `event_name`, not `eventName`)
- Location must be a JSON object with `lat` and `lng` as numbers
- Optional fields can be `null` or omitted entirely
- All timestamps are in UTC and auto-generated
- Event IDs are UUIDs, not integers
- Photo field accepts base64 encoded strings (with optional data URI prefix)


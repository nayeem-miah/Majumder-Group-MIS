# MajumderGroup API integration map

| Frontend page       | Endpoint                                          | Method                   | Status                                                                |
| ------------------- | ------------------------------------------------- | ------------------------ | --------------------------------------------------------------------- |
| Login / session     | `/auth/login`, `/auth/me`, `/auth/logout`         | POST, GET, POST          | Integrated                                                            |
| Executive dashboard | `/dashboard/summary`                              | GET                      | Integrated                                                            |
| Styles              | `/styles`, `/styles/:id`                          | GET, POST, PATCH, DELETE | Integrated                                                            |
| Production          | `/production`, `/production/:id`                  | GET, POST, PATCH, DELETE | Integrated                                                            |
| Hourly production   | `/production` filters                             | GET                      | Integrated as entry-level view; no hourly aggregation endpoint exists |
| Vehicles            | `/vehicles`, `/vehicles/:id`                      | GET, POST, PATCH, DELETE | Integrated                                                            |
| Trips               | `/trips`, `/trips/:id/{dispatch,complete,cancel}` | GET, POST, PATCH         | Integrated; edit UI awaits dedicated product scope                    |
| CSV upload          | `/production/bulk-upload`                         | POST multipart           | Integrated                                                            |

The API client uses `NEXT_PUBLIC_API_URL`, sends cookies and the backend-issued bearer token, and clears the token plus redirects on HTTP 401. No database or JWT secret is exposed to the browser.

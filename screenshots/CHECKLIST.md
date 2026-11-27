# Majumder Group MIS - Screenshot Submission Checklist

This document details the exact requirements, view endpoints, and verification data for the 5 submission screenshots.

---

### Screenshot 1: Executive MIS Dashboard

- **Target Endpoint:** `GET /api/dashboard/summary` (or Web Frontend Dashboard View)
- **Key Elements to Show:**
  1. **Overall Factory Efficiency** (Weighted average efficiency percentage, total earned minutes vs total available minutes).
  2. **Critical Bottleneck Lines** (Any production line running below 65% efficiency with calculated `additionalPiecesNeeded` and target efficiency).
  3. **Fleet Utilization** (Total active vehicles, currently dispatched count, idle count, utilization percentage).
  4. **Style Completion Progress** (Order quantities vs cumulative produced pieces and completion percentages capped at 100%).

---

### Screenshot 2: Production Efficiency and DHU

- **Target Endpoint:** `GET /api/production` and `GET /api/production/summary`
- **Key Elements to Show:**
  1. Hourly production entries showing: `Floor`, `Line`, `Style`, `Operators`, `Minutes`, `Output`, `Defects`.
  2. **Dynamic Efficiency %:**
     $$\text{Efficiency \%} = \left(\frac{\text{Output Qty} \times \text{SMV}}{\text{Operators Present} \times \text{Working Minutes}}\right) \times 100$$
  3. **Dynamic DHU %:**
     $$\text{DHU \%} = \left(\frac{\text{Defect Qty}}{\text{Output Qty}}\right) \times 100$$

---

### Screenshot 3: Vehicle Time Overlap Error

- **Target Endpoint:** `POST /api/trips`
- **Scenario:** Booking a vehicle during an active time window that overlaps with an existing `Scheduled` or `Dispatched` trip.
- **Overlap Logic:** `existing_departure < new_return AND existing_return > new_departure`
- **Expected Error Output:**

  ```json
  {
    "success": false,
    "statusCode": 409,
    "message": "Vehicle is already booked during this time period"
  }
  ```

---

### Screenshot 4: CSV Transaction Rollback Error

- **Target Endpoint:** `POST /api/production/bulk-upload`
- **Scenario:** Uploading `csv-tests/invalid-style.csv` or `csv-tests/order-limit-exceeded.csv` where one row fails validation.
- **Expected Rollback Output:**

  ```json
  {
    "success": false,
    "statusCode": 400,
    "message": "CSV upload failed. All records have been rolled back.",
    "errors": [
      {
        "row": 3,
        "field": "style_no",
        "message": "Style number NON-EXISTENT-STYLE-999 does not exist"
      }
    ]
  }
  ```

- **Verification:** Showing that prior valid rows in that file were completely rolled back and not persisted.

---

### Screenshot 5: Mobile Responsive Dashboard

- **Viewport:** Mobile View (e.g. 375px / iPhone or Chrome DevTools Responsive View)
- **Key Elements to Show:**
  1. Metric cards stacked cleanly (Overall Efficiency, Fleet Utilization).
  2. Collapsible sidebar / hamburger navigation.
  3. Responsive table or scrollable cards for critical bottleneck lines and styles.

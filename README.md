# BBM Group - Automated Client Onboarding System

A full-stack automated onboarding system built for **Black Belt Management Group (BBMG)** to streamline the insurance agent onboarding process for the **Affinity Advantage Program**.

## Features

- **6-Step Client Onboarding Form** - Collects all information needed to set up LinkedIn Helper 2 automation for new agents
- **Password-Protected Admin Dashboard** - View all clients, their account details, and full onboarding submissions in one place
- **Google Sheets Integration** - Automatically saves all client data to organized Google Sheets tabs via the Sheets API v4
- **Automated Email Notifications** - Sends welcome emails to clients and notification emails to the admin via Brevo API
- **QR Code Generation** - Auto-generated QR code for easy sharing of the onboarding form link
- **Meeting Scheduling** - Clients can schedule their onboarding meeting directly after form submission
- **Account Classification Engine** - Automatically classifies LinkedIn accounts (OLD/MATURE, MEDIUM, NEW) based on account age and connection count to determine safe daily action limits
- **Mobile-Friendly & PWA Ready** - Fully responsive design that works on all devices, installable as an app on mobile

## Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Database:** Google Sheets API v4 (with service account authentication)
- **Email:** Brevo (formerly Sendinblue) Transactional Email API
- **Auth:** Token-based session authentication for dashboard access

## System Architecture

```
Client Form (/) --> POST /api/submit --> Google Sheets + Brevo Emails
Admin Dashboard (/dashboard) --> GET /api/clients --> Google Sheets (protected)
```

## Google Sheet Structure

| Tab | Purpose |
|-----|---------|
| Client Accounts | Quick-reference with key account info (16 columns) |
| Onboarding Submissions | Full form data from every submission (48 columns) |
| Campaign Tracker | Campaign performance metrics per agent |

## Screenshots

### Onboarding Form
6-step multi-page form with progress tracking, conditional fields, and mobile-responsive design.

### Admin Dashboard
Password-protected dashboard with stats cards, client cards with click-to-expand full details, search/filter, and QR code link sharing.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `MAIN_SHEET_ID` | Google Sheets spreadsheet ID |
| `BREVO_API_KEY` | Brevo transactional email API key |
| `BOSS_EMAIL` | Admin notification email |
| `BOSS_NAME` | Admin name |
| `SENDER_EMAIL` | Email sender address |
| `SENDER_NAME` | Email sender display name |
| `DASHBOARD_PASSWORD` | Password for admin dashboard access |
| `MEETING_LINK` | Meeting scheduling URL |

## Author

Built for **Black Belt Management Group** - Affinity Advantage Program

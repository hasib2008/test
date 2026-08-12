# Storm’s Species 🐾

## Overview
Storm’s Species is a pet adoption platform designed to connect people with stray animals in need of loving homes. The project supports the principle of **“Adopt, don’t Shop”**, aiming to reduce euthanasia rates in shelters and give strays a second chance.

---

## Problem Statement
Every year, countless stray animals are left without food or shelter. Many are unspayed, compounding the issue of overpopulation. Shelters are overwhelmed and often forced to euthanise animals after long stays. Storm’s Species addresses this by creating a digital bridge between adopters and shelters.

---

## Goals & Objectives
- Provide a **user-friendly website** for browsing adoptable pets.
- Allow users to **submit adoption applications** online.
- Enable admins to **manage pets and requests** (approve, deny, delete).
- Reduce the number of strays and shelter euthanasia cases.

---

## Team Members & Roles
- **Samantha Talbot** – Project Lead  
- **Vanessa Talbot** – Developer  
- **Jacques Dreyer** – Designer  
- **Gemma Adey** – Tester  

---

## Tech Stack
### Languages
- HTML5  
- CSS3  
- JavaScript (Frontend)  
- Node.js (Backend)  
- SQL (SQLite3 queries)

### Libraries & Frameworks
- [Express.js](https://expressjs.com/) – REST API routing  
- [CORS](https://www.npmjs.com/package/cors) – Secure cross-origin requests  
- [SQLite3](https://www.npmjs.com/package/sqlite3) – Lightweight database engine  

### Tools
- Visual Studio Code  
- npm (Node Package Manager)  
- GitHub (Version Control & Deployment)  

---

## Features
- **Browse Pets:** Filter by species, view details, and adoption status.  
- **Adoption Form:** Submit applications linked to specific pets.  
- **Admin Dashboard:** Login with password `admin123`, manage pets, review and approve/deny requests.  
- **Dynamic Updates:** Adoption status changes reflected in real-time.  
- **Database Integration:** Persistent storage of pets and adoption requests.  

---

## Implementation Plan
| Step | Task | Tools | Time Estimate |
|------|------|-------|---------------|
| 1 | Requirements & Design (UML, DFD, schema) | Documentation | 1 week |
| 2 | Frontend Development | HTML, CSS, JS | 2 weeks |
| 3 | Backend Setup | Node.js, Express, CORS | 2 weeks |
| 4 | Database Implementation | SQLite3 | 1 week |
| 5 | API Development | Express.js, SQLite3 | 2 weeks |
| 6 | Integration | Fetch API | 1 week |
| 7 | Testing | Unit, Integration, Functional | 1 week |
| 8 | Deployment | GitHub Pages, Node.js server | 1 week |
| 9 | Launch & Advertising | Social Media, SPCA partnership | Ongoing |

---

## Testing Plan
- **Unit Testing:** Validate individual functions (form validation, API routes).  
- **Integration Testing:** Ensure frontend and backend communicate correctly.  
- **Functional Testing:** Confirm adoption workflow (browse → apply → approve/deny).  

---

## Challenges & Risk Management
- **Challenge:** Limited reach.  
  - *Mitigation:* Social media advertising, SPCA partnerships.  
- **Challenge:** Handling large image uploads.  
  - *Mitigation:* Consider switching from Base64 to Multer for efficiency.  

---

## Deployment
- **Frontend:** GitHub Pages  
- **Backend:** Node.js server (local or hosted)  
- **Database:** SQLite3 file-based storage  

---

## License
This project is licensed under the [Apache License 2.0](LICENSE) – you are free to use, modify, and distribute the code, provided that proper attribution is given, changes are documented, and usage complies with the terms of the Apache 2.0 license.

---

## Who Will Benefit
- **Animals:** Reduced euthanasia, increased chances of adoption.  
- **Shelters/SPCA staff:** Easier management of adoption requests.  
- **Adopters:** Simple, accessible way to find pets in need of homes.  

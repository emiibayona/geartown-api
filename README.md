# GearTown API

Backend API for **GearTown**, a web application built for a local Trading Card Game (TCG) store.

The project was created to provide a simple and maintainable backend capable of handling product management, user authentication and store operations. Although it was initially developed for a local business, the architecture was designed to be reusable and easy to extend as new features are added.

## Features

* User authentication
* Product management
* Category management
* Order management
* Role-based authorization
* REST API
* SQL database integration

## Tech Stack

* Node.js
* Express.js
* Sequelize
* MySQL
* JWT Authentication

## Project Structure

```
src/
├── controllers/
├── middlewares/
├── models/
├── repositories/
├── routes/
├── services/
└── utils/
```

The project follows a layered architecture to keep business logic separated from routing and database access, making it easier to maintain and scale.

## Future Improvements

Some ideas planned for future iterations include:

* Refresh token authentication
* CI/CD pipeline
* Logging improvements

## Related Project

Frontend repository:

https://github.com/emiibayona/geartown

---

This project was built as a personal learning experience while developing a real-world solution for a local business.

<a name="readme-top"></a>

[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/souravdev-eng/E-com-micro-service">
    <img src="./user-client/src/assets/logo.png" alt="Logo" width="60" height="60">
  </a>
  <h2 align="center">Cloud Native E-com Micro Service Project</h2>
  <p align="center">
    E-com is an microservice based Full-Stack application
  </p>
</div>

<!-- ABOUT THE PROJECT -->

## About The Project

E-com is a commerce project where the main goal is to build a distributed and scalable application with zero downtime.

**Here is some key features:**

- Signup and Login feature with role-based(user, seller and admin)
- User can view, filter, search & sort product
- Add to cart feathers
- Payment Functionality
- Track order delivery
- Cancels order
- Seller dashboard

## Services list & feature details:

## Auth Service 🔑

**API Endpoints**

- `/auth/signup`
- `/auth/login`
- `/auth/forgotPassword`
- `/auth/resetPassword`
- `/auth/updatePassword`
- `/auth/showAllUser`
- `/auth/signout`

**Tech Stack using**

<div style={{display:'flex', gap:'30px'}}>
<img src="https://github.com/get-icon/geticon/raw/master/icons/nodejs-icon.svg" alt="Node.js" width="35px" height="35px">
<img src="https://adware-technologies.s3.amazonaws.com/uploads/technology/thumbnail/20/express-js.png" alt="Express.js" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/postgresql.svg" alt="PostgreSQL" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/typescript-icon.svg" alt="Typescript" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/jest.svg" alt="Jest" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/elasticsearch.svg" alt="Elasticsearch" width="35px" height="35px">
</div>

## Product Service 🔑

**API Endpoints**

- `GET /product`
- `GET /product/<ID>`
- `PATCH /product/<ID>`
- `PATCH /product/update-seller-id/<ID>`
- `DELETE /product/<ID>`

**Tech Stack using**

<div style={{display:'flex', gap:'30px'}}>
<img src="https://github.com/get-icon/geticon/raw/master/icons/nodejs-icon.svg" alt="Node.js" width="35px" height="35px">
<img src="https://adware-technologies.s3.amazonaws.com/uploads/technology/thumbnail/20/express-js.png" alt="Express.js" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/mongodb-icon.svg" alt="MongoDB" width="35px" height="35px">
<img src="https://cdn4.iconfinder.com/data/icons/redis-2/1451/Untitled-2-512.png" alt="Redis" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/elasticsearch.svg" alt="Elasticsearch" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/typescript-icon.svg" alt="Typescript" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/jest.svg" alt="Jest" width="35px" height="35px">
</div>

## Cart Service 🛒

**API Endpoints**

- `GET /cart`
- `POST/PATCH /cart`
- `DELETE /cart/<ID>`

**Tech Stack using**

<div style={{display:'flex', gap:'30px'}}>
<img src="https://github.com/get-icon/geticon/raw/master/icons/nodejs-icon.svg" alt="Node.js" width="35px" height="35px">
<img src="https://adware-technologies.s3.amazonaws.com/uploads/technology/thumbnail/20/express-js.png" alt="Express.js" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/postgresql.svg" alt="PostgreSQL" width="35px" height="35px">
<img src="https://cdn4.iconfinder.com/data/icons/redis-2/1451/Untitled-2-512.png" alt="Redis" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/elasticsearch.svg" alt="Elasticsearch" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/typescript-icon.svg" alt="Typescript" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/jest.svg" alt="Jest" width="35px" height="35px">
</div>

## MFE Client Service

**Micro Frontend Modules (Many modules need to be added here, work in progress)** 🚧

- `user` - User micro frontend
- `dashboard` - Dashboard micro frontend
- `host` - Main host application with module federation

**Features**

- Module Federation with Rspack
- Federated micro front-ends for scalable UI architecture
- Shared component library and type definitions
- Independent deployment and development workflow

**Tech Stack using**

<div style={{display:'flex', gap:'30px', align-item: 'center'}}>
<img src="https://github.com/get-icon/geticon/raw/master/icons/react.svg" alt="React" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/typescript-icon.svg" alt="Typescript" width="30px" height="30px">
<img src="https://images.opencollective.com/rspack/7a6035e/logo/256.png" alt="Rspack" width="35px" height="35px">
<img src="https://i.pinimg.com/474x/19/2c/7e/192c7e8637656cab675eaf9c7f3a44ee.jpg" alt="Mui" width="30px" height="30px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/redux.svg" alt="Redux" width="35px" height="35px">
<img src="https://testing-library.com/img/octopus-64x64.png" alt="react-testing-library" width="35px" height="35px">
</div>

### Built With

For this project, I have carefully chosen my tech stack:

<div style={{display:'flex', gap:'35px', width: '60%', flex-wrap: 'wrap'}}>
<img src="https://github.com/get-icon/geticon/raw/master/icons/react.svg" alt="React" width="35px" height="35px">
<img src="https://images.opencollective.com/rspack/7a6035e/logo/256.png" alt="RSPack" width="35px" height="35px">
<img src="https://i.pinimg.com/474x/19/2c/7e/192c7e8637656cab675eaf9c7f3a44ee.jpg" alt="Mui" width="25px" height="25px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/nextjs-icon.svg" alt="Next.js" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/redux.svg" alt="Redux" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/nodejs-icon.svg" alt="Node.js" width="35px" height="35px">
<img src="https://miro.medium.com/v2/resize:fit:600/1*i2skbfmDsHayHhqPfwt6pA.png" alt="Golang" width="35px" height="35px">
<img src="https://adware-technologies.s3.amazonaws.com/uploads/technology/thumbnail/20/express-js.png" alt="Express.js" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/mongodb-icon.svg" alt="MongoDB" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/postgresql.svg" alt="PostgreSQL" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/jest.svg" alt="Jest" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/typescript-icon.svg" alt="Typescript" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/docker-icon.svg" alt="docker" width="35px" height="35px">
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Kubernetes_logo_without_workmark.svg/500px-Kubernetes_logo_without_workmark.svg.png" alt="kubernetes" width="35px" height="35px">
<img src="https://img.icons8.com/color/600/google-cloud.png" alt="GCP" width="35px" height="35px">
<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9FZGcOId8e2tvMiw57wbiDRBO0luIyp2atw&s" alt="RabbitMQ" width="35px" height="35px">
<img src="https://testing-library.com/img/octopus-64x64.png" alt="react-testing-library" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/npm.svg" alt="NPM" width="40px" height="40px">
<img src="https://cdn4.iconfinder.com/data/icons/redis-2/1451/Untitled-2-512.png" alt="Redis" width="35px" height="35px">
<img src="https://github.com/get-icon/geticon/raw/master/icons/elasticsearch.svg" alt="Elasticsearch" width="35px" height="35px">
</div>

## Contact

souravmajumdar.dev@gamil.com

[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/majumdarsourav/

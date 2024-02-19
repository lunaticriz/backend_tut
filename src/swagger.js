import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Express API for VideoTube",
      version: "1.0.0",
      description:
        "This is a REST API application made with Express. It retrieves data from VideoTube.",
      license: {
        name: "Licensed Under MIT",
        url: "https://example.com/licenses/MIT.html", //"https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "JSONPlaceholder",
        url: "", //"https://jsonplaceholder.typicode.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
  },
  apis: [join(__dirname, "src/routes/*.js")],
};

const specs = swaggerJsdoc(options);

export default (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
};

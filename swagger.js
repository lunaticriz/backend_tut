import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Sample API",
    description: "A simple API example",
  },
  host: "localhost:3000",
};

const outputFile = "./swagger_output.json";
const routes = ["./src/routes/*.js"];

export default swaggerAutogen(outputFile, routes, doc);

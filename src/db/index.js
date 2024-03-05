import mongoose from "mongoose";

const connect = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URL}`
    );
    console.info(
      `\n MongoDB connected, DB URL: ${connectionInstance.connection._connectionString}`
    );
  } catch (e) {
    console.error("MongoDB connection error" + e);
    process.exit(1);
  }
};

export default connect;

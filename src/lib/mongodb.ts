/* eslint-disable prefer-const */
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;

if (!uri) {
    throw new Error("Please add MONGODB_URI to .env");
}

// let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

    const client = new MongoClient(uri);
    if (!global._mongoClientPromise) {
    // client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
}

// clientPromise = global._mongoClientPromise;
clientPromise = global._mongoClientPromise?? (global._mongoClientPromise = client.connect());


export default clientPromise;
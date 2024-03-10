import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const schema = buildSchema(`
  type User {
    id: ID!,
    name: String!,
    email: String!,
    memberNo: Int!
  }
  type UserInputType {
    id: ID!,
    name: String!,
    email: String!,
    memberNo: Int!
  }
  input UserInput {
      name: String!,
      email: String!
    }

  type authServiceType {
    id: ID!,
    memberNo: Int!,
    name: String!,
    email: String!,
    token: String!,
    expired: Int!,
    code: Int!,
    message: String
  }
  type userServiceType {
    memberNo: Int!,
    name: String!,
    email: String!
  }
  type paymentServiceType {
    memberNo: Int!,
    amount : Int!
  }
  type Query {
      getUsers: [User]
      authService(email: String!): authServiceType
      userService(tokenId: String!, email: String!): userServiceType
      paymentService(memberNo: Int!): paymentServiceType
    }
  type Mutation {
      createUser(input: UserInput): UserInputType
      updateUser(id: ID!, input: UserInput): User
    }
`);
const id = crypto.randomBytes(10).toString("hex");
const idMember = Math.floor(Math.random() * 1000000000);

let users = [
  { id, name: "brachio", email: "brachio@email.com", memberNo: idMember },
];

const root = {
  getUsers: () => {
    return users;
  },
  getOneUser: ({ email }) => {
    const user = users.find((user) => user.email === email);
    if (!user) {
      throw new Error("User not found");
    }
    const response = {
      token: "999999999",
      expired: 600,
      ...user,
    };
    return response;
  },
  authService: ({ email }) => {
    const user = users.find((user) => user.email === email);
    const token = jwt.sign({ email: email }, process.env.JWT_SECRET, {
      expiresIn: "600s",
    });
    // console.log(token);
    // const tokenDecode = jwt.decode(token);
    // console.log(tokenDecode);

    if (!user) {
      return {
        id: "",
        memberNo: "",
        name: "",
        email: "",
        token: "",
        expired: 0,
        code: 404,
        message: "User tidak terdaftar, silahkan daftar terlebih dahulu",
      };
    } else {
      const response = {
        code: 200,
        message: "Success",
        token: token,
        expired: 600,
        ...user,
      };
      return response;
    }
  },
  userService: ({ tokenId, email }) => {
    // console.log(jwt.decode(tokenId).exp);
    // console.log(Date.now() / 1000);
    if (jwt.decode(tokenId).exp < Date.now() / 1000) {
      throw new Error("Token expired");
    }
    const verifyJwt = jwt.verify(tokenId, process.env.JWT_SECRET);
    const user = users.find((user) => user.email === email);

    if (!verifyJwt) {
      throw new Error("Invalid token");
    }
    if (!user) {
      throw new Error("User not found");
    }

    const tokenIdDecode = jwt.decode(tokenId);

    if (tokenIdDecode.email !== email) {
      throw new Error("Invalid token");
    }

    const response = {
      expired: 600,
      ...user,
    };
    return response;
  },
  paymentService: ({ memberNo }) => {
    const user = users.find((user) => user.memberNo === memberNo);
    if (!user) {
      throw new Error("User not found");
    }
    const response = {
      amount: 500000,
      ...user,
    };
    return response;
  },
  createUser: ({ input }) => {
    const id = crypto.randomBytes(10).toString("hex");
    const idMember = Math.floor(Math.random() * 1000000000);
    const user = { id, ...input, memberNo: idMember };
    users.push(user);
    return { id, ...input, memberNo: idMember };
  },
  updateUser: ({ id, input }) => {
    const newUsers = users.map((user) => {
      if (user.id === id) {
        return { ...user, ...input };
      } else {
        return user;
      }
    });
    users = [...newUsers];
    return { id, ...input };
  },
};
const app = express();
app.options("*", cors());
app.use(cors());
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);
app.listen(3000);
console.log("Running a GraphQL API server Successfully");

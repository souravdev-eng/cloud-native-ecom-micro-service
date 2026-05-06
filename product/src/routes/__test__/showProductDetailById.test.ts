import request from "supertest";
import mongoose from "mongoose";
import app from "../../app";

jest.mock("../../services/uploadImageToAws", () => ({
  uploadImageToAws: jest.fn().mockResolvedValue("https://test-bucket.s3.us-east-1.amazonaws.com/test.jpg"),
}));

let userToken: any;
let userPayload: any;
let product: any;

beforeEach(async () => {
  const { token, payload } = global.sellerSignIn();
  userToken = token;
  userPayload = payload;

  let productData1 = {
    title: "Test data 1",
    description: "Test description",
    originalPrice: 200,
    price: 150,
    stockQuantity: 10,
    image: "http://test.png",
    category: "book",
    sellerId: userPayload.id,
  };

  const productData = await request(app)
    .post("/api/product/new")
    .set("Cookie", userToken)
    .send(productData1)
    .expect(201);

  product = productData.body;
});

describe("SHOW PRODUCT BY ID", () => {
  test("should return 200 if product found", async () => {
    await request(app).get(`/api/product/${product.id}`).set("Cookie", userToken).expect(200);
  });

  test("should return 403 if user does not login", async () => {
    await request(app).get(`/api/product/${product.id}`).expect(403);
  });

  test("should return 404 if product does not found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toHexString();
    await request(app).get(`/api/product/${nonExistentId}`).set("Cookie", userToken).expect(404);
  });
});

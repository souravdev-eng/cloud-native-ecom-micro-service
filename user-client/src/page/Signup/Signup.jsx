import React, { useState } from "react";
import Button from "@mui/material/Button";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1>Create your new account</h1>
        <div style={{ margin: "10px 0px" }}>
          <div style={{ padding: "10px 0px" }}>
            <label htmlFor="email">Name</label>
          </div>
          <input
            style={{
              height: "30px",
              width: "300px",
              padding: "10px",
              borderRadius: "12px",
              border: "1px solid #adb5bd",
              fontSize: 16,
            }}
            id="name"
            type="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div style={{ margin: "10px 0px" }}>
          <div style={{ padding: "10px 0px" }}>
            <label htmlFor="email">Email</label>
          </div>
          <input
            style={{
              height: "30px",
              width: "300px",
              padding: "10px",
              borderRadius: "12px",
              border: "1px solid #adb5bd",
              fontSize: 16,
            }}
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <div style={{ padding: "10px 0px" }}>
            <label htmlFor="password">Password</label>
          </div>
          <input
            style={{
              height: "30px",
              width: "300px",
              padding: "10px",
              borderRadius: "12px",
              border: "1px solid #adb5bd",
              fontSize: 16,
            }}
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div style={{ marginTop: "20px" }}>
          <Button
            variant="contained"
            style={{ width: "300px", height: 50, borderRadius: 12 }}
          >
            Sign up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Signup;

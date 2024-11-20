import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../helpers/socket";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async() => {
    const res = await axios.post("http://localhost:4004/api/v1/login",{email:username,password})
    socket.emit("login",res.data.user._id)
    localStorage.setItem("token",res.data.token)
    localStorage.setItem("userID",res.data.user._id)
    navigate("/conversations");
    console.log(res);
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={styles.input}
      />
      <input
        type="text"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
      />
      <button onClick={handleLogin} style={styles.button}>
        Login
      </button>
    </div>
  );
};

const styles = {
  container: { display: "flex", flexDirection: "column", alignItems: "center", marginTop: "50px" },
  input: { padding: "10px", fontSize: "16px", marginBottom: "10px" },
  button: { padding: "10px 20px", fontSize: "16px", cursor: "pointer" },
};

export default Login;

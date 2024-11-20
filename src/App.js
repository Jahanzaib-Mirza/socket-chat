import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Chat from "./components/Chat";
import Conversations from "./components/Conversations";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat/:conversationId" element={<Chat />} />
        <Route path="/conversations" element={<Conversations />} />
      </Routes>
    </Router>
  );
};

export default App;

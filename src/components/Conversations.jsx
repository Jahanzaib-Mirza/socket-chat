import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import socket, { baseUrl } from "../helpers/socket";

const Conversations = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewConversationForm, setShowNewConversationForm] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const navigate = useNavigate();

  const userId = localStorage.getItem("userID");

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${baseUrl}/api/v1/conversations`,
        {
          headers: { Authorization: token },
        }
      );
      console.log(response);
      setConversations(response.data.conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchConversations();
  }, [userId]);

  const handleSelectConversation = (conversation) => {
    const receiver = conversation.participants.find(
      (participant) => participant._id !== userId
    );
    console.log(receiver);
    navigate(`/chat/${conversation._id}`, { state: { receiver } });
  };

  const handleCreateNewConversation = async () => {
    try {
      const messageData = {
        senderId: userId,
        receiverId: newRecipient,
        message: newMessage,
      };
      socket.emit("sendMessage", messageData);
      fetchConversations();
    } catch (error) {
      console.error("Error creating new conversation:", error);
    }
  };

  if (loading) {
    return <p>Loading conversations...</p>;
  }

  return (
    <div>
      <h1>Conversations</h1>

      {/* + Button to Show Form */}
      <button
        onClick={() => setShowNewConversationForm(!showNewConversationForm)}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007BFF",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        + Start New Conversation
      </button>

      {/* Form for New Conversation */}
      {showNewConversationForm && (
        <div style={{ marginTop: "20px" }}>
          <h3>Start a New Conversation</h3>
          <input
            type="text"
            placeholder="Enter recipient's name"
            value={newRecipient}
            onChange={(e) => setNewRecipient(e.target.value)}
            style={{
              display: "block",
              padding: "10px",
              margin: "10px 0",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
          <textarea
            placeholder="Enter your message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{
              display: "block",
              padding: "10px",
              margin: "10px 0",
              width: "100%",
              height: "100px",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handleCreateNewConversation}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28A745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Create Conversation
          </button>
        </div>
      )}

      {/* Conversation List */}
      {conversations.length < 1 ? (
        <p>No conversations found.</p>
      ) : (
        <ul>
          {conversations &&
            conversations.map((conversation) => (
              <li
                key={conversation._id}
                onClick={() => handleSelectConversation(conversation)}
                style={{
                  cursor: "pointer",
                  border: "1px solid #ccc",
                  padding: "10px",
                  margin: "10px 0",
                }}
              >
                <h3>
                  {conversation.participants.length > 1
                    ? conversation.participants.find(
                        (participant) => participant._id !== userId
                      )?.name
                    : "No other participants"}
                </h3>{" "}
                <p>
                  Last Message:{" "}
                  {conversation.lastMessage?.message || "No messages yet"}
                </p>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default Conversations;

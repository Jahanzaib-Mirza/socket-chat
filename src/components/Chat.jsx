import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import socket from "../helpers/socket"; // Your socket helper

const Chat = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const userId = localStorage.getItem("userID");
  const location = useLocation();
  const { receiver } = location.state;

  useEffect(() => {
    // Join the conversation room on component mount
    if (conversationId) {
      socket.emit("joinConversation", conversationId);

      // Fetch existing messages for the conversation
      socket.emit("fetchMessages", { conversationId }, (fetchedMessages) => {
        console.log(fetchedMessages);
        setMessages(fetchedMessages || []);
      });

      // Listen for new messages
      socket.on("receiveMessage", (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });
    }

    // Clean up listeners on unmount
    return () => {
      socket.off("receiveMessage");
    };
  }, [conversationId]);

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage = {
      conversationId,
      senderId: userId,
      receiverId: receiver._id,
      message,
    };

    // Emit the message to the server
    socket.emit("sendMessage", newMessage, (savedMessage) => {
      setMessages((prevMessages) => [...prevMessages, savedMessage]);
    });

    // Clear the input field
    setMessage("");
  };

  return (
    <div style={styles.container}>
      <h2>Chat with {receiver.name}</h2>
      <div style={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              textAlign: msg.senderId === userId ? "right" : "left",
            }}
          >
            <strong>{msg.senderId === userId ? "You" : receiver.name}: </strong>
            {msg.message}
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleSend} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: "20px" },
  chatBox: {
    border: "1px solid #ccc",
    padding: "10px",
    height: "300px",
    overflowY: "scroll",
    display: "flex",
    flexDirection: "column",
  },
  message: { margin: "5px 0" },
  inputContainer: { display: "flex", marginTop: "10px" },
  input: { flex: 1, padding: "10px", fontSize: "16px" },
  button: { padding: "10px 20px", fontSize: "16px", cursor: "pointer" },
};

export default Chat;

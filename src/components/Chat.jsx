import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import socket, { baseUrl } from "../helpers/socket";

const Chat = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const userId = localStorage.getItem("userID");
  const location = useLocation();
  const { receiver } = location.state;
  console.log("messages :", messages);
  useEffect(() => {
    if (conversationId) {
      socket.emit("joinConversation", conversationId);
      socket.emit("fetchMessages", { conversationId }, (fetchedMessages) => {
        console.log(fetchedMessages);
        setMessages(fetchedMessages || []);
      });
      // Listen for incoming messages
      socket.on("receiveMessage", (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });
    }

    return () => {
      socket.off("receiveMessage");
    };
  }, [conversationId]);

  const handleSend = async () => {
    const files = await Promise.all(
      attachments.map(async (file) => {
        const base64 = await convertToBase64(file);
        return {
          base64,
          filename: file.name,
          mimetype: file.type,
        };
      })
    );
    console.log("sending");
    socket.emit(
      "sendMessage",
      {
        conversationId,
        senderId: userId,
        receiverId: receiver._id,
        message,
        files,
      },
      (response) => {
        if (response.error) {
          alert(response.error.message);
        } else {
          setMessage("");
          setAttachments([]);
        }
      }
    );
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]); // Strip the prefix (e.g., `data:image/jpeg;base64,`)
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e) => {
    setAttachments(Array.from(e.target.files));
  };

  const renderAttachments = (attachments) => {
    return attachments.map((attachment, index) => {
      if (attachment.type === "image") {
        return (
          <img
            key={index}
            src={`${baseUrl}${attachment.url}`}
            alt={attachment.name}
            style={{ maxWidth: "200px", margin: "5px" }}
          />
        );
      } else if (attachment.type === "video") {
        return (
          <video
            key={index}
            controls
            style={{ maxWidth: "200px", margin: "5px" }}
          >
            <source src={`${baseUrl}${attachment.url}`} type="video/mp4" />
          </video>
        );
      } else {
        return (
          <a
            key={index}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ margin: "5px" }}
          >
            {attachment.name}
          </a>
        );
      }
    });
  };

  return (
    <div style={styles.container}>
      <h2>Chat with {receiver.name}</h2>
      <div style={styles.chatBox}>
        {messages.map((msg, index) => {
          const isLoggedUser = msg.senderId === userId;
          return (
            <div
              key={index}
              style={{
                ...styles.message,
                alignSelf: isLoggedUser ? "flex-end" : "flex-start",
                backgroundColor: isLoggedUser ? "#d1f7c4" : "#f1f1f1",
                textAlign: isLoggedUser ? "right" : "left",
                borderRadius: "10px",
                padding: "10px",
                maxWidth: "100%",
                margin: "5px",
              }}
            >
              <strong>{isLoggedUser ? "You" : receiver.name}: </strong>
              <p>{msg.message}</p>
              {msg.attachments && renderAttachments(msg.attachments)}
            </div>
          );
        })}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={styles.input}
        />
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          style={styles.fileInput}
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
  },
  message: { margin: "10px 0" },
  inputContainer: { display: "flex", marginTop: "10px", gap: "10px" },
  input: { flex: 1, padding: "10px", fontSize: "16px" },
  fileInput: { padding: "5px", fontSize: "14px" },
  button: { padding: "10px 20px", fontSize: "16px", cursor: "pointer" },
};

export default Chat;

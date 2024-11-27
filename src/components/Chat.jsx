import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import socket, { baseUrl } from "../helpers/socket";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const Chat = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [fileError, setFileError] = useState(""); // For file size validation
  const [isSendDisabled, setIsSendDisabled] = useState(true); // To control the Send button state
  const [typingUser, setTypingUser] = useState(null);

  const userId = localStorage.getItem("userID");
  const location = useLocation();
  const { receiver } = location.state;

  const chatBoxRef = useRef(null);

  // Listen for typing indicator
  useEffect(() => {
    socket.on("userTyping", ({ senderId }) => {
      setTypingUser(senderId);
      setTimeout(() => {
        setTypingUser(null);
      }, 2000); // Clear after 2 seconds
    });

    return () => {
      socket.off("userTyping");
    };
  }, []);

  // Fetch messages when conversationId changes
  useEffect(() => {
    if (conversationId) {
      socket.emit("joinConversation", conversationId);
      socket.emit("fetchMessages", { conversationId }, (fetchedMessages) => {
        setMessages(fetchedMessages || []);
      });

      socket.on("receiveMessage", (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });
    }

    return () => {
      socket.off("receiveMessage");
    };
  }, [conversationId]);

  // Scroll to the bottom on new message
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Emit typing event
  const handleTyping = () => {
    socket.emit("typing", { conversationId, senderId: userId });
  };

  // Send message with attachments
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
        console.log("Response from server:", response);
        setMessage("");
        setAttachments([]);
        setIsSendDisabled(true); // Disable send button after sending
      }
    );
  };

  // Convert file to base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const invalidFile = files.find((file) => file.size > MAX_FILE_SIZE);

    if (invalidFile) {
      setFileError(`File "${invalidFile.name}" exceeds the 20MB limit.`);
      setAttachments([]);
      setIsSendDisabled(true);
    } else {
      setFileError("");
      setAttachments(files);
      setIsSendDisabled(false); // Enable send button when valid file is selected
    }
  };

  // Render attachments
  const renderAttachments = (attachments) => {
    return attachments.map((attachment, index) => {
      if (attachment.type.startsWith("image")) {
        return (
          <img
            key={index}
            src={`${baseUrl}${attachment.url}`}
            alt={attachment.name}
            style={styles.attachmentImage}
          />
        );
      } else if (attachment.type.startsWith("video")) {
        return (
          <video
            key={index}
            controls
            style={styles.attachmentVideo}
          >
            <source src={`${baseUrl}${attachment.url}`} type="video/mp4" />
          </video>
        );
      } else {
        return (
          <a
            key={index}
            href={URL.createObjectURL(attachment)}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.attachmentLink}
          >
            {attachment.name}
          </a>
        );
      }
    });
  };

  // Handle "Enter" key press for sending message
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isSendDisabled) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Chat with {receiver.name}</h2>
      <div ref={chatBoxRef} style={styles.chatBox}>
        {messages.map((msg, index) => {
          const isLoggedUser = msg.senderId === userId;
          return (
            <div
              key={index}
              style={{
                ...styles.message,
                alignSelf: isLoggedUser ? "flex-end" : "flex-start",
                backgroundColor: isLoggedUser ? "#007AFF" : "#2C2C2E",
                color: "#fff",
                textAlign: isLoggedUser ? "right" : "left",
              }}
            >
              <strong>{isLoggedUser ? "You" : receiver.name}: </strong>
              <p style={styles.messageText}>{msg.message}</p>
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
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
            setIsSendDisabled(!e.target.value.trim() && attachments.length === 0);
          }}
          onKeyDown={handleKeyDown}
          style={styles.input}
        />
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          style={styles.fileInput}
        />
        <button
          onClick={handleSend}
          disabled={isSendDisabled}
          style={{
            ...styles.button,
            backgroundColor: isSendDisabled ? "#6C757D" : "#007AFF",
            cursor: isSendDisabled ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </div>
      {fileError && <p style={styles.fileError}>{fileError}</p>}
      {typingUser && <p style={styles.typing}>{typingUser} is typing...</p>}
    </div>
  );
};

// Modernized Styles
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    width: "100vw", // Full width
    height: "100vh", // Full height
    color: "#fff",
  },
  header: {
    fontSize: "1.8rem",
    marginBottom: "20px",
    color: "#5AC8FA",
  },
  chatBox: {
    border: "1px solid #2C2C2E",
    backgroundColor: "#1C1C1E",
    padding: "15px",
    width: "90vw", // 90% of the viewport width
    height: "70vh", // 70% of the viewport height
    overflowY: "scroll",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
  },
  message: {
    margin: "10px 0",
    padding: "10px",
    borderRadius: "10px",
    maxWidth: "80%",
  },
  senderName: {
    fontWeight: "bold",
    marginBottom: "5px",
    fontSize: "0.9rem",
  },
  messageText: {
    fontSize: "1rem",
    margin: 0,
  },
  inputContainer: {
    display: "flex",
    gap: "10px",
    width: "90vw", // Match chat box width
    marginTop: "20px",
  },
  input: {
    flex: 1,
    padding: "10px",
    fontSize: "1rem",
    borderRadius: "10px",
    border: "1px solid #2C2C2E",
    backgroundColor: "#1C1C1E",
    color: "#fff",
  },
  fileInput: {
    padding: "5px",
    fontSize: "0.9rem",
    color: "#5AC8FA",
  },
  button: {
    padding: "10px 20px",
    fontSize: "1rem",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    backgroundColor: "#007AFF",
    cursor: "pointer",
  },
  typingIndicator: {
    marginTop: "10px",
    fontStyle: "italic",
    color: "#5AC8FA",
  },
};
export default Chat;

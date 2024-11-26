import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import socket, { baseUrl } from "../helpers/socket";

const Chat = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [typingUser, setTypingUser] = useState(null);

  const userId = localStorage.getItem("userID");
  const location = useLocation();
  const { receiver } = location.state;

  // Reference to the chat box container
  const chatBoxRef = useRef(null);
  useEffect(() => {
    // Listen for typing event
    socket.on("userTyping", ({ senderId }) => {
      setTypingUser(senderId);

      // Clear typing indicator after a delay
      setTimeout(() => {
        setTypingUser(null);
      }, 2000); // Clear after 2 seconds
    });

    return () => {
      socket.off("userTyping"); // Clean up when component unmounts
    };
  }, []);
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

  // Emit typing event when user starts typing
  const handleTyping = () => {
    socket.emit("typing", { conversationId, senderId:userId });
  };

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]); // This effect will run every time messages change

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
        setMessage(""); // Clear message state
      setAttachments([])
        // Log the response to debug
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.container}>
      <h2>Chat with {receiver.name}</h2>
      <div
        ref={chatBoxRef} // Assign the ref to the chat box container
        style={styles.chatBox}
      >
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
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown} // Listen for "Enter" key press
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
        {typingUser && <div>{typingUser} is typing...</div>}
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

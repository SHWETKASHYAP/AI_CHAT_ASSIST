import { useState, useEffect } from "react";
import io from "socket.io-client";

// Connect to our Backend server
const socket = io.connect("http://localhost:5000");

function App() {
  const [message, setMessage] = useState(""); // What the user is typing
  const [chatLog, setChatLog] = useState([]); // List of all messages

  // useEffect runs ONCE when the app starts
  useEffect(() => {
    // Listen for messages coming FROM the backend
    socket.on("receive_message", (data) => {
      setChatLog((prev) => [...prev, data]);  //--- prev takes out current messages in the array add new message and put in a new array
      //---setChatLog is a state-setter function, React automatically passes the current version of that state into the function. 
      // ---You don't have to define prev anywhere; React provides it for you.
    });

    // Cleanup function: Closes the connection if you close the tab
    return () => socket.off("receive_message");
  }, []);

  const sendMessage = () => {
    if (message !== "") {
      const messageData = {
        text: message,
        time: new Date().toLocaleTimeString(),
      };

      // Send the message TO the backend
      socket.emit("send_message", messageData);
      setMessage(""); // Clear the input box
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>SmartSupport AI Chat</h2>
      
      {/* The Chat Window */}
      <div style={{ border: "1px solid #ccc", height: "300px", overflowY: "scroll", marginBottom: "10px", padding: "10px" }}>
        {chatLog.map((msg, index) => {

          const isPositive = msg.sentiment.includes("Positive");
          const isNegative = msg.sentiment.includes("Negative");
          // Define a color based on sentiment

          const bgColor = 
            isPositive ? "#6bca81" : 
            isNegative ? "#f03d4c" : 
            "#3075ff";

        return (
          <div key={index} style={{ 
            backgroundColor: bgColor, 
            padding: "8px", 
            borderRadius: "8px", 
            marginBottom: "10px",
            transition: "background-color 0.5s ease" // Smooth color change!
    }}>
          <strong>User:</strong> {msg.text} 
         <br />
            <small style={{ fontSize: "10px" }}> {msg.sentiment} | {msg.time}</small>
        </div>
        );
      })}
      </div>

      {/* Input Area */}
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
// Select DOM elements
const chatToggle = document.getElementById('chat-toggle');
const chatWidget = document.getElementById('chat-widget');
const chatClose = document.getElementById('chat-close');
const chatBody = document.getElementById('chat-body');
const chatSend = document.getElementById('chat-send');
const chatMessageInput = document.getElementById('chat-message');

// Global conversation history to track the dialogue
let conversationHistory = [];

// Toggle the chat widget visibility
chatToggle.addEventListener('click', () => {
  chatWidget.style.display = 'flex';
  chatToggle.style.display = 'none';
  
  // Add a welcome message if the chat is empty
  if (chatBody.childElementCount === 0) {
    const welcomeMessage = "Hi, I'm Key, an AI assistant from Pro-Home, Inc. I'm here to provide you with information about our services, programs, and resources. How can I help you learn more about Pro-Home today?";
    appendMessage('bot', welcomeMessage);
    conversationHistory.push({ sender: 'bot', text: welcomeMessage });
  }
});

chatClose.addEventListener('click', () => {
  chatWidget.style.display = 'none';
  chatToggle.style.display = 'block';
});

// Helper: Append a message to the chat body
function appendMessage(sender, text) {
  const msgElem = document.createElement('div');
  // The class will be "chat-message bot" or "chat-message user"
  msgElem.className = `chat-message ${sender}`;
  msgElem.textContent = text;
  chatBody.appendChild(msgElem);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Send a message using the /chat endpoint on your Python server
function sendMessage() {
  const message = chatMessageInput.value.trim();
  if (!message) return;
  
  // Display the user's message and update conversation history
  appendMessage('user', message);
  conversationHistory.push({ sender: 'user', text: message });
  chatMessageInput.value = '';
  
  // Make a POST request to the /chat endpoint
  fetch('http://localhost:9000/chat', { // Replace with your actual server URL
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat: message,
      history: conversationHistory
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Server response was not OK');
    }
    return response.json();
  })
  .then(data => {
    // Append the bot's response and update conversation history
    appendMessage('bot', data.text);
    conversationHistory.push({ sender: 'bot', text: data.text });
  })
  .catch(err => {
    console.error('Error connecting to server:', err);
    appendMessage('bot', 'Error: Could not connect to chat service.');
  });
}

// Attach event listeners for sending messages on button click and Enter key press
chatSend.addEventListener('click', sendMessage);
chatMessageInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

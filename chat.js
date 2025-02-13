// Select DOM elements 
const chatToggle = document.getElementById('chat-toggle');
const chatWidget = document.getElementById('chat-widget');
const chatClose = document.getElementById('chat-close');
const chatBody = document.getElementById('chat-body');
const chatSend = document.getElementById('chat-send');
const chatMessageInput = document.getElementById('chat-message');

// Global conversation history to track the dialogue
let conversationHistory = [];

/**
 * formatMessage converts plain text into HTML with bullet points and headers.
 * - Lines starting with "* " become list items.
 * - Lines starting with "**" and containing "**:" become headers.
 * - Other non-empty lines are wrapped in paragraph tags.
 */
function formatMessage(text) {
  const lines = text.split('\n');
  let formatted = '';
  let inList = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Check for header lines e.g., **Donations:** Description...
    if (trimmed.startsWith('**') && trimmed.includes('**:')) {
      // Close any open list
      if (inList) {
        formatted += '</ul>';
        inList = false;
      }
      // Extract header text and remainder using a regex
      const headerMatch = trimmed.match(/^\*\*(.+?)\*\*:\s*(.*)/);
      if (headerMatch) {
        const headerText = headerMatch[1].trim();
        const remainder = headerMatch[2].trim();
        formatted += `<h3>${headerText}</h3>`;
        if (remainder) {
          formatted += `<p>${remainder}</p>`;
        }
        return; // Skip further processing for this line
      }
    }
    
    // Check for bullet list items
    if (trimmed.startsWith('* ')) {
      if (!inList) {
        formatted += '<ul>';
        inList = true;
      }
      formatted += `<li>${trimmed.substring(2)}</li>`;
    } else {
      // Close list if we're in one
      if (inList) {
        formatted += '</ul>';
        inList = false;
      }
      // Wrap non-empty lines in paragraph tags
      if (trimmed) {
        formatted += `<p>${trimmed}</p>`;
      }
    }
  });
  
  if (inList) {
    formatted += '</ul>';
  }
  
  return formatted;
}

// Updated helper: Append a message to the chat body.
// For bot messages, use innerHTML to render formatted HTML.
// For user messages, use textContent.
function appendMessage(sender, text) {
  const msgElem = document.createElement('div');
  msgElem.className = `chat-message ${sender}`;
  if (sender === 'bot') {
    msgElem.innerHTML = formatMessage(text);
  } else {
    msgElem.textContent = text;
  }
  chatBody.appendChild(msgElem);
  chatBody.scrollTop = chatBody.scrollHeight;
}

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

// Send a message using the /stream endpoint with streaming handling
function sendMessage() {
  const message = chatMessageInput.value.trim();
  if (!message) return;
  
  // Display the user's message and update conversation history
  appendMessage('user', message);
  conversationHistory.push({ sender: 'user', text: message });
  chatMessageInput.value = '';
  
  // Make a POST request to the /stream endpoint
  fetch('https://my-chat-app-1092979417464.us-east1.run.app/stream', {
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
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let botResponse = "";
    
    function read() {
      reader.read().then(({ done, value }) => {
        if (done) {
          // Once complete, append the full bot response
          appendMessage('bot', botResponse);
          conversationHistory.push({ sender: 'bot', text: botResponse });
          return;
        }
        const chunk = decoder.decode(value, { stream: true });
        botResponse += chunk;
        // Optionally update intermediate state here if desired.
        read();
      }).catch(err => {
        console.error("Error reading stream:", err);
        appendMessage('bot', "Error processing stream.");
      });
    }
    read();
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

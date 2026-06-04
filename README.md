Project Overview – RAG-Based AI Chatbot System
🧠 Project Description
AI-powered Retrieval-Augmented Generation (RAG) chatbot system
Designed for restaurant data interaction and intelligent response generation
Users can query menus, recipes, and sales data
System generates context-aware responses using Ollama LLM
Combines structured + unstructured data sources for better accuracy
🏗️ System Architecture
Frontend built using React (Vite)
Backend developed using Node.js and Express
AI layer integrated using Ollama (local LLM)
Hybrid data system using Excel, MySQL, and MongoDB Atlas
Follows RAG (Retrieval-Augmented Generation) architecture
🌐 Frontend (UI Layer)
Built with React (Vite)
Provides interactive chat interface
Includes reusable components:
ChatBox
ChatInput
MessageBubble
Handles API communication with backend
Displays real-time chat responses
⚙️ Backend (Core System)
server.js → main backend entry point
chatController.js → handles chat requests
chatRoutes.js → API endpoints for chatbot
🧩 Services Layer (RAG Logic)
aiQueryParserService.js → understands user intent
queryRouterService.js → routes queries to correct data source
restaurantAnswerService.js → generates final responses
menuService.js → handles menu-related queries
recipeService.js → processes recipe queries
salesService.js → handles sales data
specialityService.js → manages restaurant specialties
🗄️ Data Sources
Excel file → initial dataset (menu, recipes, sales)
MySQL database → structured relational data
MongoDB Atlas → cloud-based dynamic and chat data
🧾 Database Layer
db.js → MySQL connection setup
mysqlReader.js → SQL query execution
excelReader.js → Excel file processing
🧠 Memory System
sessionStore.js → stores chat history and context
enables conversation continuity
🤖 AI Integration
openaiService.js → connects to Ollama / LLM
generates natural language responses
works as final response generator in RAG pipeline
🧪 Testing & Utilities
testExcel.js → used for testing Excel data processing
🐳 Deployment
Dockerfile → containerization for backend deployment
enables scalable and portable system setup
🔄 System Flow
User enters query
AI parser understands intent
Query routed to Excel / MySQL / MongoDB
Relevant data retrieved
LLM (Ollama) generates response
Final answer displayed in chat UI

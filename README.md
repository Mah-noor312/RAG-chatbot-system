**Project Overview – RAG-Based AI Chatbot System**

This project is an AI-powered Retrieval-Augmented Generation (RAG) chatbot designed for restaurant data interaction and intelligent response generation. The system enables users to query restaurant-related information such as menus, recipes, and sales data, and receive accurate, context-aware responses generated using a Large Language Model (Ollama).

The system integrates multiple data sources including Excel files, MySQL database, and MongoDB Atlas, forming a hybrid data architecture. It combines structured data retrieval with AI-based response generation to deliver intelligent conversational outputs.

The project follows a full-stack architecture with a React-based frontend and a Node.js/Express backend, along with AI services and database integrations.

**Project File Structure and Description**
Frontend (User Interface Layer)
Built using React (Vite)
Provides interactive chat interface for users
Handles real-time messaging UI and API communication
Includes reusable components such as ChatBox, ChatInput, and MessageBubble
Manages pages such as chatbot interface, dashboards, and UI views
Communicates with backend through REST APIs
Backend (Core System Logic)
Core Server Files
server.js: Entry point of the backend application
config/db.js: Database connection setup
config/openai.js: AI/LLM configuration (Ollama/OpenAI integration)
Controllers
chatController.js: Handles chat requests and responses
Routes
chatRoutes.js: Defines API endpoints for chatbot communication
Services Layer (Business Logic – RAG Core)
aiQueryParserService.js: Interprets user queries and detects intent
queryRouterService.js: Routes queries to appropriate data source
restaurantAnswerService.js: Generates final structured responses
menuService.js: Handles menu-related queries
recipeService.js: Processes recipe-based requests
salesService.js: Handles sales data queries
specialityService.js: Manages restaurant speciality data
Data Sources
restaurant-data.xlsx: Initial dataset containing menu, recipes, and sales data
MySQL Database: Structured relational data storage
MongoDB Atlas: Cloud-based storage for chat logs and dynamic data
Database Layer
db.js: Handles MySQL connection and configuration
mysqlReader.js: Reads and executes SQL queries
excelReader.js: Reads and processes Excel-based data
Memory System
sessionStore.js: Stores user session and conversation memory for context-aware responses
AI / LLM Integration
openaiService.js: Handles communication with LLM (Ollama)
Generates natural language responses based on retrieved context
Works as the final response generation layer in RAG pipeline
Testing and Utilities
testExcel.js: Used for testing Excel data processing during development
Docker Support
Dockerfile: Containerizes backend for deployment and scalability

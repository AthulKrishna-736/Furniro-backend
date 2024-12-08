// import WebSocket from 'ws';
// import dotenv from 'dotenv';
// import checkUserBlockStatus from './userBlockWS';

// dotenv.config();

// const PORT = proces.env.PORT || 4000

// const wss = new WebSocket.Server({ port: PORT });
// console.log('wss link for check: ', wss);
// const clients = new Set();
// const clientEmails = new Map();


// console.log(`WebSocket server running on ws://localhost:${PORT}`);

// wss.on('connection', (ws) => {
//     console.log('New client connected');
//     ws.send('Welcome to the WebSocket server');

//     ws.on('message', (message) => {
//         console.log('Message received from client:', message);
//         ws.send(`Server echo: ${message}`);
//     });

//     ws.on('close', () => console.log('Client disconnected'));
// });
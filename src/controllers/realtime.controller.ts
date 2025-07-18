import { Server as SocketIOServer } from 'socket.io';
import { RealtimeService } from '../services/speechmatics';

export const setupRealtimeTranscription = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    console.log('a user connected');
    const realtimeService = new RealtimeService(socket);

    socket.on('start_recognition', async () => {
      try {
        await realtimeService.init();
        socket.emit('recognition_started');
      } catch (error) {
        socket.emit('error', `Error initializing Speechmatics client: ${(error as Error).message}`);
      }
    });

    socket.on('send_audio', (audioData) => {
      realtimeService.sendAudio(audioData);
    });

    socket.on('stop_recognition', () => {
      realtimeService.stopRecognition();
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
      realtimeService.stopRecognition();
    });
  });
}; 
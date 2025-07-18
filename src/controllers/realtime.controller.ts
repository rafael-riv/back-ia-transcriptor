import { Server as SocketIOServer } from 'socket.io';
import { RealtimeService } from '../services/speechmatics';

export const setupRealtimeTranscription = (io: SocketIOServer) => {
  const realtimeService = new RealtimeService();

  io.on('connection', (socket) => {
    console.log('a user connected');

    realtimeService.init(socket);

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